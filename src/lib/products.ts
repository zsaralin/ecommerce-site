export type Product = {
  id: string
  name: string
  href: string,
  price: number
  image: string
}

export const products: Product[] = [
  {
    id: 'personalized',
    name: 'Personalized',
    href: '/products/personalized',
    price: 2599, // in cents
    image: '/images/example-0.png'
    },
  {
    id: 'random',
    name: 'Blind Box',
    href: '/products/random',
    price: 2199,
    image: '/images/example-0.png',
  },
];

