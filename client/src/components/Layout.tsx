import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Images, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhotoStore } from '@/hooks/usePhotoStore';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const { loadPhotos } = usePhotoStore();

  // Load photos once at app level
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const canGoBack = () => {
    // Show back button if not on home or album pages
    return location !== '/' && location !== '/album';
  };

  const handleBack = () => {
    window.history.back();
  };

  const isActive = (path: string) => {
    if (path === '/album' && location.startsWith('/photo/')) {
      return true; // Keep album active when viewing photos
    }
    return location === path;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          {canGoBack() ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10" /> // Spacer for alignment
          )}
          <h1 className="flex-1 text-center text-lg font-semibold">
            Photo Wallet
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 z-40 w-full border-t bg-background">
        <div className="flex h-16 items-center justify-around px-4">
          <Link href="/">
            <a
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="nav-home"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </a>
          </Link>

          <Link href="/album">
            <a
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/album')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="nav-album"
            >
              <Images className="h-5 w-5" />
              <span className="text-xs">Album</span>
            </a>
          </Link>

          <Link href="/settings">
            <a
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/settings')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="nav-settings"
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Settings</span>
            </a>
          </Link>
        </div>
      </nav>
    </div>
  );
}
