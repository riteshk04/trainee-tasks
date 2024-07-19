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

const primaryColor = "#03723c"
const strokeColor = "#dadada"


class Excel {
    header: CanvasRenderingContext2D | null = null;
    sidebar: CanvasRenderingContext2D | null = null;
    ctx: CanvasRenderingContext2D | null = null;

    data: Cell[][]
    headers: Cell[][] = []
    sidebarcells: Cell[] = []
    selectedCells: Cell[] = []
    selectedArea: Cell[] = []
    activeInputCell!: Cell
    startSelectionCell!: Cell
    wrapper: HTMLElement;
    edgeCell!: Cell
    inputBox!: HTMLInputElement;

    tableWidth: number = 0
    tableHeight: number = 0
    cellheight: number = 30
    cellwidth: number = 100
    mincellwidth: number = 60
    startx: number = 0
    prevWidth: number = 0
    csv: string;

    scrollX: number = 0
    scrollY: number = 0
    isDraggingCanvas: boolean = false
    isDraggingHeader: boolean = false
    inputActive: boolean = false
    edgeDetected: boolean = false
    selectionMode: boolean = false
    // startCell!: Cell
    canvasElement!: HTMLCanvasElement
    sidebarElement!: HTMLCanvasElement
    headerElement!: HTMLCanvasElement

    constructor(parentElement: HTMLElement, csv: string) {
        this.data = []
        this.wrapper = parentElement
        this.csv = csv.trim()
    }

    init() {
        this.createData()
        this.createMarkup()
        this.createHeader()
        this.drawHeader()
        this.drawSidebar()
        // this.drawGrid()
        this.drawOptimized()
        this.resizer()
        this.attachEventHandlers()
    }

    // Event handlers

    attachEventHandlers() {
        this.canvasElement.addEventListener("mouseup", this.canvasMouseupHandler.bind(this))
        this.canvasElement.addEventListener("mousedown", this.canvasMouseDownHandler.bind(this))
        this.canvasElement.addEventListener("mousemove", this.canvasMouseMoveHandler.bind(this))
        this.canvasElement.addEventListener("mouseout", () => { this.isDraggingCanvas = false })
        this.canvasElement.addEventListener("wheel", this.scroller.bind(this))

        this.headerElement.addEventListener("mousemove", this.headerMouseMoveObserver.bind(this))
        this.headerElement.addEventListener("mouseup", this.headerMouseUpObserver.bind(this))
        this.headerElement.addEventListener("mousedown", this.headerMouseDownObserver.bind(this))
        this.headerElement.addEventListener("mouseout", () => { this.isDraggingHeader = false })

        window.addEventListener("keydown", this.windowKeypressHandler.bind(this))
    }

    canvasMouseupHandler(event: MouseEvent) {
        const { cell } = this.getCell(event)
        let newSelectedArea = this.getCellsArea(this.startSelectionCell, cell)

        if (!newSelectedArea.length) return
        if (newSelectedArea.length > 1) {
            this.selectedArea = newSelectedArea
            this.createStatus()
        } else {
            let cell = newSelectedArea[0]
            this.selectedArea.forEach(c => this.drawCell(c))
            if (this.checkSameCell(this.activeInputCell, cell)) {
                // input box if same cell
                this.createInputBox(cell)
            } else {
                this.inputBox.style.display = "none"
                this.setActiveCell(cell)
            }

        }
        this.selectionMode = false
    }

    createStatus() {
        let min = Math.min(...this.selectedArea.map(c => parseInt(c.data) || 0))
        let max = Math.min(...this.selectedArea.map(c => parseInt(c.data) || 0))
        let sum = this.selectedArea.map(c => parseInt(c.data) || 0).reduce((a, c) => a + c, 0)
    }

