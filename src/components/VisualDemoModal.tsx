import React, { useEffect, useState } from 'react';
import { Check, Circle, Flag, Hand, Play, Square, Star, X } from 'lucide-react';
import { GamePhase } from '../types/game';

interface VisualDemoModalProps {
  phase: Exclude<GamePhase, 'menu'>;
  isOpen: boolean;
  autoClose?: boolean;
  onClose: () => void;
}

const PHASE_ACCESSIBLE_LABELS: Record<Exclude<GamePhase, 'menu'>, string> = {
  stars: 'Demonstração visual: toque nas estrelas douradas',
  maze: 'Demonstração visual: arraste a bolinha laranja até o fim',
  grid: 'Demonstração visual: ligue os pontos na malha',
};

// Demonstração animada suave para a Fase 1 (clique nas estrelas)
const StarsDemo: React.FC<{ autoClose: boolean; onFinishCycle: () => void }> = ({
  autoClose,
  onFinishCycle,
}) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const id = window.setInterval(() => {
      setStep((prev) => {
        if (autoClose && prev >= 5) {
          window.clearInterval(id);
          onFinishCycle();
          return prev;
        }
        return (prev + 1) % 6;
      });
    }, 680);
    return () => window.clearInterval(id);
  }, [autoClose, onFinishCycle]);

  const star1Found = step >= 2;
  const star2Found = step >= 4;

  const cursorPos =
    step === 0
      ? { x: '50%', y: '52%', pressing: false }
      : step === 1
      ? { x: '75%', y: '28%', pressing: true }
      : step === 2
      ? { x: '75%', y: '28%', pressing: false }
      : step === 3
      ? { x: '27%', y: '75%', pressing: true }
      : { x: '27%', y: '75%', pressing: false };

  return (
    <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto rounded-3xl bg-[#FAF9F6] border-2 border-slate-200 p-3.5 sm:p-4 grid grid-cols-2 gap-3 sm:gap-4 select-none">
      <div className="rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center">
        <Circle className="w-11 h-11 text-sky-500 fill-sky-200" strokeWidth={2.2} />
      </div>

      <div
        className={`relative rounded-2xl border-2 flex items-center justify-center transition-colors duration-300 ${
          star1Found ? 'bg-emerald-50 border-emerald-400' : 'bg-amber-50 border-amber-200'
        }`}
      >
        <Star
          className={`w-11 h-11 transition-colors duration-300 ${
            star1Found ? 'text-emerald-600 fill-emerald-300' : 'text-amber-500 fill-amber-400'
          }`}
          strokeWidth={2.2}
        />
        {star1Found && (
          <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
        )}
      </div>

      <div
        className={`relative rounded-2xl border-2 flex items-center justify-center transition-colors duration-300 ${
          star2Found ? 'bg-emerald-50 border-emerald-400' : 'bg-amber-50 border-amber-200'
        }`}
      >
        <Star
          className={`w-11 h-11 transition-colors duration-300 ${
            star2Found ? 'text-emerald-600 fill-emerald-300' : 'text-amber-500 fill-amber-400'
          }`}
          strokeWidth={2.2}
        />
        {star2Found && (
          <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
        <Square className="w-11 h-11 text-emerald-500 fill-emerald-200" strokeWidth={2.2} />
      </div>

      <div
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          transform: `translate(-25%, -15%) scale(${cursorPos.pressing ? 0.88 : 1})`,
        }}
        className="absolute z-20 pointer-events-none transition-all duration-500 ease-out"
        aria-hidden="true"
      >
        <div className="w-12 h-12 rounded-full bg-white/95 border-2 border-slate-700 shadow-md flex items-center justify-center">
          <Hand className="w-6 h-6 text-slate-800" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
};

// Demonstração animada suave para a Fase 2 (arrastar a bolinha até FIM)
const MazeDemo: React.FC<{ autoClose: boolean; onFinishCycle: () => void }> = ({
  autoClose,
  onFinishCycle,
}) => {
  const [step, setStep] = useState(0);

  const path = [
    { r: 0, c: 0 },
    { r: 1, c: 0 },
    { r: 1, c: 1 },
    { r: 2, c: 1 },
    { r: 2, c: 2 },
    { r: 2, c: 2 },
  ];

  useEffect(() => {
    setStep(0);
    const id = window.setInterval(() => {
      setStep((prev) => {
        if (autoClose && prev >= path.length - 1) {
          window.clearInterval(id);
          onFinishCycle();
          return prev;
        }
        return (prev + 1) % path.length;
      });
    }, 620);
    return () => window.clearInterval(id);
  }, [autoClose, onFinishCycle, path.length]);

  const current = path[step];
  const atEnd = current.r === 2 && current.c === 2;
  const matrix = [
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 1],
  ];

  return (
    <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto rounded-3xl bg-slate-200 border-2 border-slate-300 p-2 grid grid-cols-3 grid-rows-3 gap-1.5 select-none">
      {matrix.map((row, r) =>
        row.map((val, c) => {
          const isEnd = r === 2 && c === 2;
          return (
            <div
              key={`${r}-${c}`}
              className={`rounded-xl flex items-center justify-center ${
                isEnd
                  ? 'bg-emerald-100 border-2 border-emerald-500'
                  : val === 1
                  ? 'bg-blue-100 border border-blue-200'
                  : 'bg-slate-300'
              }`}
            >
              {isEnd && (
                <div className="flex flex-col items-center">
                  <Flag className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
                  <span className="text-[11px] font-extrabold text-emerald-900">FIM</span>
                </div>
              )}
            </div>
          );
        })
      )}

      <div
        style={{
          left: `${((current.c + 0.5) / 3) * 100}%`,
          top: `${((current.r + 0.5) / 3) * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
        className={`absolute z-10 w-12 h-12 rounded-full bg-orange-500 transition-all duration-500 ease-out flex items-center justify-center shadow-md ${
          atEnd ? 'ring-4 ring-emerald-400 scale-105' : 'ring-4 ring-orange-200'
        }`}
        aria-hidden="true"
      >
        <span className="w-4 h-4 rounded-full bg-orange-200/70" />
      </div>

      <div
        style={{
          left: `${((current.c + 0.65) / 3) * 100}%`,
          top: `${((current.r + 0.68) / 3) * 100}%`,
          transform: 'translate(-20%, -10%)',
        }}
        className="absolute z-20 pointer-events-none transition-all duration-500 ease-out"
        aria-hidden="true"
      >
        <div className="w-11 h-11 rounded-full bg-white/95 border-2 border-slate-700 shadow-md flex items-center justify-center">
          <Hand className="w-5 h-5 text-slate-800" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
};

// Demonstração animada suave para a Fase 3 (ligar pontos na diagonal na malha)
const GridDemo: React.FC<{ autoClose: boolean; onFinishCycle: () => void }> = ({
  autoClose,
  onFinishCycle,
}) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const id = window.setInterval(() => {
      setStep((prev) => {
        if (autoClose && prev >= 4) {
          window.clearInterval(id);
          onFinishCycle();
          return prev;
        }
        return (prev + 1) % 5;
      });
    }, 760);
    return () => window.clearInterval(id);
  }, [autoClose, onFinishCycle]);

  const pts = [32, 80, 128];
  const handPos =
    step === 0
      ? { x: 32, y: 128 }
      : step === 1
      ? { x: 80, y: 32 }
      : step >= 2
      ? { x: 128, y: 128 }
      : { x: 32, y: 128 };

  const line1Drawn = step >= 1;
  const line2Drawn = step >= 2;
  const completed = step >= 2;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 items-center w-full max-w-[340px] sm:max-w-md mx-auto select-none">
      <div className="flex flex-col items-center w-full">
        <div className="w-full max-w-[144px] sm:max-w-[168px] aspect-square rounded-2xl sm:rounded-3xl bg-[#FAF9F6] border-2 border-slate-200 p-1.5">
          <svg viewBox="0 0 160 160" className="w-full h-full">
            {pts.map((p) => (
              <g key={p}>
                <line x1="32" y1={p} x2="128" y2={p} stroke="#E2E8F0" strokeWidth="2" />
                <line x1={p} y1="32" x2={p} y2="128" stroke="#E2E8F0" strokeWidth="2" />
              </g>
            ))}
            <polyline
              points="32,128 80,32 128,128"
              fill="none"
              stroke={completed ? '#059669' : '#2563EB'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />
            {pts.map((y) =>
              pts.map((x) => (
                <circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r="5.5"
                  fill="#FFFFFF"
                  stroke="#64748B"
                  strokeWidth="2.5"
                />
              ))
            )}
          </svg>
        </div>
      </div>

      <div className="flex flex-col items-center w-full">
        <div
          className={`relative w-full max-w-[144px] sm:max-w-[168px] aspect-square rounded-2xl sm:rounded-3xl border-2 p-1.5 transition-colors duration-300 ${
            completed ? 'bg-emerald-50/70 border-emerald-400' : 'bg-white border-blue-200'
          }`}
        >
          <svg viewBox="0 0 160 160" className="w-full h-full">
            {pts.map((p) => (
              <g key={p}>
                <line x1="32" y1={p} x2="128" y2={p} stroke="#E2E8F0" strokeWidth="2" />
                <line x1={p} y1="32" x2={p} y2="128" stroke="#E2E8F0" strokeWidth="2" />
              </g>
            ))}

            {line1Drawn && (
              <line
                x1="32"
                y1="128"
                x2="80"
                y2="32"
                stroke={completed ? '#059669' : '#2563EB'}
                strokeWidth="8"
                strokeLinecap="round"
              />
            )}
            {line2Drawn && (
              <line
                x1="80"
                y1="32"
                x2="128"
                y2="128"
                stroke={completed ? '#059669' : '#2563EB'}
                strokeWidth="8"
                strokeLinecap="round"
              />
            )}

            {pts.map((y) =>
              pts.map((x) => {
                const isStartHighlight = step === 0 && x === 32 && y === 128;
                return (
                  <circle
                    key={`${x}-${y}`}
                    cx={x}
                    cy={y}
                    r={isStartHighlight ? '7.5' : '5.5'}
                    fill={isStartHighlight ? '#F97316' : '#FFFFFF'}
                    stroke={isStartHighlight ? '#EA580C' : '#475569'}
                    strokeWidth="2.5"
                  />
                );
              })
            )}
          </svg>

          <div
            style={{
              left: `${(handPos.x / 160) * 100}%`,
              top: `${(handPos.y / 160) * 100}%`,
              transform: 'translate(-20%, -10%)',
            }}
            className="absolute z-20 pointer-events-none transition-all duration-500 ease-out"
            aria-hidden="true"
          >
            <div className="w-10 h-10 rounded-full bg-white/95 border-2 border-slate-700 shadow-md flex items-center justify-center">
              <Hand className="w-5 h-5 text-slate-800" strokeWidth={2.2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VisualDemoModal: React.FC<VisualDemoModalProps> = ({
  phase,
  isOpen,
  autoClose = false,
  onClose,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !autoClose) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const timer = window.setTimeout(() => setProgress(100), 40);
    return () => window.clearTimeout(timer);
  }, [isOpen, autoClose, phase]);

  if (!isOpen) return null;

  const totalDurationMs = phase === 'stars' ? 4100 : phase === 'maze' ? 3750 : 3850;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-sr-title"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white border-2 border-slate-200 p-6 sm:p-8 shadow-xl flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="demo-modal-sr-title" className="sr-only">
          {PHASE_ACCESSIBLE_LABELS[phase]}
        </h3>

        {!autoClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar demonstração"
            className="absolute top-4 right-4 w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Animação puramente visual, sem necessidade de leitura */}
        <div className="py-2 w-full flex justify-center">
          {phase === 'stars' && (
            <StarsDemo autoClose={autoClose} onFinishCycle={onClose} />
          )}
          {phase === 'maze' && (
            <MazeDemo autoClose={autoClose} onFinishCycle={onClose} />
          )}
          {phase === 'grid' && (
            <GridDemo autoClose={autoClose} onFinishCycle={onClose} />
          )}
        </div>

        {/* Barra de progresso suave indicando que o jogo vai começar automaticamente */}
        {autoClose && (
          <div className="w-56 h-2 rounded-full bg-slate-100 overflow-hidden mt-5" aria-hidden="true">
            <div
              style={{
                width: `${progress}%`,
                transition: `width ${totalDurationMs}ms linear`,
              }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        )}

        {/* Botão puramente visual (ícone Play grande) para pular ou iniciar imediatamente */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Começar a jogar agora"
          className="mt-5 inline-flex items-center justify-center w-24 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
        >
          <Play className="w-8 h-8 fill-current ml-0.5" />
        </button>
      </div>
    </div>
  );
};
