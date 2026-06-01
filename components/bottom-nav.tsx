'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, AlertCircle, Calendar, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/comunidades', label: 'Comunidades', icon: Building2 },
  { href: '/incidencias', label: 'Incidencias', icon: AlertCircle },
  { href: '/planificacion', label: 'Planificación', icon: Calendar },
  { href: '/extintores', label: 'Contraincendios', icon: ShieldCheck },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-stretch border-t border-border bg-card safe-area-bottom">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'text-primary')} strokeWidth={active ? 2.5 : 1.75} />
            <span className={cn('font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
