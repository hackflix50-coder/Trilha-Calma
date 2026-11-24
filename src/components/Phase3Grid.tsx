import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import { GRID_LEVELS } from '../data/levels';
import { GridPoint } from '../types/game';
import { playSoftGentleNudge, playSoftSelect, playSoftStep, playSoftSuccess } from '../utils/sound';
import { VisualDemoModal } from './VisualDemoModal';

interface Phase3GridProps {
  soundEnabled: boolean;
  onFinishAllPhases: () => void;
}

const VIEWBOX_SIZE = 400;
const PADDING = 48;

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function makeEdgeKey(a: GridPoint, b: GridPoint): string {
  const pa = `${a.x},${a.y}`;
  const pb = `${b.x},${b.y}`;
  return pa < pb ? `${pa}|${pb}` : `${pb}|${pa}`;
}

function parseEdgeKey(key: string): [GridPoint, GridPoint] {
  const [sa, sb] = key.split('|');
  const [ax, ay] = sa.split(',').map(Number);
  const [bx, by] = sb.split(',').map(Number);
  return [
    { x: ax, y: ay },
    { x: bx, y: by },
  ];
}

// Subdivide segmentos colineares (horizontais, verticais ou diagonais a 45°) em passos unitários na malha.
// Isso permite que o usuário trace [0,2]->[2,0] de uma vez só OU ponto a ponto [0,2]->[1,1]->[2,0]!
function subdivideSegment(a: GridPoint, b: GridPoint): string[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return [];
  const steps = gcd(dx, dy);
  const stepX = dx / steps;
  const stepY = dy / steps;

  const keys: string[] = [];
  for (let i = 0; i < steps; i++) {
    const p1 = { x: a.x + stepX * i, y: a.y + stepY * i };
    const p2 = { x: a.x + stepX * (i + 1), y: a.y + stepY * (i + 1) };
    keys.push(makeEdgeKey(p1, p2));
  }
  return keys;
}

function toSvgCoord(val: number, gridSize: number): number {
  const span = VIEWBOX_SIZE - PADDING * 2;
  return PADDING + (val / (gridSize - 1)) * span;
}

