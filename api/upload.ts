import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || '',
  },
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Missing fileName or fileData' });
    }

    if (!process.env.AWS_ACCESS_KEY || !process.env.AWS_SECRET_KEY || !process.env.AWS_BUCKET_NAME) {
      return res.status(500).json({ error: 'AWS credentials not configured' });
    }

    // Convert base64 to Buffer
    const buffer = Buffer.from(fileData, 'base64');

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg', // Adjust based on actual file type if needed
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Generate public S3 URL
    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileName}`;

    return res.status(200).json({ url: s3Url });
  } catch (error) {
    console.error('S3 upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload to S3',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
