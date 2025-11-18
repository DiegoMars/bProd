import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  // fetch all collections
  const { data: collections, error: cErr } = await supabaseAdmin
    .from('collections')
    .select('id, slug, name, is_published')
    .order('created_at', { ascending: true });
  if (cErr) return Response.json({ error: cErr.message }, { status: 500 });

  // fetch ordered photos in those collections + a thumbnail variant
  const { data: rows, error: pErr } = await supabaseAdmin
    .from('collection_photos')
    .select('collection_id, photo_id, sort_index, photos (id), photo_variants!inner (url, width, format, kind)')
    .order('sort_index', { ascending: true });
  if (pErr) return Response.json({ error: pErr.message }, { status: 500 });

  // reshape into: collections[] with photos: [{ photoId, thumbUrl }]
  const map = new Map<string, { photoId: string; thumbUrl: string }[]>();
  for (const r of rows ?? []) {
    const thumb = (r as any).photo_variants
      .filter((v: any) => v.kind === 'thumb')
      .sort((a: any, b: any) => (a.format === 'webp' ? -1 : 1))[0];
    const arr = map.get(r.collection_id) ?? [];
    arr.push({ photoId: r.photo_id, thumbUrl: thumb?.url });
    map.set(r.collection_id, arr);
  }

  const out = (collections ?? []).map(c => ({
    id: c.id, slug: c.slug, name: c.name, is_published: c.is_published,
    photos: map.get(c.id) ?? [],
  }));
  return Response.json({ collections: out });
}

export async function POST(req: Request) {
  // create a new collection
  const { slug, name, is_published = false } = await req.json();
  if (!slug || !name) return Response.json({ error: 'slug and name required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('collections')
    .insert({ slug, name, is_published })
    .select('id, slug, name, is_published')
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ collection: data });
}
