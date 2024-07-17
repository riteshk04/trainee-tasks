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
}

const primaryColor = "#03723c"

class Excel {
    header: CanvasRenderingContext2D | null = null;
    sidebar: CanvasRenderingContext2D | null = null;
    ctx: CanvasRenderingContext2D | null = null;

    data: Cell[][]
    headers: Cell[] = []
    sidebarcells: Cell[] = []
    activeInputCell!: Cell
    wrapper: HTMLElement;
    edgeCell!: Cell
    inputBox!: HTMLInputElement;

    tableWidth: number = 0
    tableHeight: number = 0
    cellheight: number = 30
    cellwidth: number = 100
    mincellwidth: number = 60
    startx: number = 0
    csv: string;

    scrollX: number = 0
    scrollY: number = 0
    isDragging: boolean = false
    inputActive: boolean = false
    edgeDetected: boolean = false
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
        this.drawGrid()
        this.resizer()
        this.extendData(5, "X")
        this.attachEventHandlers()
    }

    // Event handlers

    attachEventHandlers() {
        this.canvasElement.addEventListener("mouseup", this.canvasMouseupHandler.bind(this))
        // this.canvasElement.addEventListener("mousedown", this.keyupHandler.bind(this))

        this.headerElement.addEventListener("mousemove", this.headerMouseMoveObserver.bind(this))
        this.headerElement.addEventListener("mouseup", this.headerMouseUpObserver.bind(this))
        this.headerElement.addEventListener("mousedown", this.headerMouseDownObserver.bind(this))
        window.addEventListener("keydown", this.windowKeypressHandler.bind(this))
    }

    canvasMouseupHandler(event: MouseEvent) {
        if (this.inputActive) {
            this.inputBox.style.display = "none"
        }
        if (!this.isDragging) {
            const { cell } = this.getCell(event)
            if (!this.checkSameCell(cell, this.activeInputCell)) {
                if (this.inputActive) {
                    this.inputBox.style.display = "none"
                    this.inputActive = false
                }
                this.setActiveCell(cell)
            } else {
                this.createInputBox(cell)
            }
        }
    }

    windowKeypressHandler(event: KeyboardEvent) {
        switch (event.key) {
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
    }

    headerMouseMoveObserver(event: MouseEvent) {
        const gap = 5
        const { x, y } = this.getCoordinates(event, this.headerElement)
        for (let i = 1; i < this.headers.length; i++) {
            const edge = this.headers[i].left;
            if (Math.max(edge - gap, 0) < x && x < edge + gap) {
                this.edgeDetected = true
                this.headerElement.style.cursor = "col-resize"
                this.edgeCell = this.headers[i - 1]
                break
            }
            if (!this.isDragging)
                this.headerElement.style.cursor = "default"
            this.edgeDetected = false
        }
    }
    headerMouseUpObserver(event: MouseEvent) {
        if (this.isDragging) {
            this.isDragging = false
            const { x } = this.getCoordinates(event)
            let draggedDistance = x - this.startx
            this.headerShifter(this.edgeCell, draggedDistance)
            this.drawHeader()
            console.log(this.headers)
        }
    }
    headerMouseDownObserver(event: MouseEvent) {
        if (this.edgeDetected) {
            this.isDragging = true
            const { x } = this.getCoordinates(event)
            this.startx = x
        }
    }

    // removeHighLight(cell: Cell) {
    //     let context = this.ctx
    //     if (!context) return;

    //     let { row, col } = cell

    //     neighbours.forEach(cell => {
    //         context.strokeStyle = cell.strokeStyle
    //         context.lineWidth = cell.lineWidth
    //         context.beginPath()
    //         context.strokeRect(this.scrollX + cell.left, this.scrollY + cell.top, cell.width, cell.height)
    //         context.stroke()
    //     })
    // }

    // Draw methods

    drawGrid() {
        this.ctx?.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
        this.data.forEach(row => row.forEach(cell => {
            this.drawCell(cell, this.ctx, false, false)
        }))
        if (this.data.length && this.data[0].length) {
            this.activeInputCell = this.data[0][0]
            this.highLightCell(this.activeInputCell)
        }
    }

    createHeader() {
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let arr = chars.split("")

        if (this.header) {
            arr.forEach((c, j) => {
                let cell: Cell = {
                    data: c,
                    top: 0,
                    left: this.mincellwidth + j * this.cellwidth,
                    height: this.cellheight,
                    width: this.cellwidth,
                    row: 0,
                    col: j,
                    isbold: false,
                    strokeStyle: "#dadada96",
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial"
                }
                this.headers.push(cell)
            })
        }
    }

    headerShifter(cell: Cell, width: number) {
        let shifted = false
        this.headers.forEach(c => {
            if (!shifted) {
                if (this.checkSameCell(c, cell)) {
                    c.width = Math.max(this.mincellwidth, c.width + width)
                    shifted = true
                }
            } else {
                c.width = Math.max(this.mincellwidth, c.width + width)
            }
        })
    }

    drawHeader() {
        this.headers.forEach(cell => {
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
                    strokeStyle: "#dadada96",
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial"
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

        let header = document.createElement("canvas")
        header.width = this.wrapper.offsetWidth
        header.height = this.cellheight
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
                    left: j * this.cellwidth + 1,
                    height: this.cellheight,
                    width: this.cellwidth,
                    row: i,
                    col: j,
                    isbold: false,
                    strokeStyle: "#dadada96",
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial"
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
                        strokeStyle: "#dadada96",
                        lineWidth: 1,
                        fontSize: 16,
                        font: "Arial"
                    }
                    row.push(cell)
                    this.drawCell(cell)
                }
            })
        } else {
            // this.data.forEach((row, i) => {
            //     let left = row[row.length - 1].left + row[row.length - 1].width
            //     let top = row[row.length - 1].top
            //     let height = this.cellheight
            //     let width = this.cellwidth
            //     let prevColumns = row.length
            //     for (let j = prevColumns; j < prevColumns + count; j++) {
            //         let cell: Cell = {
            //             data: "",
            //             top: top,
            //             left: left,
            //             height: height,
            //             width: width,
            //             row: i,
            //             col: j,
            //             isbold: false,
            //             strokeStyle: "#959595",
            //             lineWidth: 1,
            //             fontSize: 16,
            //             font: "Arial"
            //         }
            //         row.push(cell)
            //         this.drawCell(cell)
            //     }
            // })
        }
    }

    resizer() {
        const resizeEventHandler = function (this: any) {
            this.canvasElement.width = this.wrapper.offsetWidth - this.mincellwidth
            this.canvasElement.height = this.wrapper.offsetHeight - this.cellheight
            this.headerElement.width = this.wrapper.offsetWidth
            this.sidebarElement.height = this.wrapper.offsetHeight - this.cellheight
            this.drawGrid()
            this.drawHeader()
            this.drawSidebar()
        }
        window.addEventListener("resize", resizeEventHandler.bind(this))
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
    drawCell(cell: Cell, ctx?: CanvasRenderingContext2D | null, center?: boolean, clear: boolean = true) {
        let context = null
        context = ctx ? ctx : this.ctx

        if (context) {
            context.strokeStyle = cell.strokeStyle;
            context.lineWidth = cell.lineWidth;
            context.font = `${cell.fontSize}px ${cell.font}`;
            if (clear)
                context.clearRect(this.scrollX + cell.left - 2, this.scrollY + cell.top - 2, cell.width + 4, cell.height + 4)
            context.clearRect(this.scrollX + cell.left, this.scrollY + cell.top, cell.width, cell.height)
            context.save()
            context.rect(this.scrollX + cell.left, this.scrollY + cell.top, cell.width, cell.height)
            context.clip()
            context.fillText(cell.data, center ? (cell.width / 2 + cell.left - 4) : cell.left + 5, (cell.height / 2 + cell.top) + 5)
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
        context.lineWidth = 4
        context.beginPath()
        context.strokeRect(this.scrollX + cell.left, this.scrollY + cell.top, cell.width, cell.height)
        context.stroke()
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
        this.inputBox.style.border = `2px solid ${primaryColor}`
        this.inputBox.value = `${data}`
        if (!this.inputActive) {
            this.inputBox.style.display = `block`
            this.inputBox.focus()
            this.inputActive = true
        }
    }

    // scroller(event: WheelEvent, element: HTMLCanvasElement) {
    //     let { deltaX, deltaY } = event
    //     console.log("🚀 ~ Excel ~ scroller ~ deltaX:", event)
    //     this.scrollX = Math.max(0, this.scrollX + deltaX)
    //     this.scrollY = Math.max(0, this.scrollY + deltaY)
    //     console.log("🚀 ~ Excel ~ scroller ~ this.scrollY :", this.scrollX)
    //     // this.ctx?.translate(this.scrollX, this.scrollY)
    //     // this.drawGrid()
    // }

}
