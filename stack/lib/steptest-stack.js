const cdk = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
const lambda = require("@aws-cdk/aws-lambda");
const step = require("@aws-cdk/aws-stepfunctions");
const tasks = require("@aws-cdk/aws-stepfunctions-tasks");
const lambdaEventSources = require("@aws-cdk/aws-lambda-event-sources");
const sqs = require("@aws-cdk/aws-sqs");
const sns = require("@aws-cdk/aws-sns");
const s3Notifications = require("@aws-cdk/aws-s3-notifications");

const getLambdaAsset = path => {
  if (process.env.MOCK_LAMBDA_ASSET) {
    return lambda.Code.asset("../stub");
  } else {
    return lambda.Code.asset(path);
  }
};

class SteptestStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    this.s3Bucket = new s3.Bucket(this, "StepFunctionTest", {
      bucketName: "kjjtest1",
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    this.evaluateLambda = new lambda.Function(this, "Evaluate", {
      functionName: "evalute-image",
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: "index.handler",
      code: getLambdaAsset("../evaluate"),
      timeout: cdk.Duration.seconds(60)
    });

    this.processLambda = new lambda.Function(this, "Process", {
      functionName: "process-image",
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: "index.handler",
      code: getLambdaAsset("../process"),
      timeout: cdk.Duration.seconds(60)
    });

    this.copyLambda = new lambda.Function(this, "Copy", {
      functionName: "copy-image",
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: "index.handler",
      code: getLambdaAsset("../copy"),
      timeout: cdk.Duration.seconds(60)
    });

    const evaluateTask = new step.Task(this, "Evaluate Image", {
      task: new tasks.InvokeFunction(this.evaluateLambda)
    });

    const notRelevant = new step.Pass(this, "Not Relevant");

    const copyTask = new step.Task(this, "Copy Small Image", {
      task: new tasks.InvokeFunction(this.copyLambda)
    });

    const processTask = new step.Task(this, "Generate Thumbnail", {
      task: new tasks.InvokeFunction(this.processLambda)
    });

    const imageStepDefinition = evaluateTask.next(
      new step.Choice(this, "NeedThumbnail?")
        .when(
          step.Condition.numberGreaterThan("$.imageWidth", 200),
          processTask
        )
        .when(step.Condition.numberGreaterThan("$.imageWidth", 0), copyTask)
        .otherwise(notRelevant)
    );

    this.imageStepFunc = new step.StateMachine(this, "ImageStepFunction", {
      stateMachineName: "image-processing-step",
      definition: imageStepDefinition
    });

    this.startStepFuncLambda = new lambda.Function(this, "StartStepFunc", {
      functionName: "start-image-step",
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: "index.handler",
      code: getLambdaAsset("../startExec"),
      environment: {
        STEP_FUNCTION_ARN: this.imageStepFunc.stateMachineArn
      },
      timeout: cdk.Duration.seconds(60)
    });

    // this.imageStepFunc.grantStartExecution(this.startStepFuncLambda.role);

    // there is currently a bug with the addEventSource code in the CDK https://github.com/aws/aws-cdk/issues/3318
    // this.startStepFuncLambda.addEventSource(
    //   new lambdaEventSources.S3EventSource(this.s3Bucket, {
    //     events: [s3.EventType.ObjectCreated],
    //     filters: [{ prefix: "image/" }]
    //   })
    // );
    // I also had the same problem trying to have it send events to SQS
    // until then using SNS as a middle-man (That one seemed to not work unless I added the notification and source after)

    this.s3ObjCreationTopic = new sns.Topic(this, "s3ObjCreation");

    this.s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3Notifications.SnsDestination(this.s3ObjCreationTopic)
    );

    this.startStepFuncLambda.addEventSource(
      new lambdaEventSources.SnsEventSource(this.s3ObjCreationTopic)
    );

    this.s3Bucket.grantReadWrite(this.startStepFuncLambda);
    this.s3Bucket.grantReadWrite(this.evaluateLambda);
    this.s3Bucket.grantReadWrite(this.processLambda);
    this.s3Bucket.grantReadWrite(this.copyLambda);
  }
}

module.exports = { SteptestStack };
