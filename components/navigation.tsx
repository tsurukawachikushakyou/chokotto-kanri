'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, UserCheck, Activity, Settings, Menu } from 'lucide-react' // ★ Xを削除
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet' // ★ SheetCloseを削除

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: Home },
  { name: 'サポーター', href: '/supporters', icon: Users },
  { name: '利用者', href: '/service-users', icon: UserCheck },
  { name: '活動記録', href: '/activities', icon: Activity },
  { name: '設定', href: '/settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  // ★ 改善点: モバイルメニューの開閉状態を管理するstate
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)

  const NavigationItems = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon
        // リンク先がサブパスであってもアクティブ状態を正しく判定
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

        return (
          // ★ 改善点: モバイル時にクリックしたらメニューを閉じる
          <Link
            key={item.name}
            href={item.href}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
              // モバイル用の文字サイズ調整
              isMobile ? 'text-base font-medium' : 'text-sm font-medium'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* ★ 改善点: コンテナ幅をmax-w-4xlに統一 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            {/* <Icon className="h-6 w-6" /> */}
            <span className="font-bold">鶴川ちょこっと管理</span>
          </Link>
          <nav className="flex items-center gap-2">
            <NavigationItems />
          </nav>
        </div>

        {/* Mobile Header */}
        <div className="flex items-center md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">メニューを開く</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm">
              <SheetHeader className="border-b pb-4">
                <Link 
                  href="/" 
                  className="font-bold text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  鶴川ちょこっと管理
                </Link>
              </SheetHeader>
              <nav className="mt-6 grid gap-2">
                <NavigationItems isMobile={true} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Title (Center) */}
        <div className="flex items-center md:hidden">
          <Link href="/" className="font-bold">
            鶴川ちょこっと管理
          </Link>
        </div>

        {/* Right side placeholder (for layout) */}
        <div className="flex items-center justify-end md:hidden">
            {/* 将来的にユーザーアイコンなどを置くスペース */}
            <div className="w-9 h-9"></div> 
        </div>

      </div>
    </header>
  )
}