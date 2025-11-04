import { useState } from 'react';
import { useLocation } from 'wouter';
import { Trash2, Moon, Sun, Monitor, Download, Github, Archive, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArchiveDialog } from '@/components/ArchiveDialog';
import { useTheme } from '@/components/ThemeProvider';
import { usePWA } from '@/hooks/usePWA';
import { resetAppData } from '@/lib/resetApp';
import { photoStorage } from '@/services/photoStorage';
import { usePhotoStore } from '@/hooks/usePhotoStore';

export default function Settings() {
  const [, navigate] = useLocation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNuclearResetConfirm, setShowNuclearResetConfirm] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { loadPhotos } = usePhotoStore();

  const handleReset = async () => {
    await photoStorage.clearAll();
    await loadPhotos();
    setShowResetConfirm(false);
    navigate('/album');
  };

  const handleNuclearReset = async () => {
    setShowNuclearResetConfirm(false);
    await resetAppData();
  };

  const handleInstall = async () => {
    await installApp();
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Theme Section */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Appearance
        </h3>
        <div className="rounded-lg border p-4">
          <label className="text-sm font-medium mb-3 block">Theme</label>
          <ToggleGroup
            type="single"
            value={theme}
            onValueChange={(value) => {
              if (value) setTheme(value as 'light' | 'dark' | 'system');
            }}
            className="grid grid-cols-3 gap-2"
          >
            <ToggleGroupItem
              value="dark"
              aria-label="Dark theme"
              className="flex-1 justify-start"
              data-testid="button-theme-dark"
            >
              <Moon className="w-4 h-4 mr-2" />
              Dark
            </ToggleGroupItem>
            <ToggleGroupItem
              value="light"
              aria-label="Light theme"
              className="flex-1 justify-start"
              data-testid="button-theme-light"
            >
              <Sun className="w-4 h-4 mr-2" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem
              value="system"
              aria-label="System theme"
              className="flex-1 justify-start"
              data-testid="button-theme-system"
            >
              <Monitor className="w-4 h-4 mr-2" />
              System
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </section>

      {/* PWA Section */}
      {(isInstallable || isInstalled) && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Progressive Web App
          </h3>
          <div className="rounded-lg border p-4">
            {isInstallable && (
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={handleInstall}
                data-testid="button-install-settings"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
            {isInstalled && (
              <div className="text-sm text-muted-foreground" data-testid="text-app-installed">
                ✓ App is installed on your device
              </div>
            )}
          </div>
        </section>
      )}

      {/* Storage Section */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Storage
        </h3>
        <div className="rounded-lg border p-4 space-y-2">
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => setShowArchiveDialog(true)}
            data-testid="button-view-archive"
          >
            <Archive className="w-4 h-4 mr-2" />
            Overflow Folder
          </Button>
        </div>
      </section>

      {/* Backup Section */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Backup
        </h3>
        <div className="rounded-lg border p-4">
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => navigate('/github-setup')}
            data-testid="button-github-setup"
          >
            <Github className="w-4 h-4 mr-2" />
            Push to GitHub
          </Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-destructive uppercase tracking-wide">
          Danger Zone
        </h3>
        <div className="rounded-lg border border-destructive/50 p-4 space-y-2">
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => setShowResetConfirm(true)}
            data-testid="button-reset-app"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reset App & Delete All Photos
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            onClick={() => setShowNuclearResetConfirm(true)}
            data-testid="button-nuclear-reset"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Nuclear Reset (Clear Everything)
          </Button>
        </div>
      </section>

      {/* Archive Dialog */}
      <ArchiveDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
      />

      {/* Reset Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent data-testid="dialog-reset-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your photos from your device. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-reset"
            >
              Delete All Photos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Nuclear Reset Confirmation */}
      <AlertDialog open={showNuclearResetConfirm} onOpenChange={setShowNuclearResetConfirm}>
        <AlertDialogContent data-testid="dialog-nuclear-reset-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>🔥 Nuclear Reset - Clear Everything?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold">This will completely reset the app and clear:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>All photos and archived photos</li>
                <li>All cached data</li>
                <li>Service worker and PWA data</li>
                <li>All local storage</li>
              </ul>
              <p className="font-semibold text-red-600 dark:text-red-400">
                The page will reload after reset. This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-nuclear-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNuclearReset}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              data-testid="button-confirm-nuclear-reset"
            >
              🔥 Nuclear Reset & Reload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
