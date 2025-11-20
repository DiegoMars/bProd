'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

interface PhotoGridProps {
  photos: Photo[]
  collectionId: string
  onReorder?: (photoOrders: Array<{ photoId: string; sortIndex: number }>) => void
  onRemove?: (photoId: string) => void
}

interface SortablePhotoProps {
  photo: Photo
  onRemove?: (photoId: string) => void
}

function SortablePhoto({ photo, onRemove }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Find best thumbnail (prefer AVIF, fallback to WebP, then JPEG)
  const thumbnail =
    photo.variants.find((v) => v.kind === 'thumb' && v.format === 'avif') ||
    photo.variants.find((v) => v.kind === 'thumb' && v.format === 'webp') ||
    photo.variants.find((v) => v.kind === 'thumb')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-move"
      {...attributes}
      {...listeners}
    >
      {thumbnail && (
        <img
          src={thumbnail.url}
          alt={photo.alt}
          className="w-full h-full object-cover"
          draggable={false}
        />
      )}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.(photo.id)
          }}
          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
          title="Remove from collection"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      {photo.isFeatured && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
          Featured
        </div>
      )}
    </div>
  )
}

export function PhotoGrid({
  photos,
  collectionId,
  onReorder,
  onRemove,
}: PhotoGridProps) {
  const [items, setItems] = useState(photos)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = arrayMove(items, oldIndex, newIndex)

        // Update sort indices based on new positions
        const photoOrders = newItems.map((item, index) => ({
          photoId: item.id,
          sortIndex: index * 10, // Use increments of 10 for easier manual adjustments
        }))

        // Call the reorder callback
        onReorder?.(photoOrders)

        return newItems
      })
    }
  }

  const handleRemove = async (photoId: string) => {
    if (!confirm('Remove this photo from the collection?')) {
      return
    }

    // Optimistically remove from UI
    setItems((items) => items.filter((item) => item.id !== photoId))

    // Call the remove callback
    onRemove?.(photoId)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No photos in this collection yet.</p>
        <p className="text-sm">Upload some photos to get started.</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((photo) => (
            <SortablePhoto key={photo.id} photo={photo} onRemove={handleRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
