import { useState, useEffect, useCallback } from 'react'
import type { Cart, CartItem, DeliveryMethod, ProductWithVariants } from '../../types/shop'
import { getPreorderPrice } from '../../types/shop'

const CART_STORAGE_KEY = 'reconnect_shop_cart'
const DELIVERY_METHOD_KEY = 'reconnect_delivery_method'

interface UseShopCartReturn {
  cart: Cart
  itemCount: number
  addItem: (product: ProductWithVariants, variantId: string, isPreorder: boolean) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  setDeliveryMethod: (method: DeliveryMethod) => void
  clearCart: () => void
  isInCart: (variantId: string) => boolean
  getItemQuantity: (variantId: string) => number
}

function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load cart from storage:', e)
  }
  return []
}

function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save cart to storage:', e)
  }
}

function loadDeliveryMethod(): DeliveryMethod {
  try {
    const stored = localStorage.getItem(DELIVERY_METHOD_KEY)
    if (stored === 'pickup' || stored === 'shipping') {
      return stored
    }
  } catch (e) {
    console.error('Failed to load delivery method:', e)
  }
  return 'pickup' // Default to pickup (free)
}

function saveDeliveryMethod(method: DeliveryMethod): void {
  try {
    localStorage.setItem(DELIVERY_METHOD_KEY, method)
  } catch (e) {
    console.error('Failed to save delivery method:', e)
  }
}

export function useShopCart(): UseShopCartReturn {
  const [items, setItems] = useState<CartItem[]>([])
  const [deliveryMethod, setDeliveryMethodState] = useState<DeliveryMethod>('pickup')
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    setItems(loadCartFromStorage())
    setDeliveryMethodState(loadDeliveryMethod())
    setIsInitialized(true)
  }, [])

  // Save cart to localStorage when items change
  useEffect(() => {
    if (isInitialized) {
      saveCartToStorage(items)
    }
  }, [items, isInitialized])

  // Calculate cart totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const cart: Cart = {
    items,
    subtotal,
    discount_amount: 0, // Discount codes handled separately
    shipping_amount: 0, // Calculated in checkout based on delivery method
    delivery_method: deliveryMethod,
    total: subtotal, // Final total calculated in checkout
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const addItem = useCallback((product: ProductWithVariants, variantId: string, isPreorder: boolean) => {
    const variant = product.variants.find(v => v.id === variantId)
    if (!variant) return

    setItems(currentItems => {
      // Check if item already in cart (same variant + same preorder status)
      const existingIndex = currentItems.findIndex(
        item => item.variant_id === variantId && item.is_preorder === isPreorder
      )

      if (existingIndex >= 0) {
        // Update quantity
        const updated = [...currentItems]
        const newQuantity = updated[existingIndex].quantity + 1

        // Check stock limit for non-preorder items
        if (!isPreorder && newQuantity > variant.stock_quantity) {
          return currentItems // Don't exceed stock
        }

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQuantity,
        }
        return updated
      }

      // Calculate price
      const basePrice = product.base_price + (variant.price_adjustment || 0)
      const price = isPreorder ? getPreorderPrice(product) + (variant.price_adjustment || 0) : basePrice

      // Add new item
      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        product_slug: product.seo_slug,
        variant_id: variantId,
        variant_name: variant.name,
        price,
        original_price: basePrice,
        quantity: 1,
        image_url: product.featured_image || product.images[0] || null,
        stock_available: variant.stock_quantity,
        is_preorder: isPreorder,
        preorder_note: isPreorder ? product.preorder_note : null,
      }

      return [...currentItems, newItem]
    })
  }, [])

  const removeItem = useCallback((variantId: string) => {
    setItems(currentItems => currentItems.filter(item => item.variant_id !== variantId))
  }, [])

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(variantId)
      return
    }

    setItems(currentItems => {
      return currentItems.map(item => {
        if (item.variant_id !== variantId) return item

        // Check stock limit for non-preorder items
        if (!item.is_preorder && quantity > item.stock_available) {
          return { ...item, quantity: item.stock_available }
        }

        return { ...item, quantity }
      })
    })
  }, [removeItem])

  const setDeliveryMethod = useCallback((method: DeliveryMethod) => {
    setDeliveryMethodState(method)
    saveDeliveryMethod(method)
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem(CART_STORAGE_KEY)
  }, [])

  const isInCart = useCallback((variantId: string) => {
    return items.some(item => item.variant_id === variantId)
  }, [items])

  const getItemQuantity = useCallback((variantId: string) => {
    const item = items.find(i => i.variant_id === variantId)
    return item?.quantity || 0
  }, [items])

  return {
    cart,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    setDeliveryMethod,
    clearCart,
    isInCart,
    getItemQuantity,
  }
}

export default useShopCart
