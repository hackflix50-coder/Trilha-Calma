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
      aria-label="Modo offline: pronto para jogar sem internet"
      title="Modo offline · Pronto para jogar sem internet"
      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-slate-600 px-2.5 py-1.5 text-xs font-medium border border-slate-200 whitespace-nowrap shrink-0"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span>Offline</span>
    </div>
  );
};
