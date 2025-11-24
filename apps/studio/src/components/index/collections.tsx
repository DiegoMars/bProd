'use client'
import { useEffect, useState } from 'react'

interface Collection {
  id: string
  slug: string
  name: string
  photoCount: number
  featuredImageUrl: string
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const response = await fetch('/api/collections')
      if (!response.ok) {
        throw new Error('Failed to fetch collections')
      }
      const data = await response.json()
      setCollections(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections')
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (error) {
    return (
      <section className=''>
       <h2 className='text-xl md:text-2xl'>Collections</h2>
       <p className='text-center py-[1rem]'>Error: {error}</p>
      </section>
    )
  }
  if (!collections) {
    return (
      <section className=''>
       <h2 className='text-xl md:text-2xl'>Collections</h2>
       <p className='text-center py-[1rem]'>Loading collections...</p>
      </section>
    )
  }
  if (collections.length == 0) {
    return (
      <section className=''>
       <h2 className='text-xl md:text-2xl'>Collections</h2>
       <p className='text-center py-[1rem]'>No collections created</p>
      </section>
    )
  }

  return (
    <section className=''>
     <h2 className='text-xl md:text-2xl'>Collections</h2>
      {/* Here should go some map function. Need thumbnail pic, name of collection, and uuid */}
      {/* Should route to a dynamically create collection editor link */}

    </section>
  )
}
