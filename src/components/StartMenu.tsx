import React from 'react';
import { GamePhase } from '../types/game';
import { playSoftSelect } from '../utils/sound';
import {
  GridHouseIllustration,
  MazeIllustration,
  StarIllustration,
} from './PhaseThumbnails';

interface StartMenuProps {
  soundEnabled: boolean;
  onSelectPhase: (phase: Exclude<GamePhase, 'menu'>) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ soundEnabled, onSelectPhase }) => {
  const handlePick = (phase: Exclude<GamePhase, 'menu'>) => {
    playSoftSelect(soundEnabled);
    onSelectPhase(phase);
  };

  return (
    <section
      aria-labelledby="menu-title"
      className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center py-2 sm:py-6"
    >
      <h1
        id="menu-title"
        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 text-center mb-5 sm:mb-8 lg:mb-12 text-balance"
      >
        Escolha um jogo
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-8 w-full">
        {/* Cartão 1: Estrela grande (Fase 1) */}
        <button
          type="button"
          onClick={() => handlePick('stars')}
          aria-label="Fase 1: Atenção às Estrelas"
          className="group relative flex flex-col items-center justify-between min-h-[156px] sm:aspect-[4/4.6] lg:aspect-[4/4.3] rounded-3xl bg-[#FEF9C3] border-2 border-amber-200 p-4 sm:p-6 lg:p-8 shadow-sm transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
        >
          <div className="flex-1 flex items-center justify-center w-full py-1">
            <StarIllustration className="w-24 h-24 sm:w-32 sm:h-32 lg:w-44 lg:h-44 drop-shadow-sm transition-transform duration-150 group-hover:scale-105" />
          </div>

          <span className="text-xs font-medium text-amber-800/60 tracking-wide select-none mt-1">
            Fase 1
          </span>
        </button>

        {/* Cartão 2: Mini labirinto desenhado (Fase 2) */}
        <button
          type="button"
          onClick={() => handlePick('maze')}
          aria-label="Fase 2: Labirinto"
          className="group relative flex flex-col items-center justify-between min-h-[156px] sm:aspect-[4/4.6] lg:aspect-[4/4.3] rounded-3xl bg-[#E0F2FE] border-2 border-sky-200 p-4 sm:p-6 lg:p-8 shadow-sm transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400"
        >
          <div className="flex-1 flex items-center justify-center w-full py-1">
            <MazeIllustration className="w-24 h-24 sm:w-32 sm:h-32 lg:w-44 lg:h-44 drop-shadow-sm transition-transform duration-150 group-hover:scale-105" />
          </div>

          <span className="text-xs font-medium text-sky-900/55 tracking-wide select-none mt-1">
            Fase 2
          </span>
        </button>

        {/* Cartão 3: Malha quadriculada com casinha desenhada (Fase 3) */}
        <button
          type="button"
          onClick={() => handlePick('grid')}
          aria-label="Fase 3: Copie na Malha"
          className="group relative flex flex-col items-center justify-between min-h-[156px] sm:aspect-[4/4.6] lg:aspect-[4/4.3] rounded-3xl bg-[#DCFCE7] border-2 border-emerald-200 p-4 sm:p-6 lg:p-8 shadow-sm transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
        >
          <div className="flex-1 flex items-center justify-center w-full py-1">
            <GridHouseIllustration className="w-24 h-24 sm:w-32 sm:h-32 lg:w-44 lg:h-44 drop-shadow-sm transition-transform duration-150 group-hover:scale-105" />
          </div>

          <span className="text-xs font-medium text-emerald-900/55 tracking-wide select-none mt-1">
            Fase 3
          </span>
        </button>
      </div>
    </section>
  );
};
