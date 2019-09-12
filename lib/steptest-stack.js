const cdk = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
const lambda = require("@aws-cdk/aws-lambda");
const step = require("@aws-cdk/aws-stepfunctions");
const tasks = require("@aws-cdk/aws-stepfunctions-tasks");
const lambdaEventSources = require("@aws-cdk/aws-lambda-event-sources");
const sqs = require("@aws-cdk/aws-sqs");
const s3Notifications = require("@aws-cdk/aws-s3-notifications");

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
      code: lambda.Code.asset("./evaluate")
    });

    this.processLambda = new lambda.Function(this, "Process", {
      functionName: "process-image",
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: "index.handler",
      code: lambda.Code.asset("./process")
    });

    this.copyLambda = new lambda.Function(this, "Copy", {
      functionName: "copy-image",
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: "index.handler",
      code: lambda.Code.asset("./process")
    });

    const evaluateTask = new step.Task(this, "Evaluate Image", {
      task: new tasks.InvokeFunction(this.evaluateLambda)
    });

    const imageFailed = new step.Fail(this, "Image Failed", {
      cause: "Image could not be processed",
      error: "ImageFail"
    });

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
        .otherwise(imageFailed)
    );

    this.imageStepFunc = new step.StateMachine(this, "ImageStepFunction", {
      stateMachineName: "image-processing-step",
      definition: imageStepDefinition
    });

    this.startStepFuncLambda = new lambda.Function(this, "StartStepFunc", {
      functionName: "start-image-step",
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: "index.handler",
      code: lambda.Code.asset("./startExec"),
      environment: {
        STEP_FUNCTION_ARN: this.imageStepFunc.stateMachineArn
      }
    });

    this.imageStepFunc.grantStartExecution(this.startStepFuncLambda.role);

    // there is currently a bug with the addEventSource code in the CDK https://github.com/aws/aws-cdk/issues/3318
    // this.startStepFuncLambda.addEventSource(
    //   new lambdaEventSources.S3EventSource(this.s3Bucket, {
    //     events: [s3.EventType.ObjectCreated],
    //     filters: [{ prefix: "image/" }]
    //   })
    // );
    // I also had the same problem trying to have it send events to SQS
    //until then need to manually setup the notification

    this.startStepFuncLambda.addPermission(
      "S3LambdaPermission",
      new lambda.CfnPermission(this, "Permission", {
        action: "x",
        functionName: "X",
        principal: "X"
      })
    );
    //     aws lambda add-permission --function-name CreateThumbnail --principal s3.amazonaws.com \
    // --statement-id s3invoke --action "lambda:InvokeFunction" \
    // --source-arn arn:aws:s3:::sourcebucket \
    // --source-account account-id

    this.s3Bucket.grantReadWrite(this.startStepFuncLambda);
    this.s3Bucket.grantReadWrite(this.evaluateLambda);
    this.s3Bucket.grantReadWrite(this.processLambda);
    this.s3Bucket.grantReadWrite(this.copyLambda);
  }
}

module.exports = { SteptestStack };
