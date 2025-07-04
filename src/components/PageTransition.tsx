'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, Variants } from 'framer-motion'

const variants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={true} key={pathname}>
      <motion.main
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ position: 'relative', }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}
