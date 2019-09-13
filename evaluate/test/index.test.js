const expect = require("chai").expect;
const randomString = require("random-string");
const awsMock = require("aws-sdk-mock");
const sinon = require("sinon");
const Jimp = require("jimp");
const index = require("../index");

describe("evaluate", () => {
  let testFilename, testEvent, mockGet, mockImageRead;

  beforeEach(() => {
    testFilename = randomString();
    testEvent = {
      Bucket: randomString(),
      Key: `images/${testFilename}`
    };

    mockGet = sinon.stub();
    awsMock.mock("S3", "getObject", mockGet);
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

  it("error from getObject returns 0", async () => {
    const testError = randomString();
    mockGet.callsArgWith(1, new Error(testError));
    const result = await index.handler(testEvent, {});
    expect(result.imageWidth).to.equal(0);
  });

  it("error from Jimp.read  returns 0", async () => {
    const testError = randomString();
    mockGet.callsArgWith(1, null, { Body: randomString() });
    mockImageRead.throws(new Error(testError));
    const result = await index.handler(testEvent, {});
    expect(result.imageWidth).to.equal(0);
  });

  it("file in different location returns 0", async () => {
    testEvent.Key = `${randomString()}/${randomString()}`;
    mockGet.callsArgWith(1, new Error("getObject should not have been called"));
    mockImageRead.throws(new Error("read should not have been called"));
    const result = await index.handler(testEvent, {});
    expect(result.imageWidth).to.equal(0);
    expect(mockGet.callCount).to.equal(0);
    expect(mockImageRead.callCount).to.equal(0);
  });

  it("valid file, returns width", async () => {
    const testBody = randomString();
    const testWidth = 1234;

    mockGet.callsArgWith(1, null, { Body: testBody });
    mockImageRead.resolves({
      bitmap: {
        width: testWidth,
        height: 987
      }
    });
    const result = await index.handler(testEvent, {});

    expect(mockGet.callCount).to.equal(1);
    expect(mockGet.firstCall.args[0]).to.deep.equal({
      Bucket: testEvent.Bucket,
      Key: testEvent.Key
    });
    expect(mockImageRead.callCount).to.equal(1);
    expect(mockImageRead.firstCall.args[0]).to.deep.equal(testBody);

    expect(result.imageWidth).to.equal(testWidth);
  });
});