    getCellsArea(startCell: Cell, endCell: Cell) {
        let { row: starty, col: startx } = startCell
        let { row: endy, col: endx } = endCell

        let startX = Math.min(startx, endx)
        let endX = Math.max(startx, endx)
        let startY = Math.min(starty, endy)
        let endY = Math.max(starty, endy)


        let newSelection = []
        for (let i = startY; i <= endY; i++) {
            for (let j = startX; j <= endX; j++) {
                newSelection.push(this.data[i][j])
            }
        }
        return newSelection
    }

    canvasMouseDownHandler(event: MouseEvent) {
        const { cell } = this.getCell(event)
        this.startSelectionCell = cell
        this.selectionMode = true
    }

    canvasMouseMoveHandler(event: MouseEvent) {
        if (this.selectionMode) {
            this.inputBox.style.display = "none"
            if (!this.checkSameCell(this.activeInputCell, this.startSelectionCell)) {
                this.drawCell(this.activeInputCell)
                this.activeInputCell = this.startSelectionCell
                this.setActiveCell(this.activeInputCell)
            }
            const { cell } = this.getCell(event)
            const selectedArea = this.getCellsArea(this.startSelectionCell, cell)
            this.highlightCells(this.startSelectionCell, cell)
            const toRemoved = this.selectedArea.filter(c => selectedArea.indexOf(c) === -1)
            // selectedArea.forEach(c => this.drawCell(c))
            toRemoved.forEach(c => this.drawCell(c))
            this.selectedArea = selectedArea
        }
    }

    windowKeypressHandler(event: KeyboardEvent) {
        this.inputBox.style.display = "none"
        let ctrlClick = false
        switch (event.key) {
            case "Control":
                ctrlClick = true
                break
            case "ArrowDown":
                this.moveActiveCell("BOTTOM")
                break;
            case "ArrowUp":
                this.moveActiveCell("TOP")
                break;
            case "ArrowLeft":
                this.moveActiveCell("LEFT")
                break;
            case "ArrowRight":
                this.moveActiveCell("RIGHT")
                break;
            case "Tab":
                this.moveActiveCell("RIGHT")
                break;
            case "Enter":
                this.moveActiveCell("BOTTOM")
                break;
            case "Escape":
                break;
            case "Backspace":
                let value = this.activeInputCell.data
                this.activeInputCell.data = value.substring(0, value.length - 1)
                this.drawCell(this.activeInputCell)
                this.highLightCell(this.activeInputCell)
                break
            default:
                if (event.key.match(/^\w$/)) {
                    this.createInputBox(this.activeInputCell)
                }
                this.drawCell(this.activeInputCell)
                this.highLightCell(this.activeInputCell)
                return;
        }
        if (!ctrlClick && this.selectedArea.length > 1) {
            this.selectedArea.forEach(c => this.drawCell(c))
        }
    }

    headerMouseMoveObserver(event: MouseEvent) {
        const gap = 2
        const { x } = this.getCoordinates(event, this.headerElement)

        for (let i = 1; i < this.headers[0].length; i++) {
            const edge = this.headers[0][i].left;

            if (Math.max(edge - gap, 0) < x && x < edge + gap) {
                this.edgeDetected = true
                this.headerElement.style.cursor = "col-resize"
                if (!this.isDraggingHeader) {
                    this.edgeCell = this.headers[0][i - 1]
                    this.prevWidth = this.edgeCell.width
                }
                break
            }
            if (!this.isDraggingHeader)
                this.headerElement.style.cursor = "default"
            this.edgeDetected = false
        }

        if (this.isDraggingHeader) {
            let diff = x - this.startx
            let newWidth = this.prevWidth + diff
            this.widthShifter(this.edgeCell, newWidth, this.headers)
            this.widthShifter(this.edgeCell, newWidth, this.data)
            this.drawHeader()
            this.drawGrid()
        }
    }

    headerMouseUpObserver(event: MouseEvent) {
        if (this.isDraggingHeader) {
            this.isDraggingHeader = false
        }
    }

