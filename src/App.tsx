import React, { useState } from 'react';
import { Home, Volume2, VolumeX } from 'lucide-react';
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

export default function App() {
  const [activePhase, setActivePhase] = useState<GamePhase>('menu');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const handleGoHome = () => {
    playSoftSelect(soundEnabled);
    setActivePhase('menu');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 flex flex-col overflow-x-hidden">
      {/* Top Bar responsivo automático: Smartphone (2 linhas compactas) · Tablet & PC (1 linha) */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
          {/* Zona 1: Botão Casinha (Home) dentro das fases, ou marca no menu */}
          <div className="flex items-center shrink-0">
            {activePhase !== 'menu' ? (
              <button
                type="button"
                onClick={handleGoHome}
                aria-label="Voltar ao menu inicial"
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold text-sm sm:text-base transition-colors min-h-[44px] sm:min-h-[48px] min-w-[44px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" strokeWidth={2.4} />
                <span>Início</span>
              </button>
            ) : (
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 px-1">
                Trilha Calma
              </span>
            )}
          </div>

          {/* Zona 2: Opções das fases — grid 3 colunas no celular (zero overflow), inline em Tablet & PC */}
          {activePhase !== 'menu' && (
            <nav
              aria-label="Fases do jogo"
              className="grid grid-cols-3 md:flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-100 rounded-2xl order-3 md:order-2 w-full md:w-auto"
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
                    className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm lg:text-base font-semibold transition-all whitespace-nowrap min-w-0 cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {phase.renderIcon('w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 shrink-0')}
                    <span className="truncate">{phase.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Zona 3: Instalar App + Controle de Som Suave */}
          <div className="flex items-center gap-2 shrink-0 order-2 md:order-3">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Silenciar som' : 'Ativar som suave'}
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm sm:text-base font-medium transition-colors whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-[48px] min-w-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-5 h-5 text-blue-600" />
                  <span className="hidden lg:inline">Som Suave</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-5 h-5 text-slate-400" />
                  <span className="hidden lg:inline">Silencioso</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Área Principal */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 lg:py-10 flex flex-col justify-center">
        {activePhase === 'menu' && (
          <StartMenu
            soundEnabled={soundEnabled}
            onSelectPhase={(phase) => setActivePhase(phase)}
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
            onFinishAllPhases={() => setActivePhase('menu')}
          />
        )}
      </main>

      <OfflineIndicator />
    </div>
  );
}
