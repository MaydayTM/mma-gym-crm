import React, { useState, useRef } from 'react';
import { Plus, X, Image as ImageIcon, Video } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ShopMediaUploaderProps {
  images: string[];
  featuredImage: string | null;
  videoUrl: string | null;
  onImagesChange: (images: string[]) => void;
  onFeaturedImageChange: (url: string | null) => void;
  onVideoUrlChange: (url: string | null) => void;
}

export const ShopMediaUploader: React.FC<ShopMediaUploaderProps> = ({
  images,
  featuredImage,
  videoUrl,
  onImagesChange,
  onFeaturedImageChange,
  onVideoUrlChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('shop-products')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('shop-products').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error('Alleen afbeeldingen zijn toegestaan');
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Afbeelding is te groot (max 5MB)');
        }
        return uploadImage(file);
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter((url): url is string => url !== null);

      const newImages = [...images, ...validUrls];
      onImagesChange(newImages);

      // Set first image as featured if none set
      if (!featuredImage && validUrls.length > 0) {
        onFeaturedImageChange(validUrls[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const url = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    if (featuredImage === url) {
      onFeaturedImageChange(newImages[0] || null);
    }
  };

  const handleSetFeatured = (url: string) => {
    onFeaturedImageChange(url);
  };

  const validateVideoUrl = (url: string): boolean => {
    const pattern = /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//;
    return pattern.test(url);
  };

  return (
    <div className="space-y-6">
      {/* Images Section */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Productafbeeldingen</label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {images.map((url, index) => (
            <div key={url} className="relative group aspect-square">
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className={`w-full h-full object-cover rounded-lg ${
                  featuredImage === url ? 'ring-2 ring-amber-400' : ''
                }`}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetFeatured(url)}
                  className="bg-amber-400 text-gray-900 p-2 rounded-full hover:bg-amber-500 transition-colors"
                  title="Maak hoofdafbeelding"
                >
                  <ImageIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              {featuredImage === url && (
                <span className="absolute top-2 left-2 bg-amber-400 text-gray-900 text-xs font-bold px-2 py-1 rounded">
                  HOOFD
                </span>
              )}
            </div>
          ))}

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-amber-400 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
            ) : (
              <>
                <Plus size={24} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Toevoegen</span>
              </>
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Video Section */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          <Video size={16} className="inline mr-1" />
          Product Video (YouTube/Vimeo)
        </label>
        <input
          type="url"
          value={videoUrl || ''}
          onChange={(e) => {
            const url = e.target.value;
            if (!url) {
              onVideoUrlChange(null);
            } else if (validateVideoUrl(url)) {
              onVideoUrlChange(url);
            }
          }}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        />
        <p className="text-xs text-gray-500 mt-1">
          Plak een YouTube of Vimeo URL voor een productvideo of mockup
        </p>
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};
