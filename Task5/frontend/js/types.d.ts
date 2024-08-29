type Cell = {
  id: number;
  data: string;
  top: number;
  left: number;
  height: number;
  width: number;
  row: number;
  col: number;
  isbold: boolean;
  strokeStyle: string;
  lineWidth: number;
  fontSize: number;
  font: string;
  align: "LEFT" | "CENTER" | "RIGHT";
  file: number;
};
type Pointer = {
  x: number;
  y: number;
  startx: number;
  starty: number;
  up: boolean;
  horizontal: boolean;
  scrollX: number;
  scrollY: number;

  pscrollX: number;
  pscrollY: number;
  animatex: number;
  animatey: number;
  scale: number;
};
type SelectionModeCanva = {
  active: boolean;
  selectedArea: Cell[][];
  startSelectionCell: Cell | null;
  decoration: boolean;
  lineDashOffset: number;
};
type Canvas = {
  element: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  data: Cell[][];
  startCell: Cell | null;
  endCell: Cell | null;
};
type HeaderCanva = Canvas & {
  isDragging: boolean;
  edgeDetected: boolean;
  startx: number;
  cell_extend: boolean;
  selected_cells: number;
};
type ExcelInputBox = {
  element: HTMLInputElement | null;
  top: number;
  left: number;
  outMode: boolean;
  prevValue: string;
};
type KeysPressed = {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
};
type ActiveFunctions = {
  copy: boolean;
};
type WorkbookStats = {
  count: number;
  min: number;
  max: number;
  sum: number;
  avg: number;
};

type ChartData = {
  labels: string[] | number[];
  datasets: ChartDataset[];
};
type ChartDataset = {
  data: number[];
  label: string | number;
  backgroundColor: string[];
};
type ChartConfig = {
  position: {
    x: number;
    y: number;
  };
  height: number;
  width: number;
  scale?: number;
};

type ChartType = "LINE" | "BAR";

type AppClipboard = {
  mode: "CUT" | "COPY" | null;
  data: Cell[][];
};

type FindReplaceState = {
  find: string;
  replace: string;
  cells: Cell[];
};

type ExcelAPIUrls = {
  createOrUpdateCell: (data: Cell) => Promise<WorkbookStats>;
  deleteCell: (id: number) => Promise<any>;
};
