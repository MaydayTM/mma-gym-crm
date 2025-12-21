import { useState, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import {
  useSlides,
  useCreateSlide,
  useDeleteSlide,
  useToggleSlideActive,
  useReorderSlides,
  uploadSlideImage,
  deleteSlideImage,
  type GymScreenSlide,
} from '../../../hooks/gymscreen/useSlides';

const CATEGORIES = [
  { value: 'community', label: 'Community' },
  { value: 'event', label: 'Event' },
  { value: 'training', label: 'Training' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'promo', label: 'Promo' },
  { value: 'announcement', label: 'Announcement' },
] as const;

export function SlidesManager() {
  const { data: slides, isLoading } = useSlides();
  const createSlide = useCreateSlide();
  const deleteSlide = useDeleteSlide();
  const toggleActive = useToggleSlideActive();
  const reorderSlides = useReorderSlides();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [draggedSlide, setDraggedSlide] = useState<string | null>(null);

  const handleDragStart = (slideId: string) => {
    setDraggedSlide(slideId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSlide || draggedSlide === targetId) return;
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedSlide || !slides) return;

    const draggedIndex = slides.findIndex(s => s.id === draggedSlide);
    const targetIndex = slides.findIndex(s => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new order
    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(targetIndex, 0, removed);

    // Update sort_order for all slides
    const updates = newSlides.map((slide, index) => ({
      id: slide.id,
      sort_order: index,
    }));

    await reorderSlides.mutateAsync(updates);
    setDraggedSlide(null);
  };

  const handleDelete = async (slide: GymScreenSlide) => {
    if (!confirm('Weet je zeker dat je deze slide wilt verwijderen?')) return;

    try {
      // Delete image from storage first
      await deleteSlideImage(slide.image_url);
      // Then delete the database record
      await deleteSlide.mutateAsync(slide.id);
    } catch (error) {
      console.error('Error deleting slide:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Slideshow Beheer</h2>
          <p className="text-sm text-neutral-400">
            Upload en beheer foto's voor de community slideshow
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Slide
        </button>
      </div>

      {/* Slides Grid */}
      {slides && slides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((slide) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => handleDragStart(slide.id)}
              onDragOver={(e) => handleDragOver(e, slide.id)}
              onDrop={() => handleDrop(slide.id)}
              className={`group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all ${
                draggedSlide === slide.id ? 'opacity-50' : ''
              } ${!slide.is_active ? 'opacity-60' : ''}`}
            >
              {/* Image */}
              <div className="aspect-video relative">
                <img
                  src={slide.image_url}
                  alt={slide.title || 'Slide'}
                  className="w-full h-full object-cover"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => toggleActive.mutate({ id: slide.id, is_active: !slide.is_active })}
                    className={`p-2 rounded-lg ${
                      slide.is_active
                        ? 'bg-amber-400/20 text-amber-400'
                        : 'bg-neutral-500/20 text-neutral-400'
                    } hover:bg-white/20 transition-colors`}
                    title={slide.is_active ? 'Deactiveren' : 'Activeren'}
                  >
                    {slide.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(slide)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                {/* Status badge */}
                {!slide.is_active && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-neutral-900/80 text-neutral-400 text-xs rounded">
                    Inactief
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-neutral-900/80 text-white text-xs rounded capitalize">
                  {slide.category}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {slide.title || 'Geen titel'}
                  </p>
                  {slide.caption && (
                    <p className="text-xs text-neutral-400 truncate">{slide.caption}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-neutral-500">{slide.display_duration}s</span>
                  <GripVertical className="w-4 h-4 text-neutral-500 cursor-grab" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-neutral-500" />
          <p className="text-neutral-400">Nog geen slides toegevoegd</p>
          <p className="text-sm text-neutral-500 mt-1">
            Upload je eerste foto om te beginnen
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-4 py-2 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors"
          >
            Upload Foto
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadSlideModal
          onClose={() => setShowUploadModal(false)}
          onUpload={async (data) => {
            await createSlide.mutateAsync(data);
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}

type SlideCategory = 'event' | 'training' | 'community' | 'achievement' | 'promo' | 'announcement';

interface UploadSlideModalProps {
  onClose: () => void;
  onUpload: (data: {
    image_url: string;
    title: string | null;
    caption: string | null;
    category: SlideCategory;
    display_duration: number;
    sort_order: number;
    is_active: boolean;
  }) => Promise<void>;
}

function UploadSlideModal({ onClose, onUpload }: UploadSlideModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<SlideCategory>('community');
  const [duration, setDuration] = useState(5);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadSlideImage(file);
      await onUpload({
        image_url: imageUrl,
        title: title || null,
        caption: caption || null,
        category,
        display_duration: duration,
        sort_order: 999, // Will be reordered
        is_active: true,
      });
    } catch (error) {
      console.error('Error uploading slide:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Nieuwe Slide</h3>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              preview
                ? 'border-amber-400/50'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full aspect-video object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                <p className="text-neutral-400">
                  Sleep een afbeelding hierheen of klik om te uploaden
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  JPG, PNG, WebP of GIF (max 5MB)
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Titel (optioneel)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bijv. Open Mat December"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Ondertitel (optioneel)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="bijv. Elke zaterdag om 14:00"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Categorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SlideCategory)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Duur (seconden)
              </label>
              <input
                type="number"
                min={3}
                max={30}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploaden...
                </>
              ) : (
                'Toevoegen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
