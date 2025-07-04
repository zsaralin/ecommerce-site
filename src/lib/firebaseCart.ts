import { db } from './firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export async function saveCartToFirebase(userId: string, cart: any[]) {
  const ref = doc(db, 'carts', userId)
  await setDoc(ref, { items: cart })
}

export async function loadCartFromFirebase(userId: string) {
  const ref = doc(db, 'carts', userId)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data().items : []
}