    headerMouseDownObserver(event: MouseEvent) {
        if (this.edgeDetected) {
            this.isDraggingHeader = true
            const { x } = this.getCoordinates(event)
            this.startx = x
            this.prevWidth = this.edgeCell.width
        }
    }

    // Draw methods

    drawGrid() {
        this.ctx?.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
        this.data.forEach(row => row.forEach(cell => {
            this.drawCell(cell, this.ctx, false)
        }))
        if (this.data.length && this.data[0].length) {
            if (!this.activeInputCell) {
                this.activeInputCell = this.data[0][0]
            }
            this.highLightCell(this.activeInputCell)
        }
    }

    drawOptimized() {
        this.ctx?.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
        let canvaWidth = this.canvasElement.offsetWidth
        let canvaHeight = this.canvasElement.offsetHeight

        let initHeight = 0
        let newScrollY = (this.scrollY / 100) * this.cellheight
        let newScrollX = this.scrollX
        this.ctx?.translate(-newScrollX, -newScrollY)

        for (let i = newScrollY / this.cellheight; i < this.data.length; i++) {
            const row = this.data[i];
            if (i === this.data.length - 1) {
                this.extendData(10, "Y")
            }
            if (initHeight > canvaHeight + newScrollY) {
                break
            } else {
                let initWidth = 0
                initHeight += row[0].height

                for (let j = 0; j < row.length; j++) {
                    const col = row[j];
                    if (initWidth >= newScrollX && initWidth <= canvaWidth) {
                        this.drawCell(col)
                    }
                    if (initWidth > canvaWidth) break
                }
                // if (initHeight >= newScrollY && initHeight <= canvaHeight) {
                // }
                // if (initHeight > canvaHeight + newScrollY) break
            }
        }
        this.ctx?.setTransform(1, 0, 0, 1, 0, 0);

        // if (this.data.length && this.data[0].length) {
        //     if (!this.activeInputCell) {
        //         this.activeInputCell = this.data[0][0]
        //     }
        //     this.highLightCell(this.activeInputCell)
        // }
    }

    createHeader() {
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let arr = chars.split("")
        let arr1d: Cell[] = []

        if (this.header) {
            arr.forEach((c, j) => {
                let cell: Cell = {
                    data: c,
                    top: 0,
                    left: j * this.cellwidth,
                    height: this.cellheight,
                    width: this.cellwidth,
                    row: 0,
                    col: j,
                    isbold: false,
                    strokeStyle: strokeColor,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "CENTER"
                }
                arr1d.push(cell)
            })
            this.headers.push(arr1d)
        }
    }

    widthShifter(cell: Cell, newWidth: number, data: Cell[][]) {
        if (newWidth < 60) {
            newWidth = 60
        }

        data.forEach(row => {
            let widthChanged = false
            row.forEach((c, i) => {
                if (!widthChanged) {
                    if (c.left === cell.left) {
                        c.width = newWidth
                        widthChanged = true
                    }
                } else {
                    c.left = row[i - 1].left + row[i - 1].width
                }
            })
        })
    }

    drawHeader() {
        this.headers[0].forEach(cell => {
            this.drawCell(cell, this.header, true)
        })
    }

    drawSidebar() {
        let arr = [...Array(50)].map((_, i) => i + 1)
        if (this.header) {
            arr.forEach((c, i) => {
                let cell: Cell = {
                    data: String(c),
                    top: i * this.cellheight,
                    left: 0,
                    height: this.cellheight,
                    width: this.mincellwidth,
                    row: 0,
                    col: i,
                    isbold: false,
                    strokeStyle: strokeColor,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "LEFT"
                }
                this.drawCell(cell, this.sidebar, true)
                this.sidebarcells.push(cell)
            })
        }
    }

    // Data methods

