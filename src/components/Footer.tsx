import Link from 'next/link'
import CurrencyDropdown from './CurrencyDropdown'

export default function Footer() {
  return (
    <footer className="w-full border-t py-6 text-sm text-gray-600">
      {/* Country/Region section */}
      <div className="px-6 mb-4 text-left">
        <div className="text-xs font-medium text-gray-700 mb-1">Country/region</div>
        <div className="inline-block">
          <CurrencyDropdown position="top-right" />
        </div>
      </div>

      {/* Footer links */}
      <div className="px-6 text-left">
        © 2025 Coconut Bun Cases &nbsp;|&nbsp;
        <Link href="/privacy-policy" className="hover:underline">
          Privacy Policy
        </Link>
        &nbsp;|&nbsp;
        <Link href="/refund-policy" className="hover:underline">
          Refund Policy
        </Link>
      </div>
    </footer>
  )
}
