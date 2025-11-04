import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { WelcomeScreen } from '@/components/WelcomeScreen';

export default function Home() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check if user has seen welcome screen
    const hasSeenWelcome = localStorage.getItem('photo-wallet-welcome-seen');
    if (hasSeenWelcome) {
      // Redirect returning users to album
      navigate('/album', { replace: true });
    }
  }, [navigate]);

  const handleGetStarted = () => {
    localStorage.setItem('photo-wallet-welcome-seen', 'true');
    navigate('/album');
  };

  return <WelcomeScreen onGetStarted={handleGetStarted} />;
}
