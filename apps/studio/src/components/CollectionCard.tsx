import Link from 'next/link'

interface Collection {
  id: string
  slug: string
  name: string
  isPublished: boolean
  photoCount: number
  featuredImageUrl: string | null
  createdAt: string
}

interface CollectionCardProps {
  collection: Collection
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {collection.featuredImageUrl ? (
          <img
            src={collection.featuredImageUrl}
            alt={collection.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {!collection.isPublished && (
          <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            Draft
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{collection.name}</h3>
        <div className="mt-1 flex items-center justify-between text-sm text-gray-500">
          <span>{collection.photoCount} {collection.photoCount === 1 ? 'photo' : 'photos'}</span>
          <span className="text-xs">/{collection.slug}</span>
        </div>
      </div>
    </Link>
  )
}