export const Phase3Grid: React.FC<Phase3GridProps> = ({ soundEnabled, onFinishAllPhases }) => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [drawnEdges, setDrawnEdges] = useState<string[]>([]);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [demoMode, setDemoMode] = useState<'auto' | 'manual' | 'closed'>('auto');
  const handleCloseDemo = useCallback(() => setDemoMode('closed'), []);

  // Estados de desenho por arrasto E por toque-em-dois-pontos
  const [selectedDot, setSelectedDot] = useState<GridPoint | null>(null);
  const [dragStartDot, setDragStartDot] = useState<GridPoint | null>(null);
  const [cursorSvg, setCursorSvg] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragMovedRef = useRef(false);
  const pointerDownSvgRef = useRef<{ x: number; y: number } | null>(null);
  const activeDragDotRef = useRef<GridPoint | null>(null);

  const level = GRID_LEVELS[levelIndex];
  const gridSize = level.gridSize;
  const cellSpacing = (VIEWBOX_SIZE - PADDING * 2) / (gridSize - 1);

  // Conjunto canônico de segmentos esperados no desenho atual
  const targetEdgeSet = useMemo(() => {
    const set = new Set<string>();
    for (const [[x1, y1], [x2, y2]] of level.segments) {
      const sub = subdivideSegment({ x: x1, y: y1 }, { x: x2, y: y2 });
      sub.forEach((k) => set.add(k));
    }
    return set;
  }, [level]);

  const drawnSet = useMemo(() => new Set(drawnEdges), [drawnEdges]);
  const matchedCount = useMemo(
    () => Array.from(targetEdgeSet).filter((k) => drawnSet.has(k)).length,
    [targetEdgeSet, drawnSet]
  );

  const isLevelComplete = matchedCount === targetEdgeSet.size && targetEdgeSet.size > 0;
  const isLastLevel = levelIndex === GRID_LEVELS.length - 1;

  useEffect(() => {
    if (!isLevelComplete) {
      setShowWinOverlay(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setShowWinOverlay(true);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isLevelComplete]);

  const handleSelectLevel = (idx: number) => {
    setLevelIndex(idx);
    setDrawnEdges([]);
    setSelectedDot(null);
    setDragStartDot(null);
    setCursorSvg(null);
    setShowWinOverlay(false);
    activeDragDotRef.current = null;
  };

  const isValidTemplateSegment = useCallback(
    (a: GridPoint, b: GridPoint): boolean => {
      if (a.x === b.x && a.y === b.y) return false;
      const keys = subdivideSegment(a, b);
      return keys.length > 0 && keys.every((k) => targetEdgeSet.has(k));
    },
    [targetEdgeSet]
  );

  const commitSegment = useCallback(
    (a: GridPoint, b: GridPoint): boolean => {
      if (!isValidTemplateSegment(a, b)) {
        return false;
      }

      const newKeys = subdivideSegment(a, b);

      setDrawnEdges((prev) => {
        const prevSet = new Set(prev);
        const toAdd = newKeys.filter((k) => !prevSet.has(k));
        if (toAdd.length === 0) return prev;

        const next = [...prev, ...toAdd];
        const nextSet = new Set(next);
        const allTargetMatched = Array.from(targetEdgeSet).every((k) => nextSet.has(k));

        if (allTargetMatched) {
          playSoftSuccess(soundEnabled);
          setCompletedLevels((cl) => (cl.includes(level.id) ? cl : [...cl, level.id]));
        } else {
          playSoftStep(soundEnabled);
        }

        return next;
      });

      return true;
    },
    [isValidTemplateSegment, targetEdgeSet, soundEnabled, level.id]
  );

  const clientToSvg = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEWBOX_SIZE,
      y: ((clientY - rect.top) / rect.height) * VIEWBOX_SIZE,
    };
  };

  const findNearestDot = (svgX: number, svgY: number, maxRadiusRatio: number): GridPoint | null => {
    const maxDist = cellSpacing * maxRadiusRatio;
    let bestDot: GridPoint | null = null;
    let bestDist = Infinity;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const dx = svgX - toSvgCoord(x, gridSize);
        const dy = svgY - toSvgCoord(y, gridSize);
        const d = Math.hypot(dx, dy);
        if (d <= maxDist && d < bestDist) {
          bestDist = d;
          bestDot = { x, y };
        }
      }
    }
    return bestDot;
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isLevelComplete) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    if (!pt) return;

    // Raio generoso (0.38 * espaçamento) para iniciar em um ponto da malha
    const dot = findNearestDot(pt.x, pt.y, 0.38);
    if (!dot) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    dragMovedRef.current = false;
    pointerDownSvgRef.current = pt;
    activeDragDotRef.current = dot;
    setDragStartDot(dot);
    setCursorSvg(pt);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeDragDotRef.current || isLevelComplete) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    if (!pt) return;

    setCursorSvg(pt);

    if (pointerDownSvgRef.current) {
      const moveDist = Math.hypot(
        pt.x - pointerDownSvgRef.current.x,
        pt.y - pointerDownSvgRef.current.y
      );
      if (moveDist > 10) {
        dragMovedRef.current = true;
        setSelectedDot(null);
      }
    }

    // Só encaixa e avança a âncora se o ponto estiver conectado dentro do gabarito;
    // pontos fora do gabarito são ignorados durante o arrasto para não travar nem desenhar linhas erradas.
    if (dragMovedRef.current) {
      const enteredDot = findNearestDot(pt.x, pt.y, 0.27);
      if (
        enteredDot &&
        (enteredDot.x !== activeDragDotRef.current.x ||
          enteredDot.y !== activeDragDotRef.current.y) &&
        isValidTemplateSegment(activeDragDotRef.current, enteredDot)
      ) {
        commitSegment(activeDragDotRef.current, enteredDot);
        activeDragDotRef.current = enteredDot;
        setDragStartDot(enteredDot);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeDragDotRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const pt = clientToSvg(e.clientX, e.clientY);
    const startDot = activeDragDotRef.current;

    if (dragMovedRef.current && pt) {
      const releaseDot = findNearestDot(pt.x, pt.y, 0.38);
      if (releaseDot && (releaseDot.x !== startDot.x || releaseDot.y !== startDot.y)) {
        const committed = commitSegment(startDot, releaseDot);
        if (!committed) {
          playSoftGentleNudge(soundEnabled);
        }
      }
    } else if (!dragMovedRef.current) {
      // Modo toque-em-dois-pontos: só conclui se o caminho fizer parte do gabarito
      if (!selectedDot) {
        setSelectedDot(startDot);
        playSoftSelect(soundEnabled);
      } else if (selectedDot.x === startDot.x && selectedDot.y === startDot.y) {
        setSelectedDot(null);
      } else {
        const committed = commitSegment(selectedDot, startDot);
        if (!committed) {
          playSoftGentleNudge(soundEnabled);
        }
        setSelectedDot(null);
      }
    }

    activeDragDotRef.current = null;
    pointerDownSvgRef.current = null;
    dragMovedRef.current = false;
    setDragStartDot(null);
    setCursorSvg(null);
  };

  const handleNextLevel = () => {
    if (!isLastLevel) {
      handleSelectLevel(levelIndex + 1);
    } else {
      onFinishAllPhases();
    }
  };

  const allGridDots: GridPoint[] = useMemo(() => {
    const pts: GridPoint[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        pts.push({ x, y });
      }
    }
    return pts;
  }, [gridSize]);

  return (
    <section aria-labelledby="phase3-heading" className="w-full flex-1 flex flex-col max-w-6xl mx-auto">
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 lg:p-6 shadow-sm">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 pb-2.5 sm:pb-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-0.5">
              Fase 3 · Copie na Malha · Nível {levelIndex + 1} de {GRID_LEVELS.length}
            </p>
            <h2 id="phase3-heading" className="text-xl sm:text-3xl font-bold text-slate-900 text-balance">
              Desenho: {level.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="text-right mr-1">
              <div className="text-xs font-medium text-slate-500">Linhas</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {matchedCount} / {targetEdgeSet.size}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDemoMode('manual')}
              className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-base transition-colors min-h-[44px] sm:min-h-[48px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <PlayCircle className="w-5 h-5" />
              Ver exemplo
            </button>
          </div>
        </div>

        {/* Seletor de 10 níveis numerados */}
        <div
          className="my-2 sm:my-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 shrink-0"
          role="navigation"
          aria-label="Níveis da malha"
        >
          {GRID_LEVELS.map((lvl, idx) => {
            const isActive = idx === levelIndex;
            const isDone = completedLevels.includes(lvl.id);
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => handleSelectLevel(idx)}
                aria-label={`Nível ${idx + 1}: ${lvl.name}${isDone ? ' concluído' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                className={`min-w-[40px] sm:min-w-[44px] h-9 sm:h-11 px-2.5 sm:px-3 rounded-xl font-bold text-sm sm:text-base tabular-nums transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Malha Modelo + Malha Interativa ocupando a tela inteira sem textos intermediários */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 lg:gap-8 items-center content-center min-h-0">
          {/* Lado Esquerdo: Modelo de Referência */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[min(54vw,24dvh)] sm:max-w-[min(44vw,25dvh)] md:max-w-[min(40vw,54dvh)] aspect-square rounded-2xl bg-[#FAF9F6] border-2 border-slate-200 p-1.5 sm:p-2">
              <svg
                viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
                className="w-full h-full"
                role="img"
                aria-label={`Modelo de referência: ${level.name}`}
              >
                {/* Grade sutil de guia */}
                {Array.from({ length: gridSize }).map((_, idx) => {
                  const pos = toSvgCoord(idx, gridSize);
                  const start = toSvgCoord(0, gridSize);
                  const end = toSvgCoord(gridSize - 1, gridSize);
                  return (
                    <g key={idx}>
                      <line x1={start} y1={pos} x2={end} y2={pos} stroke="#E2E8F0" strokeWidth="1.5" />
                      <line x1={pos} y1={start} x2={pos} y2={end} stroke="#E2E8F0" strokeWidth="1.5" />
                    </g>
                  );
                })}

                {/* Segmentos do modelo */}
                {Array.from(targetEdgeSet).map((key) => {
                  const [a, b] = parseEdgeKey(key);
                  const matched = drawnSet.has(key);
                  return (
                    <line
                      key={key}
                      x1={toSvgCoord(a.x, gridSize)}
                      y1={toSvgCoord(a.y, gridSize)}
                      x2={toSvgCoord(b.x, gridSize)}
                      y2={toSvgCoord(b.y, gridSize)}
                      stroke={matched ? '#059669' : '#2563EB'}
                      strokeWidth="9"
                      strokeLinecap="round"
                      className="transition-colors duration-150"
                    />
                  );
                })}

                {/* Pontos da malha */}
                {allGridDots.map((dot) => (
                  <circle
                    key={`${dot.x}-${dot.y}`}
                    cx={toSvgCoord(dot.x, gridSize)}
                    cy={toSvgCoord(dot.y, gridSize)}
                    r="7"
                    fill="#FFFFFF"
                    stroke="#64748B"
                    strokeWidth="2.5"
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* Lado Direito: Sua Malha (Desenho Interativo) */}
          <div className="flex flex-col items-center">
            <div
              className={`w-full max-w-[min(86vw,39dvh)] sm:max-w-[min(80vw,41dvh)] md:max-w-[min(40vw,54dvh)] aspect-square rounded-2xl border-2 p-1.5 sm:p-2 transition-colors ${
                isLevelComplete
                  ? 'bg-emerald-50/60 border-emerald-400'
                  : 'bg-white border-blue-200 shadow-inner'
              }`}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-full touch-none select-none cursor-crosshair"
                role="application"
                aria-label="Área de desenho na malha 5 por 5. Arraste entre os pontos ou toque em dois pontos para desenhar linhas retas ou diagonais."
              >
                {/* Grade de apoio sutil */}
                {Array.from({ length: gridSize }).map((_, idx) => {
                  const pos = toSvgCoord(idx, gridSize);
                  const start = toSvgCoord(0, gridSize);
                  const end = toSvgCoord(gridSize - 1, gridSize);
                  return (
                    <g key={idx}>
                      <line x1={start} y1={pos} x2={end} y2={pos} stroke="#E2E8F0" strokeWidth="1.5" />
                      <line x1={pos} y1={start} x2={pos} y2={end} stroke="#E2E8F0" strokeWidth="1.5" />
                    </g>
                  );
                })}

                {/* Linha temporária enquanto arrasta */}
                {dragStartDot && cursorSvg && (
                  <line
                    x1={toSvgCoord(dragStartDot.x, gridSize)}
                    y1={toSvgCoord(dragStartDot.y, gridSize)}
                    x2={cursorSvg.x}
                    y2={cursorSvg.y}
                    stroke="#F97316"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="10 8"
                    className="pointer-events-none"
                  />
                )}

                {/* Linhas válidas desenhadas pelo usuário */}
                {drawnEdges.map((key) => {
                  const [a, b] = parseEdgeKey(key);
                  const x1 = toSvgCoord(a.x, gridSize);
                  const y1 = toSvgCoord(a.y, gridSize);
                  const x2 = toSvgCoord(b.x, gridSize);
                  const y2 = toSvgCoord(b.y, gridSize);

                  return (
                    <line
                      key={key}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isLevelComplete ? '#059669' : '#2563EB'}
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Pontos interativos generosos */}
                {allGridDots.map((dot) => {
                  const cx = toSvgCoord(dot.x, gridSize);
                  const cy = toSvgCoord(dot.y, gridSize);
                  const isSelected =
                    (selectedDot && selectedDot.x === dot.x && selectedDot.y === dot.y) ||
                    (dragStartDot && dragStartDot.x === dot.x && dragStartDot.y === dot.y);

                  return (
                    <g key={`${dot.x}-${dot.y}`}>
                      {isSelected && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="17"
                          fill="#FFEDD5"
                          stroke="#F97316"
                          strokeWidth="3"
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? '9' : '8'}
                        fill={isSelected ? '#F97316' : '#FFFFFF'}
                        stroke={isSelected ? '#EA580C' : '#475569'}
                        strokeWidth="3"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* Cartão centralizado de conclusão — idêntico ao da Fase 1 (visível no celular sem rolar) */}
      {showWinOverlay && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phase3-win-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-white border-2 border-emerald-300 p-6 sm:p-8 shadow-xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-sm">
              <Sparkles className="w-9 h-9" />
            </div>

            <p className="text-base font-bold text-emerald-700 tabular-nums mb-1">
              Desenho {levelIndex + 1} de {GRID_LEVELS.length}
            </p>
            <h3 id="phase3-win-title" className="text-2xl font-bold text-slate-900">
              {isLastLevel
                ? `Parabéns! ${GRID_LEVELS.length} desenhos concluídos!`
                : `Muito bem! "${level.name}" concluído!`}
            </h3>
            <p className="text-base text-slate-600 mt-2">
              {isLastLevel
                ? 'Você finalizou todas as fases com excelente atenção e coordenação.'
                : `Vamos para o próximo desenho: ${GRID_LEVELS[levelIndex + 1].name}.`}
            </p>

            <div className="mt-6 flex w-full">
              <button
                type="button"
                onClick={handleNextLevel}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg min-h-[52px] w-full cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
              >
                {isLastLevel ? 'Voltar ao Início' : 'Próxima Fase'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <VisualDemoModal
        phase="grid"
        isOpen={demoMode !== 'closed'}
        autoClose={demoMode === 'auto'}
        onClose={handleCloseDemo}
      />
    </section>
  );
};
