export type ProductCategory = 'clothing' | 'gear' | 'accessories';
export type AvailabilityStatus = 'in_stock' | 'presale' | 'out_of_stock' | 'discontinued';
export type DeliveryMethod = 'pickup' | 'shipping';

// Shipping configuration
export interface ShippingConfig {
  pickup_enabled: boolean;
  pickup_location: string;
  shipping_enabled: boolean;
  shipping_cost: number;
  free_shipping_threshold: number; // 0 = no free shipping
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  pickup_enabled: true,
  pickup_location: 'Reconnect Academy, Aalst',
  shipping_enabled: true,
  shipping_cost: 6.95,
  free_shipping_threshold: 200,
};

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  presale_price: number | null;
  presale_ends_at: string | null;
  availability_status: AvailabilityStatus;
  // New: allow preorder even when in stock
  allow_preorder: boolean;
  preorder_discount_percent: number | null; // e.g., 10 for 10% off
  preorder_note: string | null; // e.g., "Levering binnen 3 weken"
  category: ProductCategory;
  images: string[];
  featured_image: string | null;
  video_url: string | null;
  video_thumbnail: string | null;
  is_active: boolean;
  featured: boolean;
  seo_slug: string;
  created_at: string;
  updated_at: string;
}

// Helper to get current effective price (for stock items)
export function getEffectivePrice(product: Product): number {
  if (product.availability_status === 'presale' && product.presale_price !== null) {
    // Check if presale is still active
    if (!product.presale_ends_at || new Date(product.presale_ends_at) > new Date()) {
      return product.presale_price;
    }
  }
  return product.base_price;
}

// Get preorder price (with discount)
export function getPreorderPrice(product: Product): number {
  if (!product.allow_preorder || !product.preorder_discount_percent) {
    return product.base_price;
  }
  const discount = product.base_price * (product.preorder_discount_percent / 100);
  return product.base_price - discount;
}

// Check if product is in presale period
export function isInPresale(product: Product): boolean {
  if (product.availability_status !== 'presale') return false;
  if (!product.presale_ends_at) return true;
  return new Date(product.presale_ends_at) > new Date();
}

// Check if product has stock available
export function hasStock(product: Product, variants: ProductVariant[]): boolean {
  if (product.availability_status === 'out_of_stock' || product.availability_status === 'discontinued') {
    return false;
  }
  return variants.some(v => v.is_active && v.stock_quantity > 0);
}

// Check if preorder is available
export function canPreorder(product: Product): boolean {
  return product.allow_preorder && product.is_active;
}

// Calculate shipping cost
export function calculateShipping(
  subtotal: number,
  deliveryMethod: DeliveryMethod,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): number {
  if (deliveryMethod === 'pickup') return 0;
  if (config.free_shipping_threshold > 0 && subtotal >= config.free_shipping_threshold) return 0;
  return config.shipping_cost;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  price_adjustment: number;
  stock_quantity: number;
  low_stock_alert: number;
  is_active: boolean;
  created_at: string;
}

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingAddress {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface ShopOrder {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_address: ShippingAddress | null; // null for pickup
  delivery_method: DeliveryMethod;
  total_amount: number;
  subtotal_amount: number;
  shipping_amount: number;
  discount_code_id: string | null;
  discount_amount: number;
  status: OrderStatus;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  mollie_payment_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  ready_for_pickup_at: string | null; // for pickup orders
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string | null;
  product_name: string;
  variant_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_preorder: boolean;
  preorder_note: string | null;
  created_at: string;
}

export type OrderWithItems = ShopOrder & {
  items: OrderItem[];
};

export interface CartItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  variant_id: string;
  variant_name: string;
  price: number;
  original_price: number; // for showing discount
  quantity: number;
  image_url: string | null;
  stock_available: number;
  is_preorder: boolean;
  preorder_note: string | null;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  delivery_method: DeliveryMethod;
  total: number;
}

export type DiscountType = 'percentage' | 'fixed';

export interface DiscountCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  created_at: string;
}

// Payment Configuration Types
export type PaymentProvider = 'stripe' | 'mollie';

export interface PaymentConfig {
  id: string;
  tenant_id: string;
  provider: PaymentProvider;
  stripe_publishable_key: string | null;
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
  mollie_api_key: string | null;
  mollie_profile_id: string | null;
  currency: string;
  is_active: boolean;
  is_test_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentConfigFormData {
  provider: PaymentProvider;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  mollie_api_key: string;
  mollie_profile_id: string;
  currency: string;
  is_test_mode: boolean;
}
