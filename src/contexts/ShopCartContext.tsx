import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Cart, CartItem, DeliveryMethod, ProductWithVariants } from '../types/shop'
import { getPreorderPrice } from '../types/shop'

const CART_STORAGE_KEY = 'reconnect_shop_cart'
const DELIVERY_METHOD_KEY = 'reconnect_delivery_method'

interface ShopCartContextValue {
  cart: Cart
  itemCount: number
  addItem: (product: ProductWithVariants, variantId: string, isPreorder: boolean, quantity?: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  setDeliveryMethod: (method: DeliveryMethod) => void
  clearCart: () => void
  isInCart: (variantId: string) => boolean
  getItemQuantity: (variantId: string) => number
}

const ShopCartContext = createContext<ShopCartContextValue | null>(null)

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
  return 'pickup'
}

function saveDeliveryMethod(method: DeliveryMethod): void {
  try {
    localStorage.setItem(DELIVERY_METHOD_KEY, method)
  } catch (e) {
    console.error('Failed to save delivery method:', e)
  }
}

interface ShopCartProviderProps {
  children: ReactNode
}

export function ShopCartProvider({ children }: ShopCartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage())
  const [deliveryMethod, setDeliveryMethodState] = useState<DeliveryMethod>(() => loadDeliveryMethod())

  // Save cart to localStorage when items change
  useEffect(() => {
    saveCartToStorage(items)
  }, [items])

  // Calculate cart totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const cart: Cart = {
    items,
    subtotal,
    discount_amount: 0,
    shipping_amount: 0,
    delivery_method: deliveryMethod,
    total: subtotal,
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const addItem = useCallback((product: ProductWithVariants, variantId: string, isPreorder: boolean, quantity: number = 1) => {
    const variant = product.variants.find(v => v.id === variantId)
    if (!variant) return

    const addQuantity = Math.max(1, quantity)

    setItems(currentItems => {
      const existingIndex = currentItems.findIndex(
        item => item.variant_id === variantId && item.is_preorder === isPreorder
      )

      if (existingIndex >= 0) {
        const updated = [...currentItems]
        const newQuantity = updated[existingIndex].quantity + addQuantity

        if (!isPreorder && newQuantity > variant.stock_quantity) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: variant.stock_quantity,
          }
          return updated
        }

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQuantity,
        }
        return updated
      }

      const basePrice = product.base_price + (variant.price_adjustment || 0)
      const price = isPreorder ? getPreorderPrice(product) + (variant.price_adjustment || 0) : basePrice

      const finalQuantity = !isPreorder && addQuantity > variant.stock_quantity
        ? variant.stock_quantity
        : addQuantity

      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        product_slug: product.seo_slug,
        variant_id: variantId,
        variant_name: variant.name,
        price,
        original_price: basePrice,
        quantity: finalQuantity,
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

  const value: ShopCartContextValue = {
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

  return (
    <ShopCartContext.Provider value={value}>
      {children}
    </ShopCartContext.Provider>
  )
}

export function useShopCart(): ShopCartContextValue {
  const context = useContext(ShopCartContext)
  if (!context) {
    throw new Error('useShopCart must be used within a ShopCartProvider')
  }
  return context
}

export default ShopCartContext
