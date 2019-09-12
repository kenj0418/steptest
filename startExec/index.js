const AWS = require("aws-sdk");

module.exports.handler = async (event, _context) => {
  const stepArn = process.env.STEP_FUNCTION_ARN;
  if (!stepArn) {
    const errorMsg = "STEP_FUNCTION_ARN environment variable is not set";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const stepFunc = new AWS.StepFunctions();

  try {
    const params = {
      stateMachineArn: stepArn,
      input: JSON.stringify(event)
    };
    const data = await stepFunc.startExecution(params).promise();
    console.info(`started execution arn: ${data.executionArn}`);
  } catch (ex) {
    console.error("Error launching step function", ex);
    throw ex;
  }
};
