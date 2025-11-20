import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/collections
 * List all collections with photo count and featured image
 */
export async function GET() {
  try {
    const { data: collections, error } = await supabaseAdmin
      .from('collections')
      .select(`
        id,
        slug,
        name,
        is_published,
        created_at,
        collection_photos (
          photo_id,
          is_featured,
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching collections:', error)
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      )
    }

    // Transform data to include photo count and featured image thumbnail
    const transformedCollections = collections.map((collection: any) => {
      const photoCount = collection.collection_photos?.length || 0

      // Get the first photo's thumbnail variant (prefer AVIF thumbnail, fallback to WebP or JPEG)
      let featuredImageUrl = null
      if (collection.collection_photos?.[0]?.photos) {
        const photo = collection.collection_photos[0].photos
        const variants = photo.photo_variants || []
        const thumbnail = variants.find((v: any) => v.kind === 'thumb' && v.format === 'avif') ||
                         variants.find((v: any) => v.kind === 'thumb' && v.format === 'webp') ||
                         variants.find((v: any) => v.kind === 'thumb')
        featuredImageUrl = thumbnail?.url || null
      }

      return {
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        isPublished: collection.is_published,
        photoCount,
        featuredImageUrl,
        createdAt: collection.created_at,
      }
    })

    return NextResponse.json(transformedCollections)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/collections
 * Create a new collection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, isPublished } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      )
    }

    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Collection slug is required' },
        { status: 400 }
      )
    }

    // Validate slug format (lowercase alphanumeric with hyphens)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug.trim())) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    const { data: collection, error } = await supabaseAdmin
      .from('collections')
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        is_published: isPublished ?? false,
      })
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A collection with this slug already exists' },
          { status: 409 }
        )
      }
      console.error('Error creating collection:', error)
      return NextResponse.json(
        { error: 'Failed to create collection' },
        { status: 500 }
      )
    }

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
