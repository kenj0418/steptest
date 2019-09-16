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
        FunctionName: "start-image-step"
      })
    );

    // ideally we'd also check that the ARN is being passed in to the lambda, but I could get that to work.
    // stack.imageStepFunc.stateMachineArn was unresoled when the test were running

    expect(stack).to(haveResource("AWS::SNS::Topic"));

    //todo check that there is a event notification for the topic from the S3
    // this.s3Bucket.addEventNotification(
    //   s3.EventType.OBJECT_CREATED_PUT,
    //   new s3Notifications.SnsDestination(this.s3ObjCreationTopic)
    // );

    //todo check that there is an event source for the lambda from the topic
    // this.startStepFuncLambda.addEventSource(
    //   new lambdaEventSources.SnsEventSource(this.s3ObjCreationTopic)
    // );

    //todo check that the lambda can start execution on the stack
    // this.imageStepFunc.grantStartExecution(this.startStepFuncLambda.role);
  });

  xit("lambdas can read and write from s3 bucket", () => {
    const stack = new SteptestStack();

    //todo check that lambdas can read and write from s3 bucket
    // this.s3Bucket.grantReadWrite(this.startStepFuncLambda);
    // this.s3Bucket.grantReadWrite(this.evaluateLambda);
    // this.s3Bucket.grantReadWrite(this.processLambda);
    // this.s3Bucket.grantReadWrite(this.copyLambda);
  });
});
