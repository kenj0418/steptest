const expect = require("chai").expect;
const randomString = require("random-string");
const awsMock = require("aws-sdk-mock");
const sinon = require("sinon");
const Jimp = require("jimp");
const index = require("../index");

describe("process", () => {
  let testFilename, testEvent, mockGet, mockImageRead, mockPut;

  beforeEach(() => {
    testFilename = randomString();
    testEvent = {
      Bucket: randomString(),
      Key: `images/${testFilename}`
    };

    mockGet = sinon.stub();
    mockPut = sinon.stub();
    awsMock.mock("S3", "getObject", mockGet);
    awsMock.mock("S3", "putObject", mockPut);
    mockImageRead = sinon.stub(Jimp, "read");
  });

  afterEach(() => {
    awsMock.restore();
    sinon.restore();
  });

  it("error if no bucket", async () => {
    delete testEvent.Bucket;
    try {
      await index.handler(testEvent, {});
      throw new Error("Expected exception was not thrown");
    } catch (ex) {
      expect(ex.toString()).to.contain.string("Bucket is missing");
    }
  });

  it("error if no key", async () => {
    delete testEvent.Key;
    try {
      await index.handler(testEvent, {});
      throw new Error("Expected exception was not thrown");
    } catch (ex) {
      expect(ex.toString()).to.contain.string("Key is missing");
    }
  });

  it("error from getObject throws error", async () => {
    const testError = randomString();
    mockGet.callsArgWith(1, new Error(testError));
    try {
      await index.handler(testEvent, {});
      throw new Error("Expected exception not received");
    } catch (ex) {
      expect(ex.toString()).to.contain.string(testError);
    }
  });

  it("error from Jimp.read throws error", async () => {
    const testError = randomString();
    mockGet.callsArgWith(1, null, { Body: randomString() });
    mockImageRead.throws(new Error(testError));
    try {
      await index.handler(testEvent, {});
      throw new Error("Expected exception not received");
    } catch (ex) {
      expect(ex.toString()).to.contain.string(testError);
    }
  });

  it("file is resized and written to new location", async () => {
    const testBody = randomString();
    const testWidth = 1234;
    const testHeight = 888;

    const mockResize = sinon.stub();
    mockGet.callsArgWith(1, null, { Body: testBody });
    mockImageRead.resolves({
      bitmap: {
        width: testWidth,
        height: testHeight
      },
      resize: mockResize
    });

    const mockGetBuffer = sinon.stub();
    mockResize.resolves({
      bitmap: {
        width: 200,
        height: 200
      },
      getBufferAsync: mockGetBuffer
    });
    const testResizedData = randomString();
    mockGetBuffer.resolves(testResizedData);

    mockPut.callsArg(1);

    await index.handler(testEvent, {});

    expect(mockGet.callCount).to.equal(1);
    expect(mockGet.firstCall.args[0]).to.deep.equal({
      Bucket: testEvent.Bucket,
      Key: testEvent.Key
    });

    expect(mockImageRead.callCount).to.equal(1);
    expect(mockImageRead.firstCall.args[0]).to.deep.equal(testBody);

    expect(mockResize.callCount).to.equal(1);
    const expectedWidth = 200;
    const expectedHeight = Math.floor((testHeight * 200) / testWidth);
    expect(mockResize.firstCall.args).to.deep.equal([
      expectedWidth,
      expectedHeight
    ]);

    expect(mockGetBuffer.callCount).to.equal(1);

    expect(mockPut.callCount).to.equal(1);
    expect(mockPut.firstCall.args[0]).to.deep.equal({
      Bucket: testEvent.Bucket,
      Key: `thumbnails/${testFilename}`,
      Body: testResizedData
    });
  });
});
