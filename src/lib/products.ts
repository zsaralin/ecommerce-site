export type Product = {
  id: string
  name: string
  href: string,
  price: number
  images: string[] // <-- fix here
}

export const products: Product[] = [
  {
    id: 'personalized',
    name: 'Personalized',
    href: '/products/personalized',
    price: 2599, // in cents
    images: ['/images/personalized-0.webp', '/images/personalized-1.webp',
      '/images/personalized-2.webp', '/images/personalized-3.webp'
    ]
    },
  {
    id: 'random',
    name: 'Blind Box',
    href: '/products/random',
    price: 2199,
    images: ['/images/random-0.webp'],
  },
];

