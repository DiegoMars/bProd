import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * DELETE /api/collections/[id]/photos/[photoId]
 * Remove a photo from a collection (doesn't delete the photo itself)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const { id: collectionId, photoId } = params

    const { error } = await supabaseAdmin
      .from('collection_photos')
      .delete()
      .eq('collection_id', collectionId)
      .eq('photo_id', photoId)

    if (error) {
      console.error('Error removing photo from collection:', error)
      return NextResponse.json(
        { error: 'Failed to remove photo from collection' },
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
