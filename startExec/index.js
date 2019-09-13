const AWS = require("aws-sdk");

const transformSNSEvent = event => {
  if (!event || !event.Records || !event.Records.length) {
    console.info("Event", JSON.stringify(event));
    throw new Error("No records found on event");
  }

  if (event.Records.length > 1) {
    console.warn("More than one record received, only first is processed");
    console.info("Event", JSON.stringify(event));
  }

  const record = event.Records[0].Sns;
  if (!record) {
    console.info("Event", JSON.stringify(event));
    throw new Error("Record is not an SNS record");
  }

  const message = JSON.parse(record.Message);
  if (
    !message ||
    !message.Records ||
    !message.Records.length ||
    !message.Records[0].s3
  ) {
    console.info("Event", JSON.stringify(event));
    throw new Error("Record is not an S3 notification");
  }

  const s3Info = message.Records[0].s3;

  const xs3 = {
    configurationId: "ZmJlOWU3NDktZmQwMy00OTRhLWFhMmEtMzc0MDY1OTlkMzdk",
    bucket: {
      name: "kjjtest1",
      ownerIdentity: { principalId: "A315LIGIFFI747" },
      arn: "arn:aws:s3:::kjjtest1"
    },
    object: {
      key: "images/jAOmodA.jpg",
      size: 46294,
      eTag: "b82a346462ce66469076ca24b7334513",
      sequencer: "005D7A849387B36680"
    }
  };

  return {
    Bucket: s3Info.bucket.name,
    Key: s3Info.object.key
  };
};

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
      input: JSON.stringify(transformSNSEvent(event))
    };
    const data = await stepFunc.startExecution(params);
    console.info(`started execution arn: ${data.executionArn}`);
  } catch (ex) {
    console.error("Error launching step function", ex);
    throw ex;
  }
};
