import { supabase } from './supabase';

/**
 * S3 Upload Service via Supabase Edge Function
 * 1. Gets presigned URL from Edge Function
 * 2. Uploads file directly to S3
 * 3. Returns final file URL
 */

export const s3Service = {
  async uploadFile(file: File, _path: string): Promise<string> {
    try {
      // Step 1: Get presigned URL from Edge Function
      const { data, error } = await supabase.functions.invoke('upload-image', {
        body: {
          fileName: file.name,
          fileType: file.type,
        },
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to get upload URL');
      }

      const { uploadUrl, fileUrl } = data;

      if (!uploadUrl || !fileUrl) {
        throw new Error('Invalid response from upload service');
      }

      // Step 2: Upload file to S3 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
      }

      // Step 3: Return final S3 URL
      return fileUrl;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'File upload failed';

      throw new Error(message);
    }
  },
};
