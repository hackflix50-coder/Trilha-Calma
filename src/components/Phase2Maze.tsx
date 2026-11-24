import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Flag, PlayCircle, RotateCcw } from 'lucide-react';
import { MAZE_LEVELS } from '../data/levels';
import { playSoftStep, playSoftSuccess } from '../utils/sound';
import { VisualDemoModal } from './VisualDemoModal';

interface Phase2MazeProps {
  soundEnabled: boolean;
  onGoToNextPhase: () => void;
}

interface BallPos {
  x: number; // grid column space: 0 .. cols (center of cell c is c + 0.5)
  y: number; // grid row space: 0 .. rows (center of cell r is r + 0.5)
}

type WinStage = 'playing' | 'snapping' | 'won';

export const Phase2Maze: React.FC<Phase2MazeProps> = ({ soundEnabled, onGoToNextPhase }) => {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = MAZE_LEVELS[levelIndex];
  const rows = level.matrix.length;
  const cols = level.matrix[0].length;

  const [ballPos, setBallPos] = useState<BallPos>({
    x: level.start.c + 0.5,
    y: level.start.r + 0.5,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [winStage, setWinStage] = useState<WinStage>('playing');
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [demoMode, setDemoMode] = useState<'auto' | 'manual' | 'closed'>('auto');
  const handleCloseDemo = useCallback(() => setDemoMode('closed'), []);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const ballPosRef = useRef<BallPos>(ballPos);
  const snapTimerRef = useRef<number | null>(null);
  const lastSoundCellRef = useRef<string>(`${level.start.r},${level.start.c}`);

  const clearTimers = useCallback(() => {
    if (snapTimerRef.current !== null) {
      window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }
  }, []);

  const resetLevel = useCallback(
    (targetIdx: number) => {
      clearTimers();
      const target = MAZE_LEVELS[targetIdx];
      const initial = { x: target.start.c + 0.5, y: target.start.r + 0.5 };
      ballPosRef.current = initial;
      setBallPos(initial);
      setIsDragging(false);
      setWinStage('playing');
      lastSoundCellRef.current = `${target.start.r},${target.start.c}`;
    },
    [clearTimers]
  );

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Verifica se o quadrado de colisão ao redor do centro (x, y) está 100% em células livres (1)
  const isPositionWalkable = useCallback(
    (x: number, y: number): boolean => {
      const margin = 0.2;
      const minX = x - margin;
      const maxX = x + margin;
      const minY = y - margin;
      const maxY = y + margin;

      if (minX < 0 || maxX >= cols || minY < 0 || maxY >= rows) {
        return false;
      }

      const corners = [
        [minX, minY],
        [maxX, minY],
        [minX, maxY],
        [maxX, maxY],
      ];

      for (const [cx, cy] of corners) {
        const c = Math.floor(cx);
        const r = Math.floor(cy);
        if (r < 0 || r >= rows || c < 0 || c >= cols || level.matrix[r][c] !== 1) {
          return false;
        }
      }
      return true;
    },
    [cols, rows, level.matrix]
  );

  // Dispara o encaixe (snap) exato no centro do quadrado FIM antes de exibir a tela de vitória
  const triggerWinSnap = useCallback(() => {
    if (winStage !== 'playing') return;
    clearTimers();
    setIsDragging(false);
    setWinStage('snapping');

    const exactCenter = {
      x: level.end.c + 0.5,
      y: level.end.r + 0.5,
    };
    ballPosRef.current = exactCenter;
    setBallPos(exactCenter);
    playSoftSuccess(soundEnabled);

    snapTimerRef.current = window.setTimeout(() => {
      setWinStage('won');
      setCompletedLevels((prev) => (prev.includes(level.id) ? prev : [...prev, level.id]));
    }, 450);
  }, [winStage, clearTimers, level.end.c, level.end.r, level.id, soundEnabled]);

  const checkReachedEnd = useCallback(
    (x: number, y: number) => {
      const endCenterX = level.end.c + 0.5;
      const endCenterY = level.end.r + 0.5;
      const dist = Math.hypot(x - endCenterX, y - endCenterY);
      const inEndCell = Math.floor(x) === level.end.c && Math.floor(y) === level.end.r;
      if (inEndCell || dist < 0.42) {
        triggerWinSnap();
        return true;
      }
      return false;
    },
    [level.end.c, level.end.r, triggerWinSnap]
  );

  // Move suavemente em sub-passos com assistência de corredor para curvas sem travar
  const moveBallToward = useCallback(
    (targetX: number, targetY: number) => {
      if (winStage !== 'playing') return;

      let { x, y } = ballPosRef.current;
      const stepSize = 0.06;
      const maxSteps = 45;

      for (let i = 0; i < maxSteps; i++) {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.01) break;

        const moveX = dist > stepSize ? (dx / dist) * stepSize : dx;
        const moveY = dist > stepSize ? (dy / dist) * stepSize : dy;

        let moved = false;

        // Tenta avançar no eixo X
        if (Math.abs(moveX) > 0.001) {
          if (isPositionWalkable(x + moveX, y)) {
            x += moveX;
            moved = true;
          } else {
            // Assistência suave de alinhamento vertical para entrar em corredores horizontais
            const cellCenterY = Math.floor(y) + 0.5;
            const nudgeY = Math.sign(cellCenterY - y) * Math.min(0.05, Math.abs(cellCenterY - y));
            if (Math.abs(nudgeY) > 0.001 && isPositionWalkable(x, y + nudgeY)) {
              y += nudgeY;
              moved = true;
            }
          }
        }

        // Tenta avançar no eixo Y
        if (Math.abs(moveY) > 0.001) {
          if (isPositionWalkable(x, y + moveY)) {
            y += moveY;
            moved = true;
          } else {
            // Assistência suave de alinhamento horizontal para entrar em corredores verticais
            const cellCenterX = Math.floor(x) + 0.5;
            const nudgeX = Math.sign(cellCenterX - x) * Math.min(0.05, Math.abs(cellCenterX - x));
            if (Math.abs(nudgeX) > 0.001 && isPositionWalkable(x + nudgeX, y)) {
              x += nudgeX;
              moved = true;
            }
          }
        }

        if (!moved) break;

        const currCellKey = `${Math.floor(y)},${Math.floor(x)}`;
        if (currCellKey !== lastSoundCellRef.current) {
          lastSoundCellRef.current = currCellKey;
          playSoftStep(soundEnabled);
        }

        if (checkReachedEnd(x, y)) {
          return;
        }
      }

      ballPosRef.current = { x, y };
      setBallPos({ x, y });
    },
    [winStage, isPositionWalkable, checkReachedEnd, soundEnabled]
  );

  const clientToGrid = useCallback(
    (clientX: number, clientY: number): BallPos | null => {
      const board = boardRef.current;
      if (!board) return null;
      const rect = board.getBoundingClientRect();
      const gx = ((clientX - rect.left) / rect.width) * cols;
      const gy = ((clientY - rect.top) / rect.height) * rows;
      return {
        x: Math.max(0.22, Math.min(cols - 0.22, gx)),
        y: Math.max(0.22, Math.min(rows - 0.22, gy)),
      };
    },
    [cols, rows]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (winStage !== 'playing') return;
    const pt = clientToGrid(e.clientX, e.clientY);
    if (!pt) return;

    const distToBall = Math.hypot(pt.x - ballPosRef.current.x, pt.y - ballPosRef.current.y);
    // Área de captura generosa ao redor da bolinha laranja
    if (distToBall <= 0.85) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || winStage !== 'playing') return;
    const pt = clientToGrid(e.clientX, e.clientY);
    if (!pt) return;
    moveBallToward(pt.x, pt.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore if not captured
      }
    }
    setIsDragging(false);
  };

  // Suporte acessível para teclado e botões direcionais (1 célula por clique/tecla)
  const stepByCell = useCallback(
    (dr: number, dc: number) => {
      if (winStage !== 'playing') return;
      const currR = Math.floor(ballPosRef.current.y);
      const currC = Math.floor(ballPosRef.current.x);
      const nextR = currR + dr;
      const nextC = currC + dc;

      if (
        nextR >= 0 &&
        nextR < rows &&
        nextC >= 0 &&
        nextC < cols &&
        level.matrix[nextR][nextC] === 1
      ) {
        const nextPos = { x: nextC + 0.5, y: nextR + 0.5 };
        ballPosRef.current = nextPos;
        setBallPos(nextPos);
        playSoftStep(soundEnabled);
        checkReachedEnd(nextPos.x, nextPos.y);
      }
    },
    [winStage, rows, cols, level.matrix, soundEnabled, checkReachedEnd]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (winStage !== 'playing') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        stepByCell(-1, 0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        stepByCell(1, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        stepByCell(0, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        stepByCell(0, 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [winStage, stepByCell]);

  const handleSelectLevel = (idx: number) => {
    setLevelIndex(idx);
    resetLevel(idx);
  };

  const handleNextLevel = () => {
    if (levelIndex < MAZE_LEVELS.length - 1) {
      const nextIdx = levelIndex + 1;
      setLevelIndex(nextIdx);
      resetLevel(nextIdx);
    } else {
      onGoToNextPhase();
    }
  };

  const isLastLevel = levelIndex === MAZE_LEVELS.length - 1;

  return (
    <section aria-labelledby="phase2-heading" className="w-full max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
        {/* Header do Nível */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">
              Fase 2 · Labirinto · Nível {levelIndex + 1} de {MAZE_LEVELS.length}
            </p>
            <h2 id="phase2-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {level.title}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-1">
              Siga o caminho azul
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto shrink-0">
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
              onClick={() => resetLevel(levelIndex)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-base transition-colors min-h-[48px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Nível
            </button>
          </div>
        </div>

        {/* Seletor de 10 níveis */}
        <div className="my-4 sm:my-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" role="navigation" aria-label="Níveis do labirinto">
          {MAZE_LEVELS.map((lvl, idx) => {
            const isActive = idx === levelIndex;
            const isDone = completedLevels.includes(lvl.id);
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => handleSelectLevel(idx)}
                aria-label={`Nível ${idx + 1}${isDone ? ' concluído' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                className={`min-w-[40px] sm:min-w-[44px] h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl font-bold text-sm sm:text-base tabular-nums transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
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

        {/* Área do Labirinto centralizada */}
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[380px] sm:max-w-[440px] mx-auto">
            <div
              ref={boardRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                aspectRatio: `${cols} / ${rows}`,
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              }}
              className="relative grid w-full rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-200 gap-1 p-1.5 select-none touch-none shadow-inner"
              role="application"
              aria-label="Tabuleiro do labirinto. Arraste a bolinha laranja pelo caminho azul até FIM ou use as setas do teclado."
            >
              {level.matrix.map((row, r) =>
                row.map((cellValue, c) => {
                  const isStart = r === level.start.r && c === level.start.c;
                  const isEnd = r === level.end.r && c === level.end.c;
                  const isPath = cellValue === 1;

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`relative flex items-center justify-center rounded-lg transition-colors ${
                        isEnd
                          ? 'bg-emerald-100 border-2 border-emerald-500'
                          : isPath
                          ? 'bg-blue-100 border border-blue-200'
                          : 'bg-slate-300/80 border border-slate-300'
                      }`}
                    >
                      {isStart && winStage === 'playing' && (
                        <span
                          className={`font-bold uppercase tracking-wide text-blue-700/70 select-none pointer-events-none ${
                            cols >= 6 ? 'text-[9px] sm:text-xs' : 'text-[10px] sm:text-xs'
                          }`}
                        >
                          Início
                        </span>
                      )}
                      {isEnd && (
                        <div className="flex flex-col items-center justify-center select-none pointer-events-none">
                          <Flag
                            className={`text-emerald-700 mb-0.5 ${
                              cols >= 6 ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-5 sm:h-5'
                            }`}
                            strokeWidth={2.5}
                          />
                          <span
                            className={`font-extrabold tracking-wide text-emerald-900 leading-none ${
                              cols >= 6 ? 'text-[9px] sm:text-xs' : 'text-[11px] sm:text-sm'
                            }`}
                          >
                            FIM
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Bolinha Laranja (Arrastável + Snap exato no centro do FIM) */}
              <div
                style={{
                  left: `${(ballPos.x / cols) * 100}%`,
                  top: `${(ballPos.y / rows) * 100}%`,
                  width: `${(0.64 / cols) * 100}%`,
                  height: `${(0.64 / rows) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-10 rounded-full flex items-center justify-center pointer-events-none ${
                  winStage === 'snapping' || winStage === 'won'
                    ? 'transition-all duration-200 ease-out bg-orange-500 ring-4 ring-emerald-400 shadow-lg scale-105'
                    : isDragging
                    ? 'transition-none bg-orange-500 ring-4 ring-orange-200 shadow-lg scale-110'
                    : 'transition-all duration-150 ease-out bg-orange-500 ring-4 ring-orange-200/80 shadow-md'
                }`}
                aria-hidden="true"
              >
                <span className="w-2/5 h-2/5 rounded-full bg-orange-200/70" />
              </div>
            </div>

            {/* Overlay suave de vitória APÓS o snap no centro de FIM (visível no celular sem rolar) */}
            {winStage === 'won' && (
              <div
                className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="phase2-win-title"
              >
                <div className="w-full max-w-md rounded-3xl bg-white border-2 border-emerald-300 p-6 sm:p-8 shadow-xl text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <p className="text-sm font-bold text-emerald-700 mb-1">
                    Nível {levelIndex + 1} de {MAZE_LEVELS.length}
                  </p>
                  <h3 id="phase2-win-title" className="text-2xl font-bold text-slate-900">
                    {isLastLevel ? 'Parabéns! 10 labirintos concluídos!' : 'Muito bem! Você chegou ao FIM!'}
                  </h3>
                  <p className="text-base text-slate-600 mt-2">
                    {isLastLevel
                      ? 'Você está pronto para a Fase 3: Copie na Malha.'
                      : `Siga para o nível ${levelIndex + 2} de ${MAZE_LEVELS.length}.`}
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => resetLevel(levelIndex)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-base min-h-[52px] flex-1 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Refazer
                    </button>
                    <button
                      type="button"
                      onClick={handleNextLevel}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg min-h-[52px] flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
                    >
                      {isLastLevel ? 'Ir para Fase 3' : 'Próxima Fase'}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <VisualDemoModal
        phase="maze"
        isOpen={demoMode !== 'closed'}
        autoClose={demoMode === 'auto'}
        onClose={handleCloseDemo}
      />
    </section>
  );
};
