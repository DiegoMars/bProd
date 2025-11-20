import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * PATCH /api/collections/[id]/reorder
 * Update the sort order of photos in a collection
 *
 * Body: { photoOrders: Array<{ photoId: string, sortIndex: number }> }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: collectionId } = params
    const body = await request.json()
    const { photoOrders } = body

    if (!Array.isArray(photoOrders)) {
      return NextResponse.json(
        { error: 'photoOrders must be an array' },
        { status: 400 }
      )
    }

    // Validate each item in the array
    for (const item of photoOrders) {
      if (!item.photoId || typeof item.photoId !== 'string') {
        return NextResponse.json(
          { error: 'Each item must have a valid photoId' },
          { status: 400 }
        )
      }
      if (typeof item.sortIndex !== 'number') {
        return NextResponse.json(
          { error: 'Each item must have a numeric sortIndex' },
          { status: 400 }
        )
      }
    }

    // Update each photo's sort_index
    // Supabase doesn't support batch updates easily, so we'll do them sequentially
    const updatePromises = photoOrders.map(({ photoId, sortIndex }) =>
      supabaseAdmin
        .from('collection_photos')
        .update({ sort_index: sortIndex })
        .eq('collection_id', collectionId)
        .eq('photo_id', photoId)
    )

    const results = await Promise.all(updatePromises)

    // Check if any updates failed
    const errors = results.filter((result) => result.error)
    if (errors.length > 0) {
      console.error('Error updating photo orders:', errors)
      return NextResponse.json(
        { error: 'Failed to update some photo orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
