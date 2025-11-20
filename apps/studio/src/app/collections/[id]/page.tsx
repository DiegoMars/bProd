'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PhotoGrid } from '@/components/PhotoGrid'
import { PhotoUploadDropzone } from '@/components/PhotoUploadDropzone'

interface PhotoVariant {
  id: string
  kind: 'thumb' | 'web' | 'retina'
  format: 'avif' | 'webp' | 'jpeg'
  width: number
  height: number
  bytes: number
  url: string
}

interface Photo {
  id: string
  title: string | null
  alt: string
  width: number | null
  height: number | null
  createdAt: string
  sortIndex: number
  isFeatured: boolean
  variants: PhotoVariant[]
}

interface Collection {
  id: string
  slug: string
  name: string
  isPublished: boolean
  createdAt: string
  photos: Photo[]
}

export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCollection = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Collection not found')
        }
        throw new Error('Failed to fetch collection')
      }
      const data = await response.json()
      setCollection(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collection')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCollection()
  }, [collectionId])

  const handleUploadComplete = (photoId: string, thumbnailUrl: string) => {
    // Refresh the collection to show the new photo
    fetchCollection()
  }

  const handleUploadError = (fileName: string, error: string) => {
    console.error(`Upload error for ${fileName}:`, error)
    // You could show a toast notification here
  }

  const handleReorder = async (photoOrders: Array<{ photoId: string; sortIndex: number }>) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoOrders }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder photos')
      }

      // Optionally refresh to ensure consistency
      // fetchCollection()
    } catch (err) {
      console.error('Reorder error:', err)
      // Revert the optimistic update by refetching
      fetchCollection()
    }
  }

  const handleRemove = async (photoId: string) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove photo')
      }

      // The PhotoGrid already removed it optimistically, so we're done
    } catch (err) {
      console.error('Remove error:', err)
      // Revert the optimistic update by refetching
      fetchCollection()
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">Loading collection...</div>
        </div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-red-600 mb-4">Error: {error || 'Collection not found'}</div>
          <Link
            href="/collections"
            className="text-primary hover:text-primary/80 underline"
          >
            Back to Collections
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/collections"
          className="text-primary hover:text-primary/80 flex items-center gap-1 mb-4"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Collections
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{collection.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
              <span>{collection.photos.length} {collection.photos.length === 1 ? 'photo' : 'photos'}</span>
              <span>•</span>
              <span className="font-mono">/{collection.slug}</span>
              <span>•</span>
              <span className={collection.isPublished ? 'text-green-600' : 'text-gray-500'}>
                {collection.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>
        <PhotoUploadDropzone
          collectionId={collectionId}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </div>

      {/* Photos Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Photos</h2>
        <PhotoGrid
          photos={collection.photos}
          collectionId={collectionId}
          onReorder={handleReorder}
          onRemove={handleRemove}
        />
      </div>
    </div>
  )
}
