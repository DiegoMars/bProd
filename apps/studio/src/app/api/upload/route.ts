import { PutObjectCommand } from '@aws-sdk/client-s3';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { r2, R2_BUCKET_ORIGINALS, R2_BUCKET_VARIANTS } from '@/lib/r2';
import sharp from 'sharp';
import crypto from 'node:crypto';

const WIDTHS = [400, 1280, 2048] as const;
const FORMATS = ['avif', 'webp', 'jpeg'] as const;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File;
  const buf = Buffer.from(await file.arrayBuffer());

  const photoId = crypto.randomUUID();

  // 1) store original to bprod-originals ...
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET_ORIGINALS!,
    Key: `originals/${photoId}.jpg`,
    Body: buf,
    ContentType: file.type || 'image/jpeg',
  }));

  const base = sharp(buf, { failOnError: false }).rotate();
  const meta = await base.metadata();

  const uploads: Array<{
    url: string; width: number; height: number; format: 'avif'|'webp'|'jpeg';
    kind: 'thumb'|'web'|'retina'; bytes: number
  }> = [];

  // 2) generate + upload variants (unchanged except opacity removed)
  for (const width of WIDTHS) {
    for (const format of FORMATS) {
      let img = base.clone().resize({ width, withoutEnlargement: true });
      if (width >= 1280 && process.env.WATERMARK_PNG_BASE64) {
        const wm = Buffer.from(process.env.WATERMARK_PNG_BASE64, 'base64');
        img = img.composite([{ input: wm, gravity: 'southeast' }]); // no opacity field
      }
      if (format === 'avif') img = img.avif({ quality: 55, effort: 4 });
      if (format === 'webp') img = img.webp({ quality: 68 });
      if (format === 'jpeg') img = img.jpeg({ quality: 74, mozjpeg: true });

      const out = await img.toBuffer();
      const hash = crypto.createHash('sha1').update(out).digest('hex').slice(0, 10);
      const key = `variants/${photoId}/${hash}_${width}.${format}`;

      await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET_VARIANTS!,
        Key: key,
        Body: out,
        ContentType: `image/${format}`,
        CacheControl: 'public, max-age=31536000, immutable',
      }));

      uploads.push({
        url: `${process.env.R2_PUBLIC_BASE_URL}/${key}`,
        width,
        height: Math.round((meta.height! * width) / meta.width!),
        format,
        kind: width === 400 ? 'thumb' : width === 1280 ? 'web' : 'retina',
        bytes: out.length,
      });
    }
  }

  // 3) Insert into Supabase
  // photos row
  const { error: pErr } = await supabaseAdmin.from('photos').insert({
    id: photoId,
    storage_key: `originals/${photoId}.jpg`,
    width: meta.width ?? null,
    height: meta.height ?? null,
    exif: meta ?? null,
    title: null,
    alt: '',
  });
  if (pErr) return Response.json({ error: pErr.message }, { status: 500 });

  // photo_variants rows
  const { error: vErr } = await supabaseAdmin.from('photo_variants').insert(
    uploads.map(v => ({
      photo_id: photoId,
      kind: v.kind,
      format: v.format,
      width: v.width,
      height: v.height,
      bytes: v.bytes,
      url: v.url,
    }))
  );
  if (vErr) return Response.json({ error: vErr.message }, { status: 500 });

  return Response.json({ photoId, variants: uploads });
}
