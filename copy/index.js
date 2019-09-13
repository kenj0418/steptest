const AWS = require("aws-sdk");

const copyImage = async (sourceBucket, sourceKey, destBucket, destKey) => {
  const s3 = new AWS.S3();
  const params = {
    CopySource: `${encodeURI(sourceBucket)}/${encodeURI(sourceKey)}`,
    Bucket: destBucket,
    Key: destKey
  };
  await s3.copyObject(params).promise();
};

const getThumbnailKey = sourceKey =>
  sourceKey.replace(/^images\//, "thumbnails/");

module.exports.handler = async (event, _context) => {
  if (!event || !event.Bucket) {
    console.info("Event", JSON.stringify(event));
    throw new Error("Bucket is missing from event");
  } else if (!event.Key) {
    console.info("Event", JSON.stringify(event));
    throw new Error("Key is missing from event");
  }

  await copyImage(
    event.Bucket,
    event.Key,
    event.Bucket,
    getThumbnailKey(event.Key)
  );
  //   return event;
};