    createMarkup() {
        this.wrapper.style.boxSizing = "border-box"
        this.wrapper.style.position = "relative"

        let inputBox = document.createElement("input")
        inputBox.style.display = "none"
        inputBox.style.position = "absolute"
        inputBox.style.boxSizing = "border-box"
        inputBox.style.outline = "none"

        let emptyBox = document.createElement("div")
        emptyBox.style.width = `${this.mincellwidth}px`
        emptyBox.style.height = `${this.cellheight}px`
        emptyBox.style.boxSizing = "border-box"
        emptyBox.style.display = "inline-block"


        let header = document.createElement("canvas")
        header.width = this.wrapper.offsetWidth - this.cellwidth
        header.height = this.cellheight
        header.style.boxSizing = "border-box"

        this.wrapper.appendChild(emptyBox)
        this.wrapper.appendChild(header)

        let sidebar = document.createElement("canvas")
        sidebar.width = this.mincellwidth
        sidebar.height = this.wrapper.offsetHeight - this.cellheight

        let inputBoxWrapper = document.createElement("div")
        inputBoxWrapper.style.position = "relative"
        inputBoxWrapper.style.display = "inline-block"

        let canvas = document.createElement("canvas")
        canvas.width = this.wrapper.offsetWidth - this.mincellwidth
        canvas.height = this.wrapper.offsetHeight - this.cellheight
        canvas.style.cursor = "cell"

        inputBoxWrapper.appendChild(canvas)
        inputBoxWrapper.appendChild(inputBox)

        this.wrapper.appendChild(sidebar)
        this.wrapper.appendChild(inputBoxWrapper)

        this.ctx = canvas.getContext("2d")
        this.header = header.getContext("2d")
        this.sidebar = sidebar.getContext("2d")

        // canvas.addEventListener("wheel", (e) => this.scroller(e, canvas))
        // sidebar.addEventListener("wheel", (e) => this.scroller(e, sidebar))
        // header.addEventListener("wheel", (e) => this.scroller(e, header))

        this.canvasElement = canvas
        this.sidebarElement = sidebar
        this.headerElement = header
        this.inputBox = inputBox

        this.canvasElement.width = this.wrapper.offsetWidth - this.mincellwidth
        this.canvasElement.height = this.wrapper.offsetHeight - this.cellheight
        this.headerElement.width = this.wrapper.offsetWidth - this.cellwidth
        this.sidebarElement.height = this.wrapper.offsetHeight - this.cellheight
    }

    createData() {
        this.data = []
        let rows = this.csv.split("\n")
        rows.forEach((row, i) => {
            let cols = row.split(",")
            let dataRow: Cell[] = []
            cols.forEach((col, j) => {
                let cell: Cell = {
                    data: col,
                    top: i * this.cellheight,
                    left: j * this.cellwidth,
                    height: this.cellheight,
                    width: this.cellwidth,
                    row: i,
                    col: j,
                    isbold: false,
                    strokeStyle: strokeColor,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "LEFT"
                }
                dataRow.push(cell)
            })
            this.data.push(dataRow)
        })
    }

    extendData(count: number, axis: "X" | "Y") {
        if (axis == "X") {
            this.data.forEach((row, i) => {
                let left = row[row.length - 1].left + row[row.length - 1].width
                let top = row[row.length - 1].top
                let height = this.cellheight
                let width = this.cellwidth
                let prevColumns = row.length
                for (let j = prevColumns; j < prevColumns + count; j++) {
                    let cell: Cell = {
                        data: "",
                        top: top,
                        left: left,
                        height: height,
                        width: width,
                        row: i,
                        col: j,
                        isbold: false,
                        strokeStyle: strokeColor,
                        lineWidth: 1,
                        fontSize: 16,
                        font: "Arial",
                        align: "LEFT"
                    }
                    row.push(cell)
                    this.drawCell(cell)
                }
            })
        } else {
            let prevRows = this.data.length
            for (let i = prevRows; i < prevRows + count; i++) {

                const prev = this.data[i - 1];
                console.log("🚀 ~ Excel ~ extendData ~ prev:", prev[i - 1])
                let height = this.cellheight
                let width = this.cellwidth
                let row = []

                for (let j = 0; j < prev.length; j++) {
                    let left = prev[j].left
                    let top = prev[j].top + prev[j].height
                    let cell: Cell = {
                        data: "",
                        top: top,
                        left: left,
                        height: height,
                        width: width,
                        row: i,
                        col: j,
                        isbold: false,
                        strokeStyle: strokeColor,
                        lineWidth: 1,
                        fontSize: 16,
                        font: "Arial",
                        align: "CENTER"
                    }
                    this.drawCell(cell)
                    row.push(cell)
                }
                this.data.push(row)
            }
        }
    }

