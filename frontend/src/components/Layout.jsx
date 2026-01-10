import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Boxes, 
  Upload, 
  Activity, 
  Settings, 
  Menu, 
  X,
  Radio,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Scenario Builder', href: '/scenarios', icon: Boxes },
  { name: 'Data Upload', href: '/data', icon: Upload },
  { name: 'Predictions', href: '/predictions', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-optimus-bg grid-bg">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden text-optimus-cyan"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="mobile-menu-toggle"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-optimus-card border-r border-optimus-border transform transition-transform duration-300 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-optimus-border">
          <Radio className="h-6 w-6 text-optimus-cyan mr-3 animate-pulse" />
          <div>
            <h1 className="font-rajdhani text-lg font-bold text-optimus-silver tracking-wider">
              OPTIMUS ECHO
            </h1>
            <p className="text-[10px] text-optimus-steel tracking-[0.2em]">PREDICTOR v1.0</p>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-wider transition-colors",
                    isActive
                      ? "bg-optimus-cyan/10 text-optimus-cyan border-l-2 border-optimus-cyan"
                      : "text-optimus-steel hover:text-optimus-silver hover:bg-optimus-subtle"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="uppercase">{item.name}</span>
                  {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>

        {/* System Status */}
        <div className="p-4 border-t border-optimus-border">
          <div className="hud-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tracking-[0.2em] text-optimus-steel uppercase">System Status</span>
              <div className="status-online" />
            </div>
            <div className="flex items-center gap-2 text-xs text-optimus-silver">
              <AlertTriangle className="h-3 w-3 text-optimus-warning" />
              <span className="font-mono">Echo Network: Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-optimus-border bg-optimus-card/50 backdrop-blur-md sticky top-0 z-30">
          <div className="h-full flex items-center justify-between px-6 md:px-8">
            <div className="flex items-center gap-4 ml-10 md:ml-0">
              <h2 className="font-rajdhani text-xl font-semibold text-optimus-silver uppercase tracking-wide">
                {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs text-optimus-steel">
                <span className="font-mono">{new Date().toLocaleDateString()}</span>
                <span className="text-optimus-border">|</span>
                <span className="font-mono">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="vr-toggle-placeholder">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-[10px] tracking-wider opacity-50 cursor-not-allowed"
                  data-testid="vr-mode-toggle"
                >
                  VR MODE
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
