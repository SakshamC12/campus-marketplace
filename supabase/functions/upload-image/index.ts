import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.600.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.600.0";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const body = await req.json();
    const { fileName, fileType } = body;

    const AWS_ACCESS_KEY = Deno.env.get("AWS_ACCESS_KEY");
    const AWS_SECRET_KEY = Deno.env.get("AWS_SECRET_KEY");
    const AWS_REGION = Deno.env.get("AWS_REGION") || "ap-south-1";
    const BUCKET = Deno.env.get("AWS_BUCKET_NAME");

    if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY || !BUCKET) {
      throw new Error("AWS credentials not configured");
    }

    if (!fileName || !fileType) {
      throw new Error("Missing fileName or fileType");
    }

    // Create S3 client
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY,
      },
    });

    // Generate unique filename
    const uniqueName = `${Date.now()}-${fileName}`;

    // Create PutObjectCommand (minimal - no ContentType or ACL in signature)
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: uniqueName,
    });

    // Generate presigned URL (valid for 15 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900,
    });

    // Final public S3 URL
    const fileUrl = `https://${BUCKET}.s3.${AWS_REGION}.amazonaws.com/${uniqueName}`;

    return new Response(
      JSON.stringify({
        uploadUrl,
        fileUrl,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("ERROR:", err);

    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});