    resizer() {
        const resizeEventHandler = function (this: any) {
            this.canvasElement.width = this.wrapper.offsetWidth - this.mincellwidth
            this.canvasElement.height = this.wrapper.offsetHeight - this.cellheight
            this.headerElement.width = this.wrapper.offsetWidth - this.cellwidth
            this.sidebarElement.height = this.wrapper.offsetHeight - this.cellheight
            this.drawGrid()
            this.drawHeader()
            this.drawSidebar()
        }
        window.addEventListener("resize", resizeEventHandler.bind(this))
    }

    clearElement(ele: HTMLElement, context?: CanvasRenderingContext2D | null) {
        if (!context) context = this.ctx!
        context.clearRect(0, 0, ele.offsetWidth, ele.offsetHeight)
    }


    // cell methods

    getCoordinates(event: MouseEvent, canvasElement?: HTMLCanvasElement) {
        if (!canvasElement) {
            canvasElement = this.canvasElement
        }
        let rect = canvasElement.getBoundingClientRect()
        let x = event.clientX - rect.left
        let y = event.clientY - rect.top
        return { x, y }
    }

    getCell(event: MouseEvent) {
        const { x, y } = this.getCoordinates(event)
        for (let i = 0; i < this.data.length; i++) {
            const row = this.data[i];
            for (let j = 0; j < row.length; j++) {
                const cell = row[j];
                if (cell.left < x && x <= cell.left + cell.width && cell.top < y && y <= cell.top + cell.height) {
                    return { cell, x, y }
                }
            }
        }
        return { cell: this.data[0][0], x, y }
    }

    drawCell(cell: Cell, ctx?: CanvasRenderingContext2D | null, clear: boolean = true) {
        let context = null
        context = ctx ? ctx : this.ctx

        if (context) {
            context.strokeStyle = cell.strokeStyle;
            context.lineWidth = cell.lineWidth;
            context.setLineDash([])
            context.font = `${cell.fontSize}px ${cell.font}`;
            if (clear)
                context.clearRect(cell.left - 2, cell.top - 2, cell.width + 4, cell.height + 4)
            context.clearRect(cell.left, cell.top, cell.width, cell.height)
            context.beginPath()
            context.save()
            context.rect(cell.left, cell.top, cell.width, cell.height)
            // context.fillStyle = "#65eaf84a"
            // context.fillRect(cell.left, cell.top, cell.width, cell.height)
            context.clip()
            context.fillText(cell.data, cell.align === "CENTER" ? (cell.width / 2 + cell.left - 4) : cell.left + 5, (cell.height / 2 + cell.top) + 5)
            context.restore()
            context.stroke()
        }
    }

    moveActiveCell(direction: "TOP" | "LEFT" | "RIGHT" | "BOTTOM") {
        let { row, col } = this.activeInputCell
        if (!this.activeInputCell)
            return;
        this.drawCell(this.activeInputCell)
        // this.removeHighLight(this.activeInputCell)

        switch (direction) {
            case "TOP":
                this.activeInputCell = this.data[Math.max(row - 1, 0)][col]
                break
            case "LEFT":
                this.activeInputCell = this.data[row][Math.max(col - 1, 0)]
                break
            case "RIGHT":
                this.activeInputCell = this.data[row][Math.min(this.data[0].length - 1, col + 1)]
                break
            case "BOTTOM":
                this.activeInputCell = this.data[Math.min(this.data.length - 1, row + 1)][col]
                break
        }
        this.highLightCell(this.activeInputCell)
    }

