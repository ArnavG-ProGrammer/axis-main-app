import { CompanyProvider } from '@/lib/company-context'
import { ToastProvider } from '@/components/Toast'
import LeftSidebar from '@/components/LeftSidebar'
import RightSidebar from '@/components/RightSidebar'
import MobileNav from '@/components/MobileNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompanyProvider>
      <ToastProvider>
        <div className="min-h-screen" style={{ background: '#0f0c08' }}>
          {/* Sidebars — hidden on mobile */}
          <div className="hidden md:block">
            <LeftSidebar />
            <RightSidebar />
          </div>

          {/* Main content */}
          <main className="min-h-screen md:ml-[240px] xl:mr-[280px] pb-20 md:pb-0">
            {children}
          </main>

          {/* Mobile bottom nav */}
          <MobileNav />
        </div>
      </ToastProvider>
    </CompanyProvider>
  )
}
