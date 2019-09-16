const cdk = require("@aws-cdk/core");
const iam = require("@aws-cdk/aws-iam");

class RolesStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const permissionsBoundary = iam.ManagedPolicy.fromManagedPolicyName(
      this,
      "TestBondary",
      "test-boundary"
    );

    const basicLambdaExecutionPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSLambdaBasicExecutionRole"
    );

    const role = new iam.Role(this, "LambdaRole1", {
      roleName: "test1",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      permissionsBoundary,
      managedPolicies: [basicLambdaExecutionPolicy],
      inlinePolicies: {
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
        }),
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
    });

    //todo change step function arn to use variables for account# and segment?
  }
}

module.exports = { RolesStack };
