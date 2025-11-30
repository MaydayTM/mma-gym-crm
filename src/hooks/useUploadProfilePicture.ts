import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface UploadResult {
  url: string
  path: string
}

interface UseUploadProfilePictureReturn {
  upload: (memberId: string, file: File) => Promise<UploadResult>
  isUploading: boolean
  error: Error | null
  progress: number
}

export function useUploadProfilePicture(): UseUploadProfilePictureReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)

  const upload = async (memberId: string, file: File): Promise<UploadResult> => {
    setIsUploading(true)
    setError(null)
    setProgress(0)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${memberId}/${Date.now()}.${fileExt}`

      // Delete old profile picture if exists
      const { data: existingFiles } = await supabase.storage
        .from('profile-pictures')
        .list(memberId)

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f) => `${memberId}/${f.name}`)
        await supabase.storage.from('profile-pictures').remove(filesToDelete)
      }

      setProgress(30)

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      setProgress(70)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      setProgress(100)

      return {
        url: urlData.publicUrl,
        path: fileName,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed')
      setError(error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  return { upload, isUploading, error, progress }
}

// Helper to get profile picture URL from path
export function getProfilePictureUrl(path: string | null): string | null {
  if (!path) return null

  const { data } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(path)

  return data?.publicUrl || null
}
