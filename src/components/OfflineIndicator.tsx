import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-xl bg-slate-800 text-white px-4 py-2.5 text-sm font-medium shadow-lg border border-slate-700"
    >
      <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />
      <span>Modo offline · Pronto para jogar sem internet</span>
    </div>
  );
};
