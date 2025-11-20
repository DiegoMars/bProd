'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'complete' | 'error'
  error?: string
  photoId?: string
  thumbnailUrl?: string
}

interface PhotoUploadDropzoneProps {
  collectionId?: string
  onUploadComplete?: (photoId: string, thumbnailUrl: string) => void
  onUploadError?: (fileName: string, error: string) => void
}

export function PhotoUploadDropzone({
  collectionId,
  onUploadComplete,
  onUploadError,
}: PhotoUploadDropzoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    if (collectionId) {
      formData.append('collection_id', collectionId)
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw error
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Add files to uploading state
      const newUploadingFiles: UploadingFile[] = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'uploading' as const,
      }))

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles])

      // Upload each file
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        const fileIndex = uploadingFiles.length + i

        try {
          // Update progress to show uploading
          setUploadingFiles((prev) =>
            prev.map((uf, idx) =>
              idx === fileIndex ? { ...uf, progress: 50 } : uf
            )
          )

          const data = await uploadFile(file)

          // Mark as complete
          setUploadingFiles((prev) =>
            prev.map((uf, idx) =>
              idx === fileIndex
                ? {
                    ...uf,
                    progress: 100,
                    status: 'complete',
                    photoId: data.photoId,
                    thumbnailUrl: data.thumbnailUrl,
                  }
                : uf
            )
          )

          onUploadComplete?.(data.photoId, data.thumbnailUrl)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Upload failed'

          // Mark as error
          setUploadingFiles((prev) =>
            prev.map((uf, idx) =>
              idx === fileIndex
                ? { ...uf, status: 'error', error: errorMessage }
                : uf
            )
          )

          onUploadError?.(file.name, errorMessage)
        }
      }
    },
    [collectionId, onUploadComplete, onUploadError, uploadingFiles.length]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'],
    },
    multiple: true,
  })

  // Clear completed/errored files after a delay
  const clearFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, idx) => idx !== index))
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-gray-300 hover:border-primary'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isDragActive ? (
            <p className="text-primary font-medium">Drop the photos here</p>
          ) : (
            <>
              <p className="text-gray-700">
                <span className="font-medium text-primary">Click to upload</span>{' '}
                or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                JPEG, PNG, GIF, WebP, or AVIF
              </p>
            </>
          )}
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uploading</h3>
          {uploadingFiles.map((uf, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uf.file.name}
                </p>
                {uf.status === 'uploading' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uf.progress}%` }}
                    />
                  </div>
                )}
                {uf.status === 'complete' && (
                  <p className="text-sm text-green-600">✓ Uploaded</p>
                )}
                {uf.status === 'error' && (
                  <p className="text-sm text-red-600">✗ {uf.error}</p>
                )}
              </div>
              {uf.status !== 'uploading' && (
                <button
                  onClick={() => clearFile(idx)}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
