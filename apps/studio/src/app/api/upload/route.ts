import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import { r2Client, R2_BUCKET_ORIGINALS, R2_BUCKET_VARIANTS, R2_PUBLIC_BASE_URL } from "@/lib/r2";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Variant sizes and formats
const VARIANT_SIZES = [
  { kind: "thumb", width: 400 },
  { kind: "web", width: 1280 },
  { kind: "retina", width: 2048 },
] as const;

const VARIANT_FORMATS = [
  { format: "avif", quality: 55 },
  { format: "webp", quality: 68 },
  { format: "jpeg", quality: 74 },
] as const;

interface PhotoVariant {
  photo_id: string;
  kind: "thumb" | "web" | "retina";
  format: "avif" | "webp" | "jpeg";
  width: number;
  height: number;
  bytes: number;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const collectionId = formData.get("collection_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique photo ID
    const photoId = crypto.randomUUID();

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process with Sharp to get metadata and auto-rotate
    const image = sharp(buffer, { failOnError: false });
    const metadata = await image.metadata();

    // Auto-rotate based on EXIF orientation
    const rotatedImage = image.rotate();

    // Get final dimensions after rotation
    const { width: finalWidth, height: finalHeight } = await rotatedImage.metadata();

    // Store original to R2 private bucket
    const originalKey = `originals/${photoId}.jpg`;
    const originalBuffer = await rotatedImage.jpeg({ quality: 95, mozjpeg: true }).toBuffer();

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_ORIGINALS,
        Key: originalKey,
        Body: originalBuffer,
        ContentType: "image/jpeg",
      })
    );

    // Generate variants
    const variants: PhotoVariant[] = [];
    const watermarkBase64 = process.env.WATERMARK_PNG_BASE64;
    let watermarkBuffer: Buffer | null = null;

    if (watermarkBase64) {
      watermarkBuffer = Buffer.from(watermarkBase64, "base64");
    }

    for (const size of VARIANT_SIZES) {
      for (const fmt of VARIANT_FORMATS) {
        // Resize image
        let variantImage = rotatedImage.clone().resize(size.width, undefined, {
          fit: "inside",
          withoutEnlargement: true,
        });

        // Apply watermark for web and retina sizes
        if (watermarkBuffer && (size.kind === "web" || size.kind === "retina")) {
          const resizedWatermark = await sharp(watermarkBuffer)
            .resize(Math.floor(size.width * 0.15))
            .toBuffer();

          variantImage = variantImage.composite([
            {
              input: resizedWatermark,
              gravity: "southeast",
              blend: "over",
            },
          ]);
        }

        // Convert to desired format
        let processedImage: sharp.Sharp;
        if (fmt.format === "avif") {
          processedImage = variantImage.avif({ quality: fmt.quality });
        } else if (fmt.format === "webp") {
          processedImage = variantImage.webp({ quality: fmt.quality });
        } else {
          processedImage = variantImage.jpeg({ quality: fmt.quality, mozjpeg: true });
        }

        const variantBuffer = await processedImage.toBuffer();
        const variantMetadata = await sharp(variantBuffer).metadata();

        // Create hash for cache busting
        const hash = crypto.createHash("md5").update(variantBuffer).digest("hex").slice(0, 8);

        // Upload variant to public bucket
        const variantKey = `variants/${photoId}/${hash}_${size.width}.${fmt.format}`;
        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_VARIANTS,
            Key: variantKey,
            Body: variantBuffer,
            ContentType: `image/${fmt.format}`,
            CacheControl: "public, max-age=31536000, immutable",
          })
        );

        // Add to variants array
        variants.push({
          photo_id: photoId,
          kind: size.kind,
          format: fmt.format,
          width: variantMetadata.width!,
          height: variantMetadata.height!,
          bytes: variantBuffer.length,
          url: `${R2_PUBLIC_BASE_URL}/${variantKey}`,
        });
      }
    }

    // Insert photo into database
    const { error: photoError } = await supabaseAdmin.from("photos").insert({
      id: photoId,
      storage_key: originalKey,
      width: finalWidth || null,
      height: finalHeight || null,
      exif: metadata.exif ? JSON.parse(JSON.stringify(metadata.exif)) : null,
      title: null,
      alt: file.name,
    });

    if (photoError) {
      console.error("Error inserting photo:", photoError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Insert variants into database
    const { error: variantsError } = await supabaseAdmin.from("photo_variants").insert(variants);

    if (variantsError) {
      console.error("Error inserting variants:", variantsError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // If collection_id provided, add photo to collection
    if (collectionId) {
      const { error: collectionError } = await supabaseAdmin.from("collection_photos").insert({
        collection_id: collectionId,
        photo_id: photoId,
        sort_index: 100, // Default sort index
        is_featured: false,
      });

      if (collectionError) {
        console.error("Error adding photo to collection:", collectionError);
        // Don't fail the entire upload if collection add fails
      }
    }

    // Return photo data with thumbnail URL
    const thumbVariant = variants.find((v) => v.kind === "thumb" && v.format === "webp");

    return NextResponse.json({
      photoId,
      width: finalWidth,
      height: finalHeight,
      thumbnailUrl: thumbVariant?.url || variants[0]?.url,
      variantCount: variants.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
