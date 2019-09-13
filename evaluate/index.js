const AWS = require("aws-sdk");
const Jimp = require("jimp");

const getImage = async (bucket, key) => {
  try {
    const s3 = new AWS.S3();
    const s3Response = await s3
      .getObject({ Bucket: bucket, Key: key })
      .promise();
    return await Jimp.read(s3Response.Body);
  } catch (ex) {
    console.warn(`Unable to read image s3://${bucket}/${key}`, ex);
    return null;
  }
};

const getImageWidth = async (bucket, key) => {
  const image = await getImage(bucket, key);
  if (!image || !image.bitmap) {
    console.warn("Could not read image", image);
    return 0;
  }

  return image.bitmap.width;
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
  if (!event.Key.startsWith("images/")) {
    console.info(
      `s3://${event.Bucket}/${event.Key} does not match target prefix: images/.  Not processing`
    );
    return { ...event, imageWidth: 0 };
  }
  const imageWidth = await getImageWidth(event.Bucket, event.Key);
  return { Bucket: event.Bucket, Key: event.Key, imageWidth };
};
