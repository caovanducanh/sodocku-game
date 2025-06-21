export class SudokuGenerator {
  private grid: number[][];

  constructor() {
    this.grid = Array(9).fill(null).map(() => Array(9).fill(0));
  }

  // Generate a complete valid Sudoku grid
  generateComplete(): number[][] {
    this.grid = Array(9).fill(null).map(() => Array(9).fill(0));
    this.fillGrid();
    return this.grid.map(row => [...row]);
  }

  // Fill the grid using backtracking with randomization
  private fillGrid(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] === 0) {
          const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          
          for (const num of numbers) {
            if (this.isValidPlacement(row, col, num)) {
              this.grid[row][col] = num;
              
              if (this.fillGrid()) {
                return true;
              }
              
              this.grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  // Check if a number can be placed at the given position
  private isValidPlacement(row: number, col: number, num: number): boolean {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (this.grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (this.grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.grid[boxRow + i][boxCol + j] === num) return false;
      }
    }

    return true;
  }

  // Shuffle array using Fisher-Yates algorithm for randomization
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Create puzzle by removing numbers randomly based on difficulty
  createPuzzle(solution: number[][], difficulty: string): number[][] {
    const puzzle = solution.map(row => [...row]);
    
    const cellsToRemove = this.getCellsToRemove(difficulty);
    const positions = [];
    
    // Create array of all positions
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        positions.push({ row: i, col: j });
      }
    }
    
    // Shuffle positions randomly
    const shuffledPositions = this.shuffleArray(positions);
    
    // Remove cells randomly
    for (let i = 0; i < cellsToRemove && i < shuffledPositions.length; i++) {
      const { row, col } = shuffledPositions[i];
      puzzle[row][col] = 0;
    }
    
    return puzzle;
  }

  // Difficulty levels with more empty cells for higher difficulty
  private getCellsToRemove(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 35;    // ~35 empty cells
      case 'medium': return 45;  // ~45 empty cells
      case 'hard': return 52;    // ~52 empty cells
      case 'expert': return 58;  // ~58 empty cells
      case 'master': return 64;  // ~64 empty cells
      default: return 45;
    }
  }

  // Validate if a move is legal
  isValidMove(grid: number[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (x !== col && grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (x !== row && grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const checkRow = boxRow + i;
        const checkCol = boxCol + j;
        if ((checkRow !== row || checkCol !== col) && grid[checkRow][checkCol] === num) {
          return false;
        }
      }
    }

    return true;
  }
}