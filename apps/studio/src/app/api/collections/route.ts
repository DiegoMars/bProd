import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Here is where the collections should be retrieved
// Returns
// - array of:
//   - uuids
//   - slug of collections
//   - names of collections
//   - photo count
//   - featured image link
export async function GET() {
  try{
    const { data: collections, error } = await supabaseAdmin
      .from('collections')
      .select(`
        id,
        slug,
        name,
        collection_photos (
          photo_id,
          photos (
            id,
            photo_variants (
              url,
              kind,
              format
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collections: ', error);
      return NextResponse.json(
        { error: 'Failed to fecth collections' },
        { status: 500}
      );
    }

    // Transform data to include photo count and featured image thumbnail
    const transformedCollections = collections.map((collection: any) => {
      const photoCount = collection.collection_photos?.length || 0

      // Get the first photo's thumbnail variant (prefer AVIF thumbnail, fallback to WebP or JPEG)
      let featuredImageUrl = 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg'
      if (collection.collection_photos?.[0]?.photos) {
        const photo = collection.collection_photos[0].photos
        const variants = photo.photo_variants || []
        const thumbnail = variants.find((v: any) => v.kind === 'thumb' && v.format === 'avif') ||
                         variants.find((v: any) => v.kind === 'thumb' && v.format === 'webp') ||
                         variants.find((v: any) => v.kind === 'thumb')
        featuredImageUrl = thumbnail?.url || 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg'
      }

      return {
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        photoCount,
        featuredImageUrl,
      }
    })

    // Make sure to account for no collections and empty collections
    return NextResponse.json(transformedCollections)

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
