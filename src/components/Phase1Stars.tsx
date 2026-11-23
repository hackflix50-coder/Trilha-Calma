import React, { useCallback, useState } from 'react';
import { Check, Circle, Hexagon, Moon, PlayCircle, RotateCcw, Sparkles, Square, Star, Triangle, ArrowRight } from 'lucide-react';
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
  const [demoMode, setDemoMode] = useState<'auto' | 'manual' | 'closed'>('auto');
  const handleCloseDemo = useCallback(() => setDemoMode('closed'), []);

  const round = STAR_ROUNDS[roundIndex];
  const totalTargets = round.items.filter((item) => item.isTarget).length;
  const isRoundComplete = foundIds.length === totalTargets;
  const isLastRound = roundIndex === STAR_ROUNDS.length - 1;

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
  };

  const handleNextRound = () => {
    if (!isLastRound) {
      setRoundIndex((prev) => prev + 1);
      setFoundIds([]);
      setGentleHint(null);
      setNudgedId(null);
    } else {
      onGoToNextPhase();
    }
  };

  return (
    <section aria-labelledby="phase1-heading" className="w-full max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">
              Fase 1 · {round.title}
            </p>
            <h2 id="phase1-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              Atenção às Estrelas
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-1">
              {round.instruction}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="text-right mr-1">
              <div className="text-xs font-medium text-slate-500">Progresso</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {foundIds.length} / {totalTargets}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDemoMode('manual')}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-base transition-colors min-h-[48px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <PlayCircle className="w-5 h-5" />
              Ver exemplo
            </button>
            <button
              type="button"
              onClick={handleResetRound}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-base transition-colors min-h-[48px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
          </div>
        </div>

        {/* Gentle feedback bar — fixed height to prevent layout shift */}
        <div className="min-h-[44px] flex items-center justify-center my-4" aria-live="polite">
          {gentleHint ? (
            <p className="text-base font-medium text-slate-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
              {gentleHint}
            </p>
          ) : !isRoundComplete ? (
            <p className="text-base text-slate-500 text-center">
              Encontre todas as {totalTargets} estrelas douradas.
            </p>
          ) : null}
        </div>

        {/* Shape Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 max-w-2xl mx-auto">
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
                className={`relative flex items-center justify-center aspect-square min-h-[76px] sm:min-h-[84px] rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 ${style.ring} ${
                  isFound
                    ? 'bg-emerald-50 border-emerald-400 scale-[0.97]'
                    : isNudged
                    ? 'bg-slate-100 border-slate-300 opacity-60 scale-95'
                    : `${style.bg} ${style.border} hover:scale-[1.03] active:scale-95 cursor-pointer`
                }`}
              >
                <ShapeIcon
                  type={item.type}
                  className={`w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 transition-transform duration-150 ${
                    isFound ? 'text-emerald-600 fill-emerald-300' : style.icon
                  }`}
                />
                {isFound && (
                  <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Gentle completion banner */}
        {isRoundComplete && (
          <div className="mt-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-950">
                  {isLastRound ? 'Muito bem! Você concluiu a Fase 1!' : 'Ótimo trabalho! Rodada concluída!'}
                </h3>
                <p className="text-base text-emerald-800">
                  {isLastRound
                    ? 'Agora você pode seguir para o Labirinto.'
                    : 'Pronto para a segunda rodada com mais formas?'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextRound}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg transition-colors min-h-[52px] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 cursor-pointer"
            >
              {isLastRound ? 'Próxima Fase' : 'Próxima Rodada'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <VisualDemoModal
        phase="stars"
        isOpen={demoMode !== 'closed'}
        autoClose={demoMode === 'auto'}
        onClose={handleCloseDemo}
      />
    </section>
  );
};
