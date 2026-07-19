export type ElementType = 'drawing' | 'shape' | 'sticky' | 'text' | 'math-tool' | 'image';

export type ShapeType = 'line' | 'arrow' | 'rect' | 'circle' | 'hexagon';

export interface BoardPoint {
  x: number;
  y: number;
}

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  shapeType?: ShapeType;
  content?: string; // text, formula, or sticky note text
  color?: 'yellow' | 'pink' | 'cyan' | 'green'; // sticky note color presets
  strokeColor?: string; // hex stroke color
  strokeWidth?: number; // drawing/shape thickness
  isFormula?: boolean; // if true, render formatted as mathematical formula
  label?: string; // text annotation associated with geometric shape
  points?: BoardPoint[]; // for freehand drawings
  pageIndex?: number; // book pagination mode (multi-page system)
  toolType?: 
    | 'protractor' | 'ruler' | 'set-square-45' | 'set-square-30' | 'cartesian' | 'block-unit' | 'block-rod' | 'block-flat'
    | 'tangram-tri-lg' | 'tangram-tri-md' | 'tangram-tri-sm' | 'tangram-square' | 'tangram-para'
    | 'poly-pentagon' | 'poly-hexagon'
    | 'number-line' | 'fraction-bar' | 'fraction-circle'
    | 'balance-scale' | 'algebra-tile-x2' | 'algebra-tile-x' | 'algebra-tile-1'
    | 'coin-flip' | 'dice-roll' | 'spinner';
  angle?: number; // angle of rotation for measuring tools (ruler, protractor, set-squares)
  plottedPoints?: BoardPoint[]; // coordinates for points plotted inside the Cartesian graph
  divisions?: number; // for fractions/spinners (e.g. number of parts)
  filledSegments?: number[]; // indices of segments that are highlighted/selected
  leftWeight?: number; // for balance scale
  rightWeight?: number; // for balance scale
  coinFace?: 'Heads' | 'Tails'; // for coin flip
  coinHistory?: string[]; // for coin flip counts
  diceValue?: number; // for dice roll
  diceHistory?: number[]; // for dice history
  spinnerAngle?: number; // active spinning angle
  spinnerSector?: string; // winner sector
  numberLineRange?: { min: number; max: number }; // range for number line
  numberLineHighlights?: number[]; // highlighted points on number line
}

export interface Board {
  id: string;
  title: string;
  modifiedAt: string;
  period: string;
  image?: string;
  elements: BoardElement[];
  canvasMode?: 'normal' | 'unlimited';
  totalPages?: number;
  currentPageIndex?: number;
}

export interface SharedBoard {
  id: string;
  title: string;
  owner: string;
  ownerInitials: string;
  ownerColor: string; // Tailwind class background
  lastAccessed: string;
  icon: 'description' | 'analytics';
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}
