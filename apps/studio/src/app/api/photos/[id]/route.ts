import { NextRequest } from 'next/server';
import { r2, R2_BUCKET_ORIGINALS, R2_BUCKET_VARIANTS } from '@/lib/r2';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const photoId = params.id;

  try {
    // 1) Delete original
    const originalKey = `originals/${photoId}.jpg`;
    await r2.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET_ORIGINALS,
      Key: originalKey,
    }));

    // 2) Delete all variants under variants/{photoId}/ (in batches)
    const prefix = `variants/${photoId}/`;
    let ContinuationToken: string | undefined = undefined;

    do {
      const listed = await r2.send(new ListObjectsV2Command({
        Bucket: R2_BUCKET_VARIANTS,
        Prefix: prefix,
        ContinuationToken,
      }));

      const Contents = listed.Contents ?? [];
      if (Contents.length > 0) {
        await r2.send(new DeleteObjectsCommand({
          Bucket: R2_BUCKET_VARIANTS,
          Delete: {
            Objects: Contents.map(o => ({ Key: o.Key! })),
            Quiet: true,
          },
        }));
      }
      ContinuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (ContinuationToken);

    // 3) Delete DB row (cascades to photo_variants + collection_photos)
    const { error } = await supabaseAdmin
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? 'Delete failed' }, { status: 500 });
  }
}
