import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/collections/[id]
 * Get a single collection with all its photos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: collection, error } = await supabaseAdmin
      .from('collections')
      .select(`
        id,
        slug,
        name,
        is_published,
        created_at,
        collection_photos (
          photo_id,
          sort_index,
          is_featured,
          photos (
            id,
            title,
            alt,
            width,
            height,
            created_at,
            photo_variants (
              id,
              kind,
              format,
              width,
              height,
              bytes,
              url
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching collection:', error)
      return NextResponse.json(
        { error: 'Failed to fetch collection' },
        { status: 500 }
      )
    }

    // Transform the data to a cleaner structure
    const photos = (collection.collection_photos || [])
      .filter((cp: any) => cp.photos !== null)
      .map((cp: any) => ({
        id: cp.photos.id,
        title: cp.photos.title,
        alt: cp.photos.alt,
        width: cp.photos.width,
        height: cp.photos.height,
        createdAt: cp.photos.created_at,
        sortIndex: cp.sort_index,
        isFeatured: cp.is_featured,
        variants: (cp.photos.photo_variants || []).map((v: any) => ({
          id: v.id,
          kind: v.kind,
          format: v.format,
          width: v.width,
          height: v.height,
          bytes: v.bytes,
          url: v.url,
        })),
      }))
      .sort((a: any, b: any) => Number(a.sortIndex) - Number(b.sortIndex))

    const response = {
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      isPublished: collection.is_published,
      createdAt: collection.created_at,
      photos,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
