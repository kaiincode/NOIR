'use client'

import { useTheme } from 'next-themes'

export function NoirLogo({ size = 72 }: { size?: number }) {
  const { theme, resolvedTheme } = useTheme()
  const current = theme === 'system' ? resolvedTheme : theme
  const src = current === 'dark' ? '/logo-dark.png' : '/logo-light.png'

  return (
    <img
      src={src}
      alt="NOIR"
      width={size}
      height={size}
      className="h-auto w-auto select-none"
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}

