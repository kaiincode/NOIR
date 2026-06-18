import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'
import { NoirLogo } from '@/components/noir/noir-logo'

export function NoirHeader() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6">
      <div className="grid grid-cols-3 items-center py-8 md:py-10">
        <div />

        <div className="flex justify-center">
          <Link href="/" aria-label="Back to NOIR home" className="inline-flex">
            <NoirLogo size={84} />
          </Link>
        </div>

        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

