import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { shopSupabase, getShopTenantId } from '../../../lib/shopSupabase';
import { ShopMediaUploader } from './ShopMediaUploader';
import { VariantsManager } from './VariantsManager';
import type { Product, ProductVariant, AvailabilityStatus } from '../../../types/shop';

const productSchema = z.object({
  name: z.string().min(2, 'Naam is verplicht'),
  description: z.string().min(10, 'Beschrijving is te kort'),
  base_price: z.number().min(0, 'Prijs moet positief zijn'),
  presale_price: z.number().min(0).nullable(),
  presale_ends_at: z.string().nullable(),
  availability_status: z.enum(['in_stock', 'presale', 'out_of_stock', 'discontinued']),
  // Preorder options
  allow_preorder: z.boolean(),
  preorder_discount_percent: z.number().min(0).max(100).nullable(),
  preorder_note: z.string().nullable(),
  category: z.enum(['clothing', 'gear', 'accessories']),
  seo_slug: z.string().min(2, 'URL slug is verplicht'),
  is_active: z.boolean(),
  featured: z.boolean(),
  images: z.array(z.string()),
  featured_image: z.string().nullable(),
  video_url: z.string().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

type ProductEditorProps = {
  product: (Product & { variants?: ProductVariant[] }) | null;
  onClose: () => void;
};

export const ProductEditor: React.FC<ProductEditorProps> = ({ product, onClose }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>(
    product?.variants || []
  );

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      base_price: product.base_price,
      presale_price: product.presale_price,
      presale_ends_at: product.presale_ends_at ? product.presale_ends_at.split('T')[0] : null,
      availability_status: product.availability_status,
      allow_preorder: product.allow_preorder ?? false,
      preorder_discount_percent: product.preorder_discount_percent,
      preorder_note: product.preorder_note,
      category: product.category,
      seo_slug: product.seo_slug,
      is_active: product.is_active,
      featured: product.featured,
      images: product.images || [],
      featured_image: product.featured_image,
      video_url: product.video_url,
    } : {
      is_active: true,
      featured: false,
      availability_status: 'in_stock' as AvailabilityStatus,
      allow_preorder: true, // Default: allow preorder
      preorder_discount_percent: 10, // Default: 10% discount
      preorder_note: 'Levering binnen 2-3 weken',
      images: [],
      featured_image: null,
      video_url: null,
      presale_price: null,
      presale_ends_at: null,
      base_price: 0,
      name: '',
      description: '',
      category: 'clothing',
      seo_slug: '',
    },
  });

  const availabilityStatus = watch('availability_status');
  const allowPreorder = watch('allow_preorder');
  const preorderDiscount = watch('preorder_discount_percent');
  const basePrice = watch('base_price');
  const images = watch('images');
  const featuredImage = watch('featured_image');
  const videoUrl = watch('video_url');

  // Calculate preorder price for display
  const preorderPrice = allowPreorder && preorderDiscount
    ? basePrice - (basePrice * (preorderDiscount / 100))
    : basePrice;

  const onSubmit = async (data: ProductFormData) => {
    if (!shopSupabase) {
      setSubmitError('Shop database connectie niet beschikbaar. Controleer VITE_SHOP_SUPABASE_URL en VITE_SHOP_SUPABASE_ANON_KEY.');
      return;
    }

    const tenantId = getShopTenantId();
    if (!tenantId) {
      setSubmitError('Tenant ID niet geconfigureerd. Controleer VITE_SHOP_TENANT_ID.');
      return;
    }

    try {
      setSubmitError(null);

      // Prepare product data (include tenant_id for new products)
      const productData = {
        name: data.name,
        description: data.description,
        base_price: data.base_price,
        presale_price: data.presale_price,
        presale_ends_at: data.presale_ends_at ? new Date(data.presale_ends_at).toISOString() : null,
        availability_status: data.availability_status,
        allow_preorder: data.allow_preorder,
        preorder_discount_percent: data.allow_preorder ? data.preorder_discount_percent : null,
        preorder_note: data.allow_preorder ? data.preorder_note : null,
        category: data.category,
        seo_slug: data.seo_slug,
        is_active: data.is_active,
        featured: data.featured,
        images: data.images,
        featured_image: data.featured_image,
        video_url: data.video_url,
        ...(product ? {} : { tenant_id: tenantId }), // Only include tenant_id for new products
      };

      let productId = product?.id;

      if (product) {
        // Update existing product
        const { error } = await shopSupabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
      } else {
        // Create new product
        const { data: newProduct, error } = await shopSupabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        productId = newProduct.id;
      }

      // Handle variants
      if (productId) {
        // Delete existing variants if updating
        if (product) {
          await shopSupabase
            .from('product_variants')
            .delete()
            .eq('product_id', productId);
        }

        // Insert new variants
        if (variants.length > 0) {
          const variantsToInsert = variants.map(v => ({
            product_id: productId,
            tenant_id: tenantId,
            name: v.name || '',
            size: v.size || null,
            color: v.color || null,
            sku: v.sku || null,
            price_adjustment: v.price_adjustment || 0,
            stock_quantity: v.stock_quantity || 0,
            low_stock_alert: v.low_stock_alert || 5,
            is_active: v.is_active !== false,
          }));

          const { error: variantError } = await shopSupabase
            .from('product_variants')
            .insert(variantsToInsert);

          if (variantError) throw variantError;
        }
      }

      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Er is een fout opgetreden bij het opslaan';
      setSubmitError(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Product Bewerken' : 'Nieuw Product'}
          </h2>
          <button onClick={onClose} className="text-2xl hover:text-gray-600 text-gray-400">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Naam *</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">URL Slug *</label>
              <input
                {...register('seo_slug')}
                className="w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                placeholder="reconnect-t-shirt-zwart"
              />
              {errors.seo_slug && <p className="text-red-600 text-sm mt-1">{errors.seo_slug.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Beschrijving *</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
          </div>

          {/* Pricing Section */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-gray-900">Prijzen & Beschikbaarheid</h3>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Status *</label>
                <select
                  {...register('availability_status')}
                  className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                >
                  <option value="presale">Pre-sale</option>
                  <option value="in_stock">Op voorraad</option>
                  <option value="out_of_stock">Uitverkocht</option>
                  <option value="discontinued">Stopgezet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Normale Prijs (&euro;) *</label>
                <input
                  {...register('base_price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              {availabilityStatus === 'presale' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Pre-sale Prijs (&euro;)</label>
                    <input
                      {...register('presale_price', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded-lg bg-amber-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Pre-sale Eindigt</label>
                    <input
                      {...register('presale_ends_at')}
                      type="date"
                      className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Categorie *</label>
              <select
                {...register('category')}
                className="w-full px-4 py-2 border rounded-lg md:w-1/3 text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              >
                <option value="clothing">Kleding</option>
                <option value="gear">Fight Gear</option>
                <option value="accessories">Accessoires</option>
              </select>
            </div>
          </div>

          {/* Preorder Section */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Pre-order Optie</h3>
                <p className="text-sm text-gray-600">
                  Klanten kunnen vooraf bestellen met korting (naast stock verkoop)
                </p>
              </div>
              <label className="flex items-center gap-2">
                <input
                  {...register('allow_preorder')}
                  type="checkbox"
                  className="w-5 h-5 text-blue-500 focus:ring-blue-400 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Inschakelen</span>
              </label>
            </div>

            {allowPreorder && (
              <div className="grid md:grid-cols-3 gap-4 pt-2 border-t border-blue-200">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Korting (%)</label>
                  <input
                    {...register('preorder_discount_percent', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="bijv. 10"
                    className="w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Pre-order Prijs</label>
                  <div className="px-4 py-2 border rounded-lg bg-blue-100 text-blue-800 font-medium">
                    €{preorderPrice.toFixed(2)}
                    {preorderDiscount && preorderDiscount > 0 && (
                      <span className="ml-2 text-sm text-blue-600">
                        (-{preorderDiscount}%)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Notitie (zichtbaar voor klant)</label>
                  <input
                    {...register('preorder_note')}
                    type="text"
                    placeholder="bijv. Levering binnen 2-3 weken"
                    className="w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Media Upload */}
          <ShopMediaUploader
            images={images || []}
            featuredImage={featuredImage}
            videoUrl={videoUrl}
            onImagesChange={(imgs) => setValue('images', imgs)}
            onFeaturedImageChange={(url) => setValue('featured_image', url)}
            onVideoUrlChange={(url) => setValue('video_url', url)}
          />

          {/* Variants & Stock */}
          <VariantsManager
            productId={product?.id || null}
            variants={variants}
            onChange={setVariants}
          />

          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input {...register('is_active')} type="checkbox" className="w-4 h-4 text-amber-400 focus:ring-amber-400" />
              <span className="text-sm font-medium text-gray-700">Actief (zichtbaar in shop)</span>
            </label>

            <label className="flex items-center gap-2">
              <input {...register('featured')} type="checkbox" className="w-4 h-4 text-amber-400 focus:ring-amber-400" />
              <span className="text-sm font-medium text-gray-700">Featured (uitgelicht)</span>
            </label>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {submitError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
