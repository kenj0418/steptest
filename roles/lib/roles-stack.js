const cdk = require("@aws-cdk/core");
const iam = require("@aws-cdk/aws-iam");

class RoleWithBoundary extends iam.Role {
  constructor(scope, id, roleName, assumedBy, managedPolicies, inlinePolicies) {
    super(scope, id, {
      roleName,
      assumedBy,
      permissionsBoundary: iam.ManagedPolicy.fromManagedPolicyName(
        scope,
        "TestBoundary-" + id,
        "test-boundary"
      ),
      managedPolicies: managedPolicies ? managedPolicies : [],
      inlinePolicies: inlinePolicies ? inlinePolicies : {}
    });
  }
}

class LambdaRole extends RoleWithBoundary {
  constructor(scope, id, roleName, managedPolicies, inlinePolicies) {
    super(
      scope,
      id,
      roleName,
      new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies,
      inlinePolicies
    );
  }
}

class StepFunctionRole extends RoleWithBoundary {
  constructor(scope, id, roleName, managedPolicies, inlinePolicies) {
    super(
      scope,
      id,
      roleName,
      new iam.ServicePrincipal("states.amazonaws.com"),
      managedPolicies,
      inlinePolicies
    );
  }
}

const lambdaArn = lambdaName =>
  "arn:" +
  cdk.Aws.PARTITION +
  ":lambda:*:" +
  cdk.Aws.ACCOUNT_ID +
  ":function:" +
  lambdaName;

const stepFunctionArn = stepFunctionName =>
  "arn:" +
  cdk.Aws.PARTITION +
  ":states:*:" +
  cdk.Aws.ACCOUNT_ID +
  ":stateMachine:" +
  stepFunctionName;

const s3BucketArn = bucketName =>
  "arn:" + cdk.Aws.PARTITION + ":s3:::" + bucketName;

class RolesStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    this.startExecLambdaRole = new LambdaRole(
      this,
      "LambdaStartExecLambdaRole",
      "lambda-start-exec-role",
      [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      ],
      {
        StepExec: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: [stepFunctionArn("image-processing-step")],
              actions: ["states:StartExecution"]
            })
          ]
        })
      }
    );

    this.lambdaImageRole = new LambdaRole(
      this,
      "LambdaImageRole",
      "lambda-image-role",
      [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      ],
      {
        S3Read: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: "S3Read",
              resources: [s3BucketArn("kjjtest1")],
              actions: [
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject",
                "s3:PutObject",
                "s3:AbortMultipartUpload"
              ]
            })
          ]
        })
      }
    );

    this.stepFunctionRole = new StepFunctionRole(
      this,
      "StepFunctionRole",
      "image-step-function-role",
      [],
      {
        LambdaInvoke: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: "LambdaInvoke",
              resources: [
                lambdaArn("evaluate-image"),
                lambdaArn("process-image"),
                lambdaArn("copy-image")
              ],
              actions: ["lambda:InvokeFunction"]
            })
          ]
        })
      }
    );

    new cdk.CfnOutput(this, "startExecLambdaRoleOutput", {
      exportName: "ImageStepFunctionLambdaRole",
      description: "ARN for role for lambda to start step function execution",
      value: this.startExecLambdaRole.roleArn
    });

    new cdk.CfnOutput(this, "imageLambdaRoleOutput", {
      exportName: "ImageLambdaRole",
      description:
        "ARN for role for lambda that are part of the image step function",
      value: this.lambdaImageRole.roleArn
    });

    new cdk.CfnOutput(this, "stepFunctionRoleOutput", {
      exportName: "ImageStepFunctionRole",
      description: "ARN for role for image step function",
      value: this.stepFunctionRole.roleArn
    });
  }
}

module.exports = { RolesStack };
