export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

export interface SudokuCell {
  value: number;
  isGiven: boolean;
  notes: Set<number>;
  isHighlighted: boolean;
  isError: boolean;
  isSelected: boolean;
}

export interface GameState {
  grid: SudokuCell[][];
  solution: number[][];
  selectedCell: { row: number; col: number } | null;
  difficulty: Difficulty;
  startTime: number;
  elapsedTime: number;
  mistakes: number;
  hintsUsed: number;
  isCompleted: boolean;
  isPaused: boolean;
  isNotesMode: boolean;
}

export interface DifficultyConfig {
  name: string;
  label: string;
  description: string;
  cellsToRemove: number;
  color: string;
  gradient: string;
}