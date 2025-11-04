import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePWA } from '@/hooks/usePWA';

interface InstallBannerProps {
  photoCount: number;
}

export function InstallBanner({ photoCount }: InstallBannerProps) {
  const { isInstallable, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('install-banner-dismissed') === 'true';
    setIsDismissed(dismissed);

    if (photoCount > 0 && isInstallable && !dismissed) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [photoCount, isInstallable]);

  const handleInstall = async () => {
    const accepted = await installApp();
    if (accepted) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('install-banner-dismissed', 'true');
    setIsDismissed(true);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe" data-testid="banner-install">
      <Alert className="mx-auto max-w-lg shadow-lg">
        <Download className="h-5 w-5" />
        <div className="flex items-start justify-between flex-1">
          <div className="flex-1 min-w-0">
            <AlertTitle>Install Photo Wallet</AlertTitle>
            <AlertDescription className="mb-3">
              Add to your home screen for quick access to your photos anytime, anywhere.
            </AlertDescription>
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                data-testid="button-install-banner"
              >
                Install Now
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                data-testid="button-dismiss-banner"
              >
                Not Now
              </Button>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            size="icon"
            variant="ghost"
            className="flex-shrink-0 -mr-2 -mt-1 ml-2"
            data-testid="button-close-banner"
            aria-label="Dismiss install banner"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
