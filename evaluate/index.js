const AWS = require("aws-sdk");
const jimp = require("jimp");

const getImage = (bucket, key) => {
  try {
    const s3 = new AWS.S3();
    const s3Response = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    return await jimp.read(s3Response.Body)
  } catch (ex) {
    console.warn(`Unable to read image s3://${bucket}/${key}`, ex)
    return null
  }
}

const getImageWidth = async (bucket, key) => {
  const image = getImage(bucket, key)
  if (!image) {
    return 0
  }

  return image.
};

module.exports.handler = async (event, _context) => {
  if (!event || !event.Bucket) {
    console.info("Event", JSON.stringify(event));
    throw new Error("Bucket is missing from event");
  }

  if (!event.Key) {
    console.info("Event", JSON.stringify(event));
    throw new Error("Key is missing from event");
  }

  const prefix = process.env.RELEVANT_PREFIX ? process.env.RELEVANT_PREFIX : "";
  if (!event.Key.startsWith(prefix)) {
    console.info(
      `s3://${event.Bucket}/${event.Key} does not match target prefix: ${prefix}.  Not processing`
    );
    return { ...event, imageWidth: 0 };
  }

  const imageWidth = await getImageWidth(event.Bucket, event.Key);

  return { Bucket: "need bucket", Key: "need key", imageWidth };
};
