import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const r2BucketName = process.env.R2_BUCKET_NAME || 'clash-tactics-assets';

// Initialize R2 client if credentials are provided, otherwise fallback to null
export const s3 =
  accountId && accessKeyId && secretAccessKey
    ? new S3Client({
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        region: 'auto',
      })
    : null;

/**
 * Upload helper to Cloudflare R2 bucket.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | Blob | string,
  contentType: string
): Promise<string | null> {
  if (!s3) {
    console.warn('R2 storage client is not configured. File upload skipped.');
    return null;
  }

  const { PutObjectCommand } = await import('@aws-sdk/client-s3');

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );

    // Return the public URL or bucket reference
    const customDomain = process.env.R2_CUSTOM_DOMAIN;
    if (customDomain) {
      return `${customDomain}/${key}`;
    }
    return `https://${r2BucketName}.r2.cloudflarestorage.com/${key}`;
  } catch (error) {
    console.error(`Failed to upload asset ${key} to Cloudflare R2:`, error);
    return null;
  }
}
