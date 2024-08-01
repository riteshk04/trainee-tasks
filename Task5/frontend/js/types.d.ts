type Cell = {
    data: string,
    top: number
    left: number
    height: number
    width: number
    row: number
    col: number
    isbold: boolean
    strokeStyle: string
    lineWidth: number
    fontSize: number
    font: string
    align: "LEFT" | "CENTER" | "RIGHT"
}
type Pointer = {
    x: number
    y: number
    startx: number
    starty: number
    up: boolean
    horizontal: boolean
    scrollX: number
    scrollY: number

    pscrollX: number
    pscrollY: number
    animatex: number
    animatey: number
    scale: number
}
type SelectionModeCanva = {
    active: boolean
    selectedArea: Cell[],
    startSelectionCell: Cell | null,
    decoration: boolean,
    lineDashOffset: number
}
type Canvas = {
    element: HTMLCanvasElement | null
    ctx: CanvasRenderingContext2D | null
    data: Cell[][],
    startCell: Cell | null,
    endCell: Cell | null
}
type HeaderCanva = Canvas & {
    isDragging: boolean
    edgeDetected: boolean
    startx: number
}
type ExcelInputBox = {
    element: HTMLInputElement | null,
    top: number,
    left: number
}
type KeysPressed = {
    shift: boolean
    ctrl: boolean
    alt: boolean
}
type ActiveFunctions = {
    copy: boolean
}