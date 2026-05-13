import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import type { Product } from '../../data/products'
import { getProduct, getProductVariant } from '../../data/products'

export type CartLine = {
  id: string
  productId: string
  variantId: string
  size: string
  quantity: number
}

export type CartLineWithProduct = CartLine & {
  product: Product
  maxQuantity: number
}

type AddCartItemInput = {
  product: Product
  size: string
  quantity?: number
}

type CartContextValue = {
  lines: CartLineWithProduct[]
  itemCount: number
  subtotal: number
  mrpTotal: number
  savings: number
  isOpen: boolean
  addedItem: AddedCartItem | null
  addItem: (input: AddCartItemInput) => void
  dismissAddedItem: () => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  setCartOpen: (open: boolean) => void
}

export type AddedCartItem = {
  product: Product
  quantity: number
  size: string
}

const cartStorageKey = 'trenzura-cart'
const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartLines, setCartLines] = useState<CartLine[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [addedItem, setAddedItem] = useState<AddedCartItem | null>(null)
  const [hasLoadedCart, setHasLoadedCart] = useState(false)

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(cartStorageKey)
      if (!savedCart) {
        setHasLoadedCart(true)
        return
      }

      const parsedCart = JSON.parse(savedCart) as CartLine[]
      if (Array.isArray(parsedCart)) {
        setCartLines(parsedCart.filter(isStoredCartLine))
      }
    } catch {
      setCartLines([])
    } finally {
      setHasLoadedCart(true)
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedCart) return

    window.localStorage.setItem(cartStorageKey, JSON.stringify(cartLines))
  }, [cartLines, hasLoadedCart])

  const lines = useMemo(
    () =>
      cartLines
        .map((line) => {
          const product = getProduct(line.productId)
          if (!product) return null

          const variant = getProductVariant(product, line.variantId)
          const maxQuantity = variant?.stockAvailable ?? 0

          if (maxQuantity < 1) return null

          return {
            ...line,
            product,
            maxQuantity,
            quantity: Math.min(line.quantity, maxQuantity),
          }
        })
        .filter((line): line is CartLineWithProduct => Boolean(line)),
    [cartLines],
  )

  const totals = useMemo(
    () =>
      lines.reduce(
        (current, line) => ({
          itemCount: current.itemCount + line.quantity,
          subtotal: current.subtotal + line.product.sellingPricePaise * line.quantity,
          mrpTotal: current.mrpTotal + line.product.mrpPaise * line.quantity,
        }),
        { itemCount: 0, subtotal: 0, mrpTotal: 0 },
      ),
    [lines],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount: totals.itemCount,
      subtotal: totals.subtotal,
      mrpTotal: totals.mrpTotal,
      savings: Math.max(0, totals.mrpTotal - totals.subtotal),
      isOpen,
      addedItem,
      addItem: ({ product, size, quantity = 1 }) => {
        const sizeInventory = product.sizes.find((item) => item.label === size)
        if (!sizeInventory || sizeInventory.stockAvailable < 1) return

        const maxQuantity = sizeInventory.stockAvailable
        const id = createCartLineId(product.productId, sizeInventory.variantId)
        const safeQuantity = clampQuantity(quantity, maxQuantity)

        setCartLines((currentLines) => {
          const existingLine = currentLines.find((line) => line.id === id)

          if (!existingLine) {
            return [
              ...currentLines,
              {
                id,
                productId: product.productId,
                variantId: sizeInventory.variantId,
                size,
                quantity: safeQuantity,
              },
            ]
          }

          return currentLines.map((line) =>
            line.id === id
              ? {
                  ...line,
                  quantity: clampQuantity(line.quantity + safeQuantity, maxQuantity),
                }
              : line,
          )
        })
        setAddedItem({ product, size, quantity: safeQuantity })
      },
      dismissAddedItem: () => setAddedItem(null),
      updateQuantity: (id, quantity) => {
        setCartLines((currentLines) =>
          currentLines
            .map((line) => {
              if (line.id !== id) return line

              const product = getProduct(line.productId)
              const maxQuantity =
                product?.sizes.find((size) => size.variantId === line.variantId)?.stockAvailable ?? 0

              return {
                ...line,
                quantity: clampQuantity(quantity, maxQuantity),
              }
            })
            .filter((line) => line.quantity > 0),
        )
      },
      removeItem: (id) => {
        setCartLines((currentLines) => currentLines.filter((line) => line.id !== id))
      },
      clearCart: () => setCartLines([]),
      openCart: () => {
        setAddedItem(null)
        setIsOpen(true)
      },
      closeCart: () => setIsOpen(false),
      setCartOpen: setIsOpen,
    }),
    [addedItem, isOpen, lines, totals.itemCount, totals.mrpTotal, totals.subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const cart = useContext(CartContext)

  if (!cart) {
    throw new Error('useCart must be used within CartProvider')
  }

  return cart
}

export function createCartLineId(productId: string, variantId: string) {
  return `${productId}:${variantId}`
}

function clampQuantity(quantity: number, maxQuantity: number) {
  if (maxQuantity < 1) return 0
  return Math.min(Math.max(Math.trunc(quantity), 1), maxQuantity)
}

function isStoredCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== 'object') return false

  const line = value as CartLine
  return (
    typeof line.id === 'string' &&
    typeof line.productId === 'string' &&
    typeof line.variantId === 'string' &&
    typeof line.size === 'string' &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0
  )
}
