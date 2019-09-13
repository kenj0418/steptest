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
    throw ex;
  }
};

const putImage = async (bucket, key, buffer) => {
  const s3 = new AWS.S3();
  const params = {
    Bucket: bucket,
    Key: key,
    Body: buffer
  };
  await s3.putObject(params).promise();
};

const resizeImage = async (
  sourceBucket,
  sourceKey,
  destBucket,
  destKey,
  targetWidth
) => {
  const image = await getImage(sourceBucket, sourceKey);
  if (!image || !image.bitmap) {
    return 0;
  }

  const targetHeight = Math.floor(
    (image.bitmap.height * targetWidth) / image.bitmap.width
  );
  const thumbnail = await image.resize(targetWidth, targetHeight);
  const thumbnailBuffer = await thumbnail.getBufferAsync(Jimp.AUTO);
  await putImage(destBucket, destKey, thumbnailBuffer);
};

const getThumbnailKey = sourceKey =>
  sourceKey.replace(/^images\//, "thumbnails/");

module.exports.handler = async (event, _context) => {
  if (!event || !event.Bucket) {
    console.info("Event", JSON.stringify(event));
    throw new Error("Bucket is missing from event");
  }

  if (!event.Key) {
    console.info("Event", JSON.stringify(event));
    throw new Error("Key is missing from event");
  }

  await resizeImage(
    event.Bucket,
    event.Key,
    event.Bucket,
    getThumbnailKey(event.Key),
    200
  );
  return event;
};
