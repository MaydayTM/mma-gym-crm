import { shopSupabase, getShopTenantId, isShopConfigured } from '../lib/shopSupabase';
import type { Product, ProductWithVariants, ProductVariant, OrderWithItems, DiscountCode } from '../types/shop';

// ============================================
// Products
// ============================================

export async function getProducts(): Promise<ProductWithVariants[]> {
  if (!isShopConfigured() || !shopSupabase) {
    console.warn('Shop not configured');
    return [];
  }

  const tenantId = getShopTenantId();

  const { data: products, error } = await shopSupabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Fetch variants for all products
  const productIds = products.map(p => p.id);
  const { data: variants } = await shopSupabase
    .from('product_variants')
    .select('*')
    .in('product_id', productIds)
    .eq('is_active', true);

  // Combine products with their variants
  return products.map(product => ({
    ...product,
    variants: (variants || []).filter(v => v.product_id === product.id)
  }));
}

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  if (!isShopConfigured() || !shopSupabase) {
    return null;
  }

  const tenantId = getShopTenantId();

  const { data: product, error } = await shopSupabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('seo_slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !product) {
    return null;
  }

  const { data: variants } = await shopSupabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_active', true);

  return {
    ...product,
    variants: variants || []
  };
}

export async function getFeaturedProducts(limit = 4): Promise<ProductWithVariants[]> {
  if (!isShopConfigured() || !shopSupabase) {
    return [];
  }

  const tenantId = getShopTenantId();

  const { data: products, error } = await shopSupabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('featured', true)
    .limit(limit);

  if (error || !products) {
    return [];
  }

  const productIds = products.map(p => p.id);
  const { data: variants } = await shopSupabase
    .from('product_variants')
    .select('*')
    .in('product_id', productIds)
    .eq('is_active', true);

  return products.map(product => ({
    ...product,
    variants: (variants || []).filter(v => v.product_id === product.id)
  }));
}

export async function getProductsByCategory(category: string): Promise<ProductWithVariants[]> {
  if (!isShopConfigured() || !shopSupabase) {
    return [];
  }

  const tenantId = getShopTenantId();

  const { data: products, error } = await shopSupabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error || !products) {
    return [];
  }

  const productIds = products.map(p => p.id);
  const { data: variants } = await shopSupabase
    .from('product_variants')
    .select('*')
    .in('product_id', productIds)
    .eq('is_active', true);

  return products.map(product => ({
    ...product,
    variants: (variants || []).filter(v => v.product_id === product.id)
  }));
}

// ============================================
// Discount Codes
// ============================================

export async function validateDiscountCode(code: string): Promise<DiscountCode | null> {
  if (!isShopConfigured() || !shopSupabase) {
    return null;
  }

  const tenantId = getShopTenantId();
  const now = new Date().toISOString();

  const { data, error } = await shopSupabase
    .from('discount_codes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .or(`valid_from.is.null,valid_from.lte.${now}`)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .single();

  if (error || !data) {
    return null;
  }

  // Check max uses
  if (data.max_uses !== null && data.times_used >= data.max_uses) {
    return null;
  }

  return data;
}

// ============================================
// Orders (for customer order lookup)
// ============================================

export async function getOrderByNumber(orderNumber: string, email: string): Promise<OrderWithItems | null> {
  if (!isShopConfigured() || !shopSupabase) {
    return null;
  }

  const tenantId = getShopTenantId();

  const { data: order, error } = await shopSupabase
    .from('shop_orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('order_number', orderNumber)
    .eq('customer_email', email.toLowerCase())
    .single();

  if (error || !order) {
    return null;
  }

  const { data: items } = await shopSupabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);

  return {
    ...order,
    items: items || []
  };
}

// ============================================
// Admin Functions
// ============================================

export async function getAllProductsAdmin(): Promise<ProductWithVariants[]> {
  if (!isShopConfigured() || !shopSupabase) {
    return [];
  }

  const tenantId = getShopTenantId();

  const { data: products, error } = await shopSupabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error || !products) {
    return [];
  }

  const productIds = products.map(p => p.id);
  if (productIds.length === 0) return [];

  const { data: variants } = await shopSupabase
    .from('product_variants')
    .select('*')
    .in('product_id', productIds);

  return products.map(product => ({
    ...product,
    variants: (variants || []).filter(v => v.product_id === product.id)
  }));
}

