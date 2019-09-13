const expect = require("chai").expect;
const randomString = require("random-string");
const awsMock = require("aws-sdk-mock");
const sinon = require("sinon");
const index = require("../index");

describe("copy", () => {
  let testFilename, testEvent, mockCopy;

  beforeEach(() => {
    testFilename = randomString();
    testEvent = {
      Bucket: randomString(),
      Key: `images/${testFilename}`
    };

    mockCopy = sinon.stub();
    awsMock.mock("S3", "copyObject", mockCopy);
  });

  afterEach(() => {
    awsMock.restore();
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

  it("error on copy", async () => {
    const testError = randomString();
    mockCopy.callsArgWith(1, new Error(testError));
    try {
      await index.handler(testEvent, {});
      throw new Error("Expected exception was not thrown");
    } catch (ex) {
      expect(ex.toString()).to.contain.string(testError);
    }
  });

  it("successful copy", async () => {
    mockCopy.callsArg(1);
    await index.handler(testEvent, {});

    expect(mockCopy.callCount).to.equal(1);
    expect(mockCopy.firstCall.args[0]).to.deep.equal({
      CopySource: `${testEvent.Bucket}/${testEvent.Key}`,
      Bucket: testEvent.Bucket,
      Key: `thumbnails/${testFilename}`
    });
  });
});
