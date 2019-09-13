const { expect, haveResource } = require("@aws-cdk/assert");
const { SteptestStack } = require("../lib/steptest-stack");

describe("SteptestStack", () => {
  /*
    Items to include for testing:
    - Lambda for evaluating the file (checking that it is a valid image file)
    - Lambda for processing the file if appropriate (generate a thumbnail from a large image)
    - Lambda for copying the file if appropriate (if as already small)
    - Log group
    - Step function - checks the data from the first lambda
    - S3 bucket
    - upload to s3 triggers the step function
  */

  const annoyingFunction = (resourceProps, inspection) => {
    console.log("resourceProps: ", JSON.stringify(resourceProps, null, 2));
    console.log("inspection: ", JSON.stringify(inspection, null, 2));
    return false;
  };

  it("stack has s3 bucket", () => {
    const stack = new SteptestStack();
    expect(stack).to(
      haveResource("AWS::S3::Bucket", { BucketName: "kjjtest1" })
    );
  });

  it("stack has evaluation lambda", () => {
    const stack = new SteptestStack();
    expect(stack).to(
      haveResource("AWS::Lambda::Function", { FunctionName: "evalute-image" })
    );
  });

  it("stack has process lambda", () => {
    const stack = new SteptestStack();
    expect(stack).to(
      haveResource("AWS::Lambda::Function", { FunctionName: "process-image" })
    );
  });

  it("stack has copy lambda", () => {
    const stack = new SteptestStack();
    expect(stack).to(
      haveResource("AWS::Lambda::Function", { FunctionName: "copy-image" })
    );
  });

  it("has step function", () => {
    const stack = new SteptestStack();
    expect(stack).to(
      haveResource("AWS::StepFunctions::StateMachine", {
        StateMachineName: "image-processing-step"
      })
    );
  });

  xit("x", async () => {
    const Jimp = require("jimp");
    const img = await Jimp.read("/Users/Ken/Downloads/cic.png");
    console.log(JSON.stringify(Object.keys(img), null, 2));
    console.log(JSON.stringify(Object.keys(img.bitmap), null, 2));
    console.log(JSON.stringify(img.bitmap.width, null, 2));
    const imgSmall = await img.resize(200, 200);
    console.log(JSON.stringify(Object.keys(imgSmall), null, 2));
  });

  // - Step function - checks the data from the first lambda
  // - upload to s3 triggers the step function
});
