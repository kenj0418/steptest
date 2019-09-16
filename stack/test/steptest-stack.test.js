const { expect, haveResource } = require("@aws-cdk/assert");

const { SteptestStack } = require("../lib/steptest-stack");

describe("SteptestStack", function() {
  beforeEach(() => {
    process.env.MOCK_LAMBDA_ASSET = "TRUE"; // otherwise it takes forever as it builds the lambda deployments
  });

  afterEach(() => {
    delete process.env.MOCK_LAMBDA_ASSET;
  });

  it("stack has s3 bucket", () => {
    const stack = new SteptestStack();

    expect(stack).to(
      haveResource("AWS::S3::Bucket", { BucketName: "kjjtest1" })
    );
    expect(stack).to(
      haveResource("AWS::S3::BucketPolicy", {
        Bucket: stack.resolve(stack.s3Bucket.bucketName)
      })
    );
  });

  it("stack has step function and lambdas", () => {
    const stack = new SteptestStack();

    expect(stack).to(
      haveResource("AWS::Lambda::Function", { FunctionName: "evalute-image" })
    );

    expect(stack).to(
      haveResource("AWS::Lambda::Function", { FunctionName: "process-image" })
    );

    expect(stack).to(
      haveResource("AWS::Lambda::Function", { FunctionName: "copy-image" })
    );

    expect(stack).to(
      haveResource("AWS::StepFunctions::StateMachine", {
        StateMachineName: "image-processing-step"
      })
    );
  });

  it("stack has lambda triggered by s3 that execute stack", () => {
    const stack = new SteptestStack();

    expect(stack).to(
      haveResource("AWS::Lambda::Function", {
        FunctionName: "start-image-step",
        Environment: {
          Variables: {
            STEP_FUNCTION_ARN: stack.resolve(
              stack.imageStepFunc.stateMachineArn
            )
          }
        }
      })
    );

    expect(stack).to(haveResource("AWS::SNS::Topic"));

    expect(stack).to(
      haveResource("Custom::S3BucketNotifications", {
        NotificationConfiguration: {
          TopicConfigurations: [
            {
              Events: ["s3:ObjectCreated:Put"],
              TopicArn: stack.resolve(stack.s3ObjCreationTopic.topicArn)
            }
          ]
        }
      })
    );

    expect(stack).to(
      haveResource("AWS::Lambda::Function", {
        Description:
          'AWS CloudFormation handler for "Custom::S3BucketNotifications" resources (@aws-cdk/aws-s3)'
      })
    );
  });
});
