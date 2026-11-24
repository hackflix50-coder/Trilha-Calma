import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Hexagon,
  Moon,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Square,
  Star,
  Triangle,
} from 'lucide-react';
import { STAR_ROUNDS } from '../data/levels';
import { playSoftGentleNudge, playSoftSelect, playSoftSuccess } from '../utils/sound';
import { VisualDemoModal } from './VisualDemoModal';

interface Phase1StarsProps {
  soundEnabled: boolean;
  onGoToNextPhase: () => void;
}

const VARIANT_CLASSES: Record<string, { bg: string; border: string; icon: string; ring: string }> = {
  gold: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500 fill-amber-400',
    ring: 'focus-visible:ring-amber-400',
  },
  sky: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: 'text-sky-500 fill-sky-200',
    ring: 'focus-visible:ring-sky-400',
  },
  sage: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-500 fill-emerald-200',
    ring: 'focus-visible:ring-emerald-400',
  },
  lavender: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: 'text-violet-500 fill-violet-200',
    ring: 'focus-visible:ring-violet-400',
  },
  coral: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'text-orange-500 fill-orange-200',
    ring: 'focus-visible:ring-orange-400',
  },
};

function ShapeIcon({ type, className }: { type: string; className: string }) {
  switch (type) {
    case 'star':
      return <Star className={className} strokeWidth={2.2} />;
    case 'circle':
      return <Circle className={className} strokeWidth={2.2} />;
    case 'square':
      return <Square className={className} strokeWidth={2.2} />;
    case 'triangle':
      return <Triangle className={className} strokeWidth={2.2} />;
    case 'moon':
      return <Moon className={className} strokeWidth={2.2} />;
    case 'hexagon':
    default:
      return <Hexagon className={className} strokeWidth={2.2} />;
  }
}

