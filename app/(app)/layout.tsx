export const dynamic = 'force-dynamic'

import BottomNav from '@/components/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 pb-16 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
