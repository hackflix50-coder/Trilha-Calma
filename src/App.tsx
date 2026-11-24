import React, { useCallback, useEffect, useState } from 'react';
import { Home, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Phase1Stars } from './components/Phase1Stars';
import { Phase2Maze } from './components/Phase2Maze';
import { Phase3Grid } from './components/Phase3Grid';
import {
  GridHouseIllustration,
  MazeIllustration,
  StarIllustration,
} from './components/PhaseThumbnails';
import { PWAInstallButton } from './components/PWAInstallButton';
import { StartMenu } from './components/StartMenu';
import { GamePhase } from './types/game';
import { playSoftSelect } from './utils/sound';

const PHASES: Array<{
  id: Exclude<GamePhase, 'menu'>;
  label: string;
  renderIcon: (className?: string) => React.ReactNode;
}> = [
  {
    id: 'stars',
    label: '1. Estrelas',
    renderIcon: (cls) => <StarIllustration className={cls} />,
  },
  {
    id: 'maze',
    label: '2. Labirinto',
    renderIcon: (cls) => <MazeIllustration className={cls} />,
  },
  {
    id: 'grid',
    label: '3. Malha',
    renderIcon: (cls) => <GridHouseIllustration className={cls} />,
  },
];

function getFullscreenElement(): Element | null {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as Document & { webkitFullscreenEnabled?: boolean };
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  return Boolean(
    (doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled) &&
      (el.requestFullscreen || el.webkitRequestFullscreen)
  );
}

async function enterBrowserFullscreen(): Promise<void> {
  try {
    if (getFullscreenElement()) return;
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    }
  } catch {
    // Alguns navegadores (ex: iOS Safari ou iframe restrito) não permitem Fullscreen API;
    // nesses casos o layout em tela inteira da própria aplicação continua ativo normalmente.
  }
}

async function exitBrowserFullscreen(): Promise<void> {
  try {
    if (!getFullscreenElement()) return;
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
  } catch {
    // ignore
  }
}

export default function App() {
  const [activePhase, setActivePhase] = useState<GamePhase>('menu');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const canUseFullscreen = isFullscreenSupported();

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(getFullscreenElement()));
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, []);

  const handleStartPhase = useCallback((phase: Exclude<GamePhase, 'menu'>) => {
    setActivePhase(phase);
    void enterBrowserFullscreen();
  }, []);

  const handleGoHome = useCallback(() => {
    playSoftSelect(soundEnabled);
    setActivePhase('menu');
    void exitBrowserFullscreen();
  }, [soundEnabled]);

  const handleToggleFullscreen = useCallback(() => {
    if (getFullscreenElement()) {
      void exitBrowserFullscreen();
    } else {
      void enterBrowserFullscreen();
    }
  }, []);

  const isPlaying = activePhase !== 'menu';

  return (
    <div className="min-h-dvh bg-[#FAF9F6] text-slate-800 flex flex-col overflow-x-hidden">
      {/* Barra superior: completa no Menu Inicial; ultra-compacta em 1 linha durante os jogos (Tela Cheia) */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div
          className={`mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 ${
            isPlaying ? 'max-w-none py-2' : 'max-w-5xl py-3 sm:py-3.5 flex-wrap'
          }`}
        >
          {/* Zona 1: Início (durante jogos) ou Título (no Menu) */}
          <div className="flex items-center shrink-0">
            {isPlaying ? (
              <button
                type="button"
                onClick={handleGoHome}
                aria-label="Voltar ao menu inicial"
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold text-sm sm:text-base transition-colors min-h-[40px] sm:min-h-[44px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" strokeWidth={2.4} />
                <span>Início</span>
              </button>
            ) : (
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 px-1">
                Trilha Calma
              </span>
            )}
          </div>

          {/* Zona 2: Seletor rápido de fases visível apenas em telas médias/grandes durante o jogo para não ocupar altura no celular */}
          {isPlaying && (
            <nav
              aria-label="Fases do jogo"
              className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
            >
              {PHASES.map((phase) => {
                const isActive = activePhase === phase.id;
                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => {
                      playSoftSelect(soundEnabled);
                      setActivePhase(phase.id);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {phase.renderIcon('w-5 h-5 shrink-0')}
                    <span>{phase.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Zona 3: Status Offline + Botão Modo Offline (apenas no Menu) + Tela Cheia + Som */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <OfflineIndicator />
            {!isPlaying && <PWAInstallButton />}
            {isPlaying && canUseFullscreen && (
              <button
                type="button"
                onClick={handleToggleFullscreen}
                aria-label={isFullscreen ? 'Sair da tela inteira' : 'Expandir para tela inteira'}
                title={isFullscreen ? 'Sair da tela inteira' : 'Tela inteira'}
                className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shrink-0 min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                ) : (
                  <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Silenciar som' : 'Ativar som suave'}
              className={`inline-flex items-center justify-center gap-2 px-2.5 sm:px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isPlaying ? 'py-1.5 sm:py-2 min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px]' : 'py-2 sm:py-2.5 min-h-[44px] sm:min-h-[48px] min-w-[44px]'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  {!isPlaying && <span className="hidden lg:inline">Som Suave</span>}
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  {!isPlaying && <span className="hidden lg:inline">Silencioso</span>}
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Área Principal: centralizada no Menu; tela inteira fluida durante os jogos */}
      <main
        className={
          isPlaying
            ? 'flex-1 w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-3 flex flex-col'
            : 'flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 lg:py-10 flex flex-col justify-center'
        }
      >
        {activePhase === 'menu' && (
          <StartMenu
            soundEnabled={soundEnabled}
            onSelectPhase={handleStartPhase}
          />
        )}
        {activePhase === 'stars' && (
          <Phase1Stars
            soundEnabled={soundEnabled}
            onGoToNextPhase={() => setActivePhase('maze')}
          />
        )}
        {activePhase === 'maze' && (
          <Phase2Maze
            soundEnabled={soundEnabled}
            onGoToNextPhase={() => setActivePhase('grid')}
          />
        )}
        {activePhase === 'grid' && (
          <Phase3Grid
            soundEnabled={soundEnabled}
            onFinishAllPhases={handleGoHome}
          />
        )}
      </main>
    </div>
  );
}
