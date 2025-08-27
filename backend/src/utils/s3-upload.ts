import AWS from 'aws-sdk';
import { env } from '../config/env';
import { logger } from './logger';

// Configure AWS
AWS.config.update({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

export async function uploadToS3(
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> {
  try {
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}-${file.originalname}`;
    
    const params = {
      Bucket: env.AWS_S3_BUCKET || 'vevurn-pos-assets',
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    
    logger.info('File uploaded to S3 successfully', {
      fileName,
      location: result.Location
    });

    return result.Location;
  } catch (error) {
    logger.error('S3 upload failed:', error);
    throw new Error('File upload failed');
  }
}

export async function deleteFromS3(fileUrl: string): Promise<void> {
  try {
    const key = fileUrl.split('.amazonaws.com/')[1];
    
    if (!key) {
      throw new Error('Invalid S3 URL');
    }

    const params = {
      Bucket: env.AWS_S3_BUCKET || 'vevurn-pos-assets',
      Key: key
    };

    await s3.deleteObject(params).promise();
    
    logger.info('File deleted from S3 successfully', { key });
  } catch (error) {
    logger.error('S3 deletion failed:', error);
    throw new Error('File deletion failed');
  }
}
