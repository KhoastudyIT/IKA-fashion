export interface Product {
  id: string
  handle: string
  title: string
  description: string
  priceRange: {
    minVariantPrice: {
      amount: string
      currencyCode: string
    }
    maxVariantPrice: {
      amount: string
      currencyCode: string
    }
  }
  images: {
    nodes: Array<{
      url: string
      altText: string | null
    }>
  }
  variants: {
    nodes: Array<{
      id: string
      title: string
      availableForSale: boolean
      price: {
        amount: string
        currencyCode: string
      }
      image?: {
        url: string
        altText: string | null
      }
    }>
  }
  collections?: {
    nodes: Array<{
      handle: string
      title: string
    }>
  }
}

export interface Cart {
  id: string
  checkoutUrl: string
  lines: {
    nodes: Array<{
      id: string
      quantity: number
      merchandise: {
        id: string
        title: string
        product: {
          handle: string
          title: string
        }
      }
      cost: {
        totalAmount: {
          amount: string
          currencyCode: string
        }
      }
    }>
  }
  cost: {
    totalAmount: {
      amount: string
      currencyCode: string
    }
    subtotalAmount: {
      amount: string
      currencyCode: string
    }
    totalTaxAmount: {
      amount: string
      currencyCode: string
    }
  }
}

export interface CartItem {
  variantId: string
  quantity: number
}