    setActiveCell(cell: Cell) {
        this.drawCell(this.activeInputCell)
        this.activeInputCell = cell
        this.highLightCell(this.activeInputCell)
    }

    highLightCell(cell: Cell) {
        let context = this.ctx
        if (!context) return;
        context.strokeStyle = primaryColor
        context.lineWidth = 2
        context.beginPath()
        context.strokeRect(this.scrollX + cell.left, this.scrollY + cell.top, cell.width, cell.height)
        context.stroke()
    }

    highlightCells(startCell: Cell, endCell: Cell, ants?: boolean) {
        this.selectedArea.forEach(c => this.drawCell(c, undefined, true))
        let context = this.ctx
        if (!context) return;
        context.strokeStyle = primaryColor
        context.lineWidth = 2
        context.beginPath()
        if (ants)
            context.setLineDash([5, 3])
        // context.strokeRect(this.scrollX + startCell.left, this.scrollY + startCell.top, cell.width, cell.height)
        let leftX1 = Math.min(startCell.left, endCell.left, startCell.left + startCell.width, endCell.left + endCell.width)
        let leftX2 = Math.max(startCell.left, endCell.left, startCell.left + startCell.width, endCell.left + endCell.width)
        let topX1 = Math.min(startCell.top, endCell.top + endCell.height, startCell.top + startCell.height, endCell.top)
        let topX2 = Math.max(startCell.top, endCell.top + endCell.height, startCell.top + startCell.height, endCell.top)

        context.moveTo(leftX1, topX1)
        context.lineTo(leftX2, topX1)
        context.lineTo(leftX2, topX2)
        context.lineTo(leftX1, topX2)
        context.lineTo(leftX1, topX1)
        context.stroke()
    }

    setSelectionCell(cell: Cell, ctx?: CanvasRenderingContext2D | null) {
        let context = null
        context = ctx ? ctx : this.ctx

        if (context) {
            context.strokeStyle = cell.strokeStyle;
            context.lineWidth = cell.lineWidth;
            context.font = `${cell.fontSize}px ${cell.font}`;
            context.clearRect(this.scrollX + cell.left, this.scrollY + cell.top, cell.width, cell.height)
            context.beginPath()
            context.save()
            context.rect(this.scrollX + cell.left, this.scrollY + cell.top, cell.width, cell.height)
            context.fillStyle = "#65eaf84a"
            context.fillRect(this.scrollX + cell.left, this.scrollY + cell.top, cell.width, cell.height)
            context.clip()
            context.fillText(cell.data, cell.align === "CENTER" ? (cell.width / 2 + cell.left - 4) : cell.left + 5, (cell.height / 2 + cell.top) + 5)
            context.restore()
            context.stroke()
        }
    }

    checkSameCell(cell1: Cell, cell2: Cell) {
        const { top, left } = cell1
        return cell2.top === top && cell2.left == left
    }

    // Input box
    createInputBox(cell: Cell) {
        const { top, left, width, height, font, fontSize, data } = cell
        this.inputBox.style.top = `${top}px`
        this.inputBox.style.left = `${left}px`
        this.inputBox.style.width = `${width}px`
        this.inputBox.style.height = `${height}px`
        this.inputBox.style.font = `${font}`
        this.inputBox.style.fontSize = `${fontSize}px`
        this.inputBox.style.paddingLeft = `3px`
        this.inputBox.style.border = `1px solid ${primaryColor}`
        this.inputBox.value = `${data}`
        // if (!this.inputActive) {
        this.inputBox.style.display = `block`
        this.inputBox.focus()
        this.inputActive = true
        // }
    }

    scroller(event: WheelEvent) {
        let { deltaX, deltaY } = event
        this.scrollX = Math.max(0, this.scrollX + deltaX)
        this.scrollY = Math.max(0, this.scrollY + deltaY)
        this.drawOptimized()
    }

}
