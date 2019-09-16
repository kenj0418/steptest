const cdk = require("@aws-cdk/core");
const iam = require("@aws-cdk/aws-iam");

class LambdaRoleWithBoundary extends iam.Role {
  constructor(scope, id, roleName, managedPolcies, inlinePolicies) {
    super(scope, id, {
      roleName,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      permissionsBoundary: iam.ManagedPolicy.fromManagedPolicyName(
        scope,
        "TestBoundary-" + id,
        "test-boundary"
      ),
      managedPolicies: managedPolcies ? managedPolcies : [],
      inlinePolicies: inlinePolicies ? inlinePolicies : {}
    });
  }
}

class RolesStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    this.startExecLambdaRole = new LambdaRoleWithBoundary(
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
              resources: [
                "arn:" +
                  cdk.Aws.PARTITION +
                  ":states:*:" +
                  cdk.Aws.ACCOUNT_ID +
                  ":stateMachine:image-processing-step"
              ],
              actions: ["states:StartExecution"]
            })
          ]
        })
      }
    );

    this.LambdaImageRole = new LambdaRoleWithBoundary(
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
              resources: ["arn:" + cdk.Aws.PARTITION + ":s3:::kjjtest1"],
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
  }
}

module.exports = { RolesStack };
