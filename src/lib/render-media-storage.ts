import { s3Storage } from '@payloadcms/storage-s3';

export function getRenderMediaStorage() {
  const { R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_BUCKET || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('Render requires R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.');
  }
  const endpoint = new URL(R2_ENDPOINT);
  const localTest = process.env.CI === 'true' && endpoint.hostname === '127.0.0.1';
  if (endpoint.protocol !== 'https:' && !localTest) {
    throw new Error('R2_ENDPOINT must be the HTTPS S3 API endpoint of the private bucket.');
  }

  return s3Storage({
    bucket: R2_BUCKET,
    collections: { media: true },
    // Keep Payload's file routes and access checks for the private bucket.
    config: {
      region: 'auto',
      endpoint: endpoint.origin,
      forcePathStyle: true,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    },
  });
}
