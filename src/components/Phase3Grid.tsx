import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, PlayCircle, RotateCcw, Trash2, Undo2 } from 'lucide-react';
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
  const [history, setHistory] = useState<string[][]>([]);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
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
  const extraEdges = useMemo(
    () => drawnEdges.filter((k) => !targetEdgeSet.has(k)),
    [drawnEdges, targetEdgeSet]
  );

  const isLevelComplete = matchedCount === targetEdgeSet.size && extraEdges.length === 0;
  const isLastLevel = levelIndex === GRID_LEVELS.length - 1;

  const resetCurrentGrid = useCallback(() => {
    setDrawnEdges([]);
    setHistory([]);
    setSelectedDot(null);
    setDragStartDot(null);
    setCursorSvg(null);
    activeDragDotRef.current = null;
  }, []);

  const handleSelectLevel = (idx: number) => {
    setLevelIndex(idx);
    setDrawnEdges([]);
    setHistory([]);
    setSelectedDot(null);
    setDragStartDot(null);
    setCursorSvg(null);
    activeDragDotRef.current = null;
  };

  const commitSegment = useCallback(
    (a: GridPoint, b: GridPoint) => {
      if (a.x === b.x && a.y === b.y) return;
      const newKeys = subdivideSegment(a, b);
      if (newKeys.length === 0) return;

      setDrawnEdges((prev) => {
        const prevSet = new Set(prev);
        const toAdd = newKeys.filter((k) => !prevSet.has(k));
        if (toAdd.length === 0) return prev;

        setHistory((h) => [...h, prev]);
        const next = [...prev, ...toAdd];

        const nextSet = new Set(next);
        const allTargetMatched = Array.from(targetEdgeSet).every((k) => nextSet.has(k));
        const hasExtras = next.some((k) => !targetEdgeSet.has(k));

        if (allTargetMatched && !hasExtras) {
          playSoftSuccess(soundEnabled);
          setCompletedLevels((cl) => (cl.includes(level.id) ? cl : [...cl, level.id]));
        } else if (toAdd.some((k) => !targetEdgeSet.has(k))) {
          playSoftGentleNudge(soundEnabled);
        } else {
          playSoftStep(soundEnabled);
        }

        return next;
      });
    },
    [targetEdgeSet, soundEnabled, level.id]
  );

  const removeEdge = useCallback((edgeKey: string) => {
    setDrawnEdges((prev) => {
      if (!prev.includes(edgeKey)) return prev;
      setHistory((h) => [...h, prev]);
      return prev.filter((k) => k !== edgeKey);
    });
    playSoftSelect(soundEnabled);
  }, [soundEnabled]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setDrawnEdges(previous);
    setSelectedDot(null);
  };

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

    // Raio de encaixe 0.27 durante arrasto garante corredor diagonal livre
    // (ao ir de [0,2] a [1,1], a diagonal passa a 0.50 de [0,1] e [1,2], sem esbarrar neles!)
    if (dragMovedRef.current) {
      const enteredDot = findNearestDot(pt.x, pt.y, 0.27);
      if (
        enteredDot &&
        (enteredDot.x !== activeDragDotRef.current.x ||
          enteredDot.y !== activeDragDotRef.current.y)
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
        commitSegment(startDot, releaseDot);
      }
    } else {
      // Modo toque-em-dois-pontos: permite traçar diagonais facilmente tocando A e depois B
      if (!selectedDot) {
        setSelectedDot(startDot);
        playSoftSelect(soundEnabled);
      } else if (selectedDot.x === startDot.x && selectedDot.y === startDot.y) {
        setSelectedDot(null);
      } else {
        commitSegment(selectedDot, startDot);
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
    <section aria-labelledby="phase3-heading" className="w-full max-w-5xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">
              Fase 3 · Copie na Malha · Nível {levelIndex + 1} de {GRID_LEVELS.length}
            </p>
            <h2 id="phase3-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              Desenho: {level.name}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-1">
              {level.hint}
            </p>
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
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-base transition-colors min-h-[48px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <PlayCircle className="w-5 h-5" />
              Ver exemplo
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0 || isLevelComplete}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-45 disabled:cursor-not-allowed text-slate-700 font-medium text-base transition-colors min-h-[48px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Undo2 className="w-4 h-4" />
              Desfazer
            </button>
            <button
              type="button"
              onClick={resetCurrentGrid}
              disabled={drawnEdges.length === 0 && !selectedDot}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-45 disabled:cursor-not-allowed text-slate-700 font-medium text-base transition-colors min-h-[48px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>

        {/* Seletor de 10 desenhos */}
        <div
          className="my-4 sm:my-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
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
                aria-label={`Desenho ${idx + 1}: ${lvl.name}${isDone ? ' concluído' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                className={`h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-xl font-semibold text-xs sm:text-sm lg:text-base transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="tabular-nums">{idx + 1}.</span> {lvl.name}
              </button>
            );
          })}
        </div>

        {/* Feedback gentil sobre linhas extras */}
        <div className="min-h-[44px] flex items-center justify-center mb-4" aria-live="polite">
          {extraEdges.length > 0 ? (
            <p className="text-base font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
              Há {extraEdges.length === 1 ? 'uma linha tracejada extra' : `${extraEdges.length} linhas tracejadas extras`}. Toque na linha ou use Desfazer para ajustar.
            </p>
          ) : !isLevelComplete ? (
            <p className="text-base text-slate-500 text-center">
              Arraste entre os pontos (inclusive na diagonal) ou toque em dois pontos para ligá-los.
            </p>
          ) : null}
        </div>

        {/* Malha Modelo + Malha Interativa lado a lado (em smartphone, Modelo compacto para ambos caberem na tela) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 items-start">
          {/* Lado Esquerdo: Modelo de Referência */}
          <div className="flex flex-col items-center">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2 sm:mb-3">
              Modelo ({level.name})
            </h3>
            <div className="w-full max-w-[210px] sm:max-w-[270px] md:max-w-[360px] aspect-square rounded-2xl bg-[#FAF9F6] border-2 border-slate-200 p-1.5 sm:p-2">
              <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full h-full">
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
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2 sm:mb-3">
              Sua Malha (Desenhe aqui)
            </h3>
            <div
              className={`w-full max-w-[320px] sm:max-w-[360px] aspect-square rounded-2xl border-2 p-1.5 sm:p-2 transition-colors ${
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

                {/* Linhas desenhadas pelo usuário */}
                {drawnEdges.map((key) => {
                  const [a, b] = parseEdgeKey(key);
                  const isTarget = targetEdgeSet.has(key);
                  const x1 = toSvgCoord(a.x, gridSize);
                  const y1 = toSvgCoord(a.y, gridSize);
                  const x2 = toSvgCoord(b.x, gridSize);
                  const y2 = toSvgCoord(b.y, gridSize);

                  return (
                    <g key={key}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isLevelComplete ? '#059669' : isTarget ? '#2563EB' : '#D97706'}
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={!isTarget ? '8 8' : undefined}
                      />
                      {/* Área transparente mais larga para tocar e remover facilmente qualquer linha */}
                      {!isLevelComplete && (
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="transparent"
                          strokeWidth="26"
                          strokeLinecap="round"
                          className="cursor-pointer"
                          onPointerDown={(ev) => {
                            // Só remove se não estivermos perto de um ponto da malha
                            const pt = clientToSvg(ev.clientX, ev.clientY);
                            if (pt && !findNearestDot(pt.x, pt.y, 0.3)) {
                              ev.stopPropagation();
                              removeEdge(key);
                            }
                          }}
                        />
                      )}
                    </g>
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

        {/* Cartão de Vitória do Desenho Atual */}
        {isLevelComplete && (
          <div
            role="status"
            aria-live="polite"
            className="mt-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-950">
                  {isLastLevel
                    ? `Parabéns! Você completou todos os ${GRID_LEVELS.length} desenhos!`
                    : `Desenho "${level.name}" concluído!`}
                </h3>
                <p className="text-base text-emerald-800">
                  {isLastLevel
                    ? 'Você finalizou todas as fases com excelente atenção e coordenação.'
                    : `Vamos para o próximo desenho: ${GRID_LEVELS[levelIndex + 1].name}.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isLastLevel && (
                <button
                  type="button"
                  onClick={resetCurrentGrid}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 font-semibold text-base transition-colors min-h-[52px] whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Refazer Desenho
                </button>
              )}
              <button
                type="button"
                onClick={handleNextLevel}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg transition-colors min-h-[52px] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
              >
                {isLastLevel ? 'Voltar ao Início' : 'Próxima Fase'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <VisualDemoModal
        phase="grid"
        isOpen={demoMode !== 'closed'}
        autoClose={demoMode === 'auto'}
        onClose={handleCloseDemo}
      />
    </section>
  );
};
