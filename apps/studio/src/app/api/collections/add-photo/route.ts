import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type Body = {
  photoId: string;
  collectionSlug: string;
  sortIndex?: number;     // default 100
  isFeatured?: boolean;   // default false
  createIfMissing?: boolean; // default false
  publish?: boolean;      // if creating, set is_published true
  collectionName?: string; // optional human name when creating
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const {
      photoId,
      collectionSlug,
      sortIndex = 100,
      isFeatured = false,
      createIfMissing = false,
      publish = false,
      collectionName,
    } = body;

    if (!photoId || !collectionSlug) {
      return Response.json({ error: 'photoId and collectionSlug are required' }, { status: 400 });
    }

    // 1) Find or create the collection
    let { data: col, error: colErr } = await supabaseAdmin
      .from('collections')
      .select('id, slug, is_published')
      .eq('slug', collectionSlug)
      .maybeSingle();

    if (colErr) return Response.json({ error: colErr.message }, { status: 500 });

    if (!col && createIfMissing) {
      const { data, error } = await supabaseAdmin
        .from('collections')
        .insert({
          slug: collectionSlug,
          name: collectionName ?? collectionSlug,
          is_published: !!publish,
        })
        .select('id, slug, is_published')
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      col = data;
    }

    if (!col) {
      return Response.json({ error: 'Collection not found' }, { status: 404 });
    }

    // 2) Upsert into collection_photos
    // We’ll try insert; if conflict, update sort_index / is_featured
    const { error: insErr } = await supabaseAdmin
      .from('collection_photos')
      .upsert({
        collection_id: col.id,
        photo_id: photoId,
        sort_index: sortIndex,
        is_featured: isFeatured,
      }, { onConflict: 'collection_id,photo_id' });

    if (insErr) return Response.json({ error: insErr.message }, { status: 500 });

    return Response.json({ ok: true, collectionId: col.id });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? 'Add to collection failed' }, { status: 500 });
  }
}
