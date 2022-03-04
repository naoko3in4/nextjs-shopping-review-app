export const removeBucketPath = (key, bucketName) => {
  return key.slice(bucketName.length + 1) // "/"の分だけ加算している
}