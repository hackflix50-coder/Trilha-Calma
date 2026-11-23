export type GamePhase = 'menu' | 'stars' | 'maze' | 'grid';

export interface GridPoint {
  x: number; // column (0..4)
  y: number; // row (0..4)
}

export interface GridSegment {
  a: GridPoint;
  b: GridPoint;
}

export interface MazeCell {
  r: number;
  c: number;
}

export interface MazeLevel {
  id: number;
  title: string;
  hint: string;
  matrix: number[][]; // 1 = caminho azul, 0 = bloqueado
  start: MazeCell;
  end: MazeCell;
}

export interface GridDrawingLevel {
  id: number;
  name: string;
  hint: string;
  gridSize: number; // 5 (points 0..4)
  segments: Array<[[number, number], [number, number]]>;
}

export interface StarRound {
  id: number;
  title: string;
  instruction: string;
  targetType: 'star' | 'sun' | 'heart';
  targetColorLabel: string;
  items: Array<{
    id: string;
    type: 'star' | 'circle' | 'square' | 'triangle' | 'moon' | 'hexagon';
    isTarget: boolean;
    variant: 'gold' | 'sky' | 'sage' | 'lavender' | 'coral';
  }>;
}
