import React, { useState } from 'react';
import { Download, MoreVertical, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Só oculta quando o jogo já está rodando instalado em modo standalone
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowGuide(true);
  };

  return (
    <>
      {/* Botão azul sempre visível em celulares, tablets e PCs quando ainda não está instalado */}
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm lg:text-base font-semibold shadow-sm transition-all whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-[48px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Download className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        <span>Modo Offline</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
          onClick={() => setShowGuide(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 id="pwa-install-guide-title" className="text-xl font-bold text-slate-900">
                  {isIOS ? 'Modo Offline no iPhone / iPad' : 'Ativar Modo Offline'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Fechar instruções"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-3 text-base text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-blue-700">1.</span>
                  <span>
                    Abra no navegador <strong>Safari</strong> e toque em{' '}
                    <strong>Compartilhar</strong>{' '}
                    <Share className="inline w-4 h-4 text-blue-600 mx-0.5" /> na barra inferior.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-blue-700">2.</span>
                  <span>
                    Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-3 text-base text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-blue-700">1.</span>
                  <span>
                    Se abriu pelo WhatsApp, toque nos 3 pontinhos{' '}
                    <MoreVertical className="inline w-4 h-4 text-slate-600" /> e escolha{' '}
                    <strong>Abrir no Chrome</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-blue-700">2.</span>
                  <span>
                    No navegador, toque no menu{' '}
                    <MoreVertical className="inline w-4 h-4 text-slate-600" /> (canto superior direito).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-blue-700">3.</span>
                  <span>
                    Toque em <strong>Instalar aplicativo</strong> ou{' '}
                    <strong>Adicionar à tela inicial</strong>.
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-base font-semibold text-white min-h-[48px] cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
