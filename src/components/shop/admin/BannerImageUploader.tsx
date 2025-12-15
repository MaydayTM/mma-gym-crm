import { useState, useRef } from 'react'
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface BannerImageUploaderProps {
  currentUrl: string
  onUrlChange: (url: string) => void
  label?: string
  maxSizeMB?: number
  recommendedSize?: string
}

export function BannerImageUploader({
  currentUrl,
  onUrlChange,
  label = 'Afbeelding URL',
  maxSizeMB = 2,
  recommendedSize,
}: BannerImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('shop-banners')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage.from('shop-banners').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Alleen afbeeldingen zijn toegestaan')
      }

      // Validate file size
      const maxBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxBytes) {
        throw new Error(`Afbeelding is te groot (max ${maxSizeMB}MB)`)
      }

      const url = await uploadImage(file)
      if (url) {
        onUrlChange(url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClear = () => {
    onUrlChange('')
    setError(null)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-300">
        {label}
      </label>

      {/* Preview & URL Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="url"
            value={currentUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent pr-10"
          />
          {currentUrl && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-3 bg-amber-400 text-neutral-950 font-medium rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title="Upload afbeelding"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Size hint */}
      {recommendedSize && (
        <p className="text-xs text-neutral-500">
          Aanbevolen: {recommendedSize}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Preview */}
      {currentUrl && (
        <div className="mt-3">
          <div className="relative w-full max-w-md aspect-[16/9] bg-neutral-800 rounded-lg overflow-hidden">
            <img
              src={currentUrl}
              alt="Banner preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-800/50 opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                Preview
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BannerImageUploader