export async function createProduct(productData: Partial<Product>): Promise<Product | null> {
  if (!isShopConfigured() || !shopSupabase) {
    return null;
  }

  const tenantId = getShopTenantId();

  const { data, error } = await shopSupabase
    .from('products')
    .insert({
      ...productData,
      tenant_id: tenantId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return null;
  }

  return data;
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
  if (!isShopConfigured() || !shopSupabase) {
    return null;
  }

  const tenantId = getShopTenantId();

  const { data, error } = await shopSupabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return null;
  }

  return data;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!isShopConfigured() || !shopSupabase) {
    return false;
  }

  const tenantId = getShopTenantId();

  const { error } = await shopSupabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  return !error;
}

export async function createVariant(variantData: Partial<ProductVariant>): Promise<ProductVariant | null> {
  if (!isShopConfigured() || !shopSupabase) {
    return null;
  }

  const tenantId = getShopTenantId();

  const { data, error } = await shopSupabase
    .from('product_variants')
    .insert({
      ...variantData,
      tenant_id: tenantId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating variant:', error);
    return null;
  }

  return data;
}

export async function updateVariant(id: string, variantData: Partial<ProductVariant>): Promise<ProductVariant | null> {
  if (!isShopConfigured() || !shopSupabase) {
    return null;
  }

  const tenantId = getShopTenantId();

  const { data, error } = await shopSupabase
    .from('product_variants')
    .update(variantData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating variant:', error);
    return null;
  }

  return data;
}

export async function deleteVariant(id: string): Promise<boolean> {
  if (!isShopConfigured() || !shopSupabase) {
    return false;
  }

  const tenantId = getShopTenantId();

  const { error } = await shopSupabase
    .from('product_variants')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  return !error;
}

// ============================================
// Admin Orders
// ============================================

export async function getAllOrdersAdmin(): Promise<OrderWithItems[]> {
  if (!isShopConfigured() || !shopSupabase) {
    return [];
  }

  const tenantId = getShopTenantId();

  const { data: orders, error } = await shopSupabase
    .from('shop_orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error || !orders) {
    return [];
  }

  const orderIds = orders.map(o => o.id);
  if (orderIds.length === 0) return [];

  const { data: items } = await shopSupabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  return orders.map(order => ({
    ...order,
    items: (items || []).filter(i => i.order_id === order.id)
  }));
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  additionalData?: { tracking_number?: string; tracking_url?: string; notes?: string }
): Promise<boolean> {
  if (!isShopConfigured() || !shopSupabase) {
    return false;
  }

  const tenantId = getShopTenantId();

  const updateData: Record<string, unknown> = { status };

  // Set timestamp based on status
  if (status === 'paid') updateData.paid_at = new Date().toISOString();
  if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
  if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
  if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString();

  if (additionalData) {
    Object.assign(updateData, additionalData);
  }

  const { error } = await shopSupabase
    .from('shop_orders')
    .update(updateData)
    .eq('id', orderId)
    .eq('tenant_id', tenantId);

  return !error;
}

// ============================================
// Image Upload
// ============================================

export async function uploadProductImage(file: File): Promise<string | null> {
  if (!isShopConfigured() || !shopSupabase) {
    return null;
  }

  const tenantId = getShopTenantId();
  const fileExt = file.name.split('.').pop();
  const fileName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await shopSupabase.storage
    .from('shop-products')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  const { data } = shopSupabase.storage
    .from('shop-products')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteProductImage(url: string): Promise<boolean> {
  if (!isShopConfigured() || !shopSupabase) {
    return false;
  }

  // Extract path from URL
  const urlParts = url.split('/shop-products/');
  if (urlParts.length !== 2) return false;

  const path = urlParts[1];

  const { error } = await shopSupabase.storage
    .from('shop-products')
    .remove([path]);

  return !error;
}