export const Phase1Stars: React.FC<Phase1StarsProps> = ({ soundEnabled, onGoToNextPhase }) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [gentleHint, setGentleHint] = useState<string | null>(null);
  const [nudgedId, setNudgedId] = useState<string | null>(null);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [demoMode, setDemoMode] = useState<'auto' | 'manual' | 'closed'>('auto');
  const handleCloseDemo = useCallback(() => setDemoMode('closed'), []);

  const round = STAR_ROUNDS[roundIndex];
  const totalTargets = round.items.filter((item) => item.isTarget).length;
  const isRoundComplete = foundIds.length === totalTargets;
  const isLastRound = roundIndex === STAR_ROUNDS.length - 1;

  // Ao encontrar a 10ª estrela, aguarda 350ms para a criança ver o visto verde e abre o cartão centralizado (sem precisar rolar a tela no celular!)
  useEffect(() => {
    if (!isRoundComplete) {
      setShowWinOverlay(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setShowWinOverlay(true);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isRoundComplete]);

  const handleItemClick = (item: (typeof round.items)[number]) => {
    if (isRoundComplete) return;
    if (foundIds.includes(item.id)) return;

    if (item.isTarget) {
      const nextFound = [...foundIds, item.id];
      setFoundIds(nextFound);
      setGentleHint(null);
      if (nextFound.length === totalTargets) {
        playSoftSuccess(soundEnabled);
      } else {
        playSoftSelect(soundEnabled);
      }
    } else {
      playSoftGentleNudge(soundEnabled);
      setNudgedId(item.id);
      setGentleHint('Essa é outra forma. Continue procurando pelas estrelas douradas!');
      window.setTimeout(() => {
        setNudgedId((curr) => (curr === item.id ? null : curr));
      }, 450);
    }
  };

  const handleResetRound = () => {
    setFoundIds([]);
    setGentleHint(null);
    setNudgedId(null);
    setShowWinOverlay(false);
  };

  const handleNextRound = () => {
    if (!isLastRound) {
      setRoundIndex((prev) => prev + 1);
      setFoundIds([]);
      setGentleHint(null);
      setNudgedId(null);
      setShowWinOverlay(false);
    } else {
      onGoToNextPhase();
    }
  };

  return (
    <section aria-labelledby="phase1-heading" className="w-full flex-1 flex flex-col max-w-6xl mx-auto">
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 lg:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-0.5">
              Fase 1 · {round.title}
            </p>
            <h2 id="phase1-heading" className="text-xl sm:text-3xl font-bold text-slate-900 text-balance">
              Atenção às Estrelas
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-[11px] font-medium text-amber-800">Progresso</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                {foundIds.length} / {totalTargets}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDemoMode('manual')}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-sm sm:text-base transition-colors min-h-[44px] sm:min-h-[48px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <PlayCircle className="w-5 h-5" />
              Ver exemplo
            </button>
            <button
              type="button"
              onClick={handleResetRound}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-sm sm:text-base transition-colors min-h-[44px] sm:min-h-[48px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
          </div>
        </div>

        {/* Barra de feedback suave com altura compacta no celular */}
        <div className="min-h-[34px] flex items-center justify-center my-2 sm:my-3 shrink-0" aria-live="polite">
          {isRoundComplete ? (
            <div className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300">
              <span className="inline-flex items-center gap-2 text-base font-bold text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {totalTargets} / {totalTargets} estrelas encontradas!
              </span>
              <button
                type="button"
                onClick={handleNextRound}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base cursor-pointer"
              >
                {isLastRound ? 'Próxima Fase' : 'Próxima Rodada'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : gentleHint ? (
            <p className="text-sm sm:text-base font-medium text-slate-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
              {gentleHint}
            </p>
          ) : (
            <p className="text-sm sm:text-base text-slate-500 text-center">
              Encontre todas as {totalTargets} estrelas douradas.
            </p>
          )}
        </div>

        {/* Grade de Formas centralizada ocupando a tela inteira */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div
            className={`grid gap-2.5 sm:gap-4 w-full max-w-3xl mx-auto ${
              round.items.length > 16 ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-4'
            }`}
          >
          {round.items.map((item) => {
            const isFound = foundIds.includes(item.id);
            const isNudged = nudgedId === item.id;
            const style = VARIANT_CLASSES[item.variant];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                disabled={isFound}
                aria-label={
                  isFound
                    ? 'Estrela encontrada'
                    : item.type === 'star'
                    ? 'Estrela'
                    : 'Outra forma geométrica'
                }
                className={`relative flex items-center justify-center aspect-square min-h-[62px] sm:min-h-[82px] rounded-xl sm:rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 ${style.ring} ${
                  isFound
                    ? 'bg-emerald-50 border-emerald-400 scale-[0.97]'
                    : isNudged
                    ? 'bg-slate-100 border-slate-300 opacity-60 scale-95'
                    : `${style.bg} ${style.border} hover:scale-[1.03] active:scale-95 cursor-pointer`
                }`}
              >
                <ShapeIcon
                  type={item.type}
                  className={`w-8 h-8 sm:w-11 sm:h-11 transition-transform duration-150 ${
                    isFound ? 'text-emerald-600 fill-emerald-300' : style.icon
                  }`}
                />
                {isFound && (
                  <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Cartão centralizado de conclusão — 100% visível no celular sem precisar rolar a tela */}
      {showWinOverlay && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phase1-win-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-white border-2 border-emerald-300 p-6 sm:p-8 shadow-xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-sm">
              <Sparkles className="w-9 h-9" />
            </div>

            <p className="text-base font-bold text-emerald-700 tabular-nums mb-1">
              {totalTargets} / {totalTargets} estrelas!
            </p>
            <h3 id="phase1-win-title" className="text-2xl font-bold text-slate-900">
              {isLastRound ? 'Muito bem! Fase 1 concluída!' : 'Ótimo trabalho!'}
            </h3>
            <p className="text-base text-slate-600 mt-2">
              {isLastRound
                ? 'Agora você já pode seguir para a Fase 2: Labirinto.'
                : 'Pronto para a segunda rodada?'}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={handleResetRound}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-base min-h-[52px] flex-1 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Refazer
              </button>
              <button
                type="button"
                onClick={handleNextRound}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg min-h-[52px] flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
              >
                {isLastRound ? 'Próxima Fase' : 'Próxima Rodada'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <VisualDemoModal
        phase="stars"
        isOpen={demoMode !== 'closed'}
        autoClose={demoMode === 'auto'}
        onClose={handleCloseDemo}
      />
    </section>
  );
};
