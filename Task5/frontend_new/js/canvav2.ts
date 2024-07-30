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
}
type SelectionModeCanva = {
    active: boolean
    selectedArea: Cell[],
    startSelectionCell: Cell | null,
    decoration: boolean
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

class ExcelV2 {
    primaryColor = "#03723c"
    secondaryColor = "#959595"
    strokeColor = "#dadada"
    csvString: string;
    offset = 0.5
    wrapper: HTMLElement;
    inputBox: ExcelInputBox = { element: null, left: 0, top: 0 }
    canvas: Canvas = { ctx: null, data: [], element: null, startCell: null, endCell: null };
    header: HeaderCanva = { ctx: null, data: [], element: null, isDragging: false, edgeDetected: false, endCell: null, startCell: null, startx: 0 };
    sidebar: Canvas = { ctx: null, data: [], element: null, endCell: null, startCell: null };
    mouse: Pointer = { x: 0, y: 0, startx: 0, starty: 0, up: false, horizontal: false, scrollX: 0, scrollY: 0, animatex: 0, animatey: 0, pscrollX: 100, pscrollY: 100 }

    selectionMode: SelectionModeCanva = {
        active: false,
        selectedArea: [],
        startSelectionCell: null,
        decoration: false
    }

    cellheight: number = 30
    cellwidth: number = 100
    mincellwidth: number = 60
    dx = 10
    dy = 10
    scrolling = false
    smoothingFactor = 0.1
    extracells = 30
    edgeCell!: Cell
    prevWidth: number = 0
    busy: any


    constructor(parentElement: HTMLElement, csv: string) {
        this.wrapper = parentElement
        this.csvString = (csv || "").trim()
        this.busy = null;
        this.init()
    }

    init() {
        this.createData()
        this.createMarkup()
        this.extendHeader(100)
        this.extendSidebar(100)
        this.attachEvents()
        this.smoothUpdate()
        this.drawHeader()
        this.drawSidebar()
        this.drawData()
        this.resizer()
    }

    // rendering
    createMarkup() {
        this.wrapper.style.boxSizing = "border-box"
        this.wrapper.style.position = "relative"
        this.wrapper.style.fontSize = "0"

        let inputBox = document.createElement("input")
        inputBox.style.display = "none"
        inputBox.style.position = "absolute"
        inputBox.style.boxSizing = "border-box"
        inputBox.style.outline = "none"
        // inputBox.onkeydown = e => e.stopPropagation()

        let emptyBox = document.createElement("div")
        emptyBox.style.width = `${this.mincellwidth}px`
        emptyBox.style.height = `${this.cellheight}px`
        emptyBox.style.boxSizing = "border-box"
        emptyBox.style.display = "inline-block"
        emptyBox.style.background = this.secondaryColor + "33"
        emptyBox.style.borderRight = `0.5px solid ${this.secondaryColor + "aa"}`
        emptyBox.style.borderBottom = `0.5px solid ${this.secondaryColor + "aa"}`


        let headerElement = document.createElement("canvas")
        headerElement.width = this.wrapper.offsetWidth - this.mincellwidth
        headerElement.height = this.cellheight
        headerElement.style.boxSizing = "border-box"

        this.wrapper.appendChild(emptyBox)
        this.wrapper.appendChild(headerElement)

        let sidebarElement = document.createElement("canvas")
        sidebarElement.width = this.mincellwidth
        sidebarElement.height = this.wrapper.offsetHeight - this.cellheight

        let inputBoxWrapper = document.createElement("div")
        inputBoxWrapper.style.position = "relative"
        inputBoxWrapper.style.display = "inline-block"

        let canvasElement = document.createElement("canvas")
        canvasElement.width = this.wrapper.offsetWidth - this.mincellwidth
        canvasElement.height = this.wrapper.offsetHeight - this.cellheight
        canvasElement.style.cursor = "cell"

        inputBoxWrapper.appendChild(canvasElement)
        inputBoxWrapper.appendChild(inputBox)

        this.wrapper.appendChild(sidebarElement)
        this.wrapper.appendChild(inputBoxWrapper)

        this.canvas.ctx = canvasElement.getContext("2d")!
        this.header.ctx = headerElement.getContext("2d")!
        this.sidebar.ctx = sidebarElement.getContext("2d")!

        // canvas.addEventListener("wheel", (e) => this.scroller(e, canvas))
        // sidebar.addEventListener("wheel", (e) => this.scroller(e, sidebar))
        // header.addEventListener("wheel", (e) => this.scroller(e, header))

        this.canvas.element = canvasElement
        this.sidebar.element = sidebarElement
        this.header.element = headerElement
        this.inputBox.element = inputBox

        this.canvas.element.width = this.wrapper.offsetWidth - this.mincellwidth
        this.canvas.element.height = this.wrapper.offsetHeight - this.cellheight
        this.header.element.width = this.wrapper.offsetWidth - this.mincellwidth
        this.sidebar.element.height = this.wrapper.offsetHeight - this.cellheight
    }
    render_internal() {
        this.smoothUpdate()
        this.drawHeader()
        this.drawSidebar()
        this.drawData()
        this.setSelection()
    }
    render() {
        // this.render_internal();
        // return;
        if (this.busy)
            return;

        this.busy = requestAnimationFrame(()=>{
            this.busy = null;
            this.render_internal()
        })

    }
    resizer() {
        const resizeEventHandler = function (this: any) {
            this.canvas.element.width = this.wrapper.offsetWidth - this.mincellwidth
            this.canvas.element.height = this.wrapper.offsetHeight - this.cellheight
            this.header.element.width = this.wrapper.offsetWidth - this.mincellwidth
            this.sidebar.element.height = this.wrapper.offsetHeight - this.cellheight
            this.drawData()
            this.drawHeader()
            this.drawSidebar()
        }
        window.addEventListener("resize", resizeEventHandler.bind(this))
    }

    // data
    async createData() {
        this.canvas.data = await new Promise(res => {
            let data: Cell[][] = []
            let rows = this.csvString.split("\n")

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
                        strokeStyle: this.strokeColor,
                        lineWidth: 1,
                        fontSize: 16,
                        font: "Arial",
                        align: "LEFT"
                    }
                    dataRow.push(cell)
                })
                data.push(dataRow)
            })
            res(data)
        })
        if (this.canvas.data.length < 100) {
            this.extendData(100 - this.canvas.data.length, "Y")
        }
        if (this.canvas.data[0].length < 100) {
            this.extendData(100 - this.canvas.data[0].length, "X")
        }
        this.render();
    }
    clearData() {
        let ctx = this.canvas.ctx
        if (!ctx || !this.canvas.element) return;
        ctx.clearRect(0, 0, this.canvas.element.offsetWidth, this.canvas.element.offsetHeight)
    }
    clearDataCell(cell: Cell) {
        let ctx = this.canvas.ctx
        if (!ctx) return
        ctx.restore()
        for (let i = Math.max(0, cell.row - 1); i <= Math.min(this.canvas.data.length, cell.row + 1); i++) {
            for (let j = Math.max(0, cell.col - 1); j <= Math.min(this.canvas.data[0].length, cell.col + 1); j++) {
                const cell = this.canvas.data[i][j];
                ctx.clearRect(cell.left, cell.top, cell.width, cell.height)
                this.drawDataCell(cell)
                ctx.save()
            }
        }
    }
    drawDataCell(cell: Cell, active?: boolean, selected?: boolean) {
        let ctx = this.canvas.ctx
        if (!ctx) return
        ctx.restore()
        ctx.fillStyle = selected ? this.primaryColor + "22" : "#ffffff"
        ctx.font = `${cell.fontSize}px ${cell.font}`
        ctx.save()
        ctx.clearRect(cell.left - this.mouse.animatex - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width + (this.offset * 2), cell.height + (this.offset * 2))
        ctx.fillRect(cell.left - this.mouse.animatex, cell.top - this.mouse.animatey, cell.width, cell.height)
        ctx.save()
        ctx.beginPath()
        ctx.rect(cell.left - this.mouse.animatex - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width, cell.height)
        ctx.clip()
        ctx.fillStyle = "#000000"
        switch (cell.align) {
            case "CENTER":
                ctx.fillText(cell.data, (cell.width / 2 + (cell.left - this.mouse.animatex) - 4), (cell.height / 2 + (cell.top - this.mouse.animatey)) + 5)
                break;
            case "LEFT":
                ctx.fillText(cell.data, (cell.left - this.mouse.animatex) + 5, (cell.height / 2 + (cell.top - this.mouse.animatey)) + 5)
                break;
        }
        ctx.restore()
        ctx.strokeStyle = active ? this.primaryColor + "AA" : "#959595aa"
        ctx.stroke()

        if (!active) return;
        ctx.beginPath()
        ctx.rect(cell.left - 2, cell.top - 2, cell.width + 4, cell.height + 4)
        ctx.strokeStyle = this.primaryColor
        ctx.lineWidth = 4
        ctx.stroke()
    }
    drawData() {
        if (!this.canvas.data.length) {
            return
        }
        let initialCol = this.binarySearch(this.canvas.data[0], this.mouse.scrollX)
        let initialRow = this.binarySearch(this.canvas.data.map(d => d[0]), this.mouse.scrollY, true)
        let finalRow = initialRow
        let finalCol = 0

        if (!this.canvas.element) return;
        for (let j = initialRow; j < this.canvas.data.length; j++) {
            finalCol = initialCol
            finalRow++
            for (let j = initialCol; j < this.canvas.data[0].length; j++) {
                finalCol++
                if (this.canvas.data[0][j].left > this.canvas.element.offsetWidth + this.mouse.scrollX)
                    break
            }
            if (this.canvas.data[j][0].top > this.canvas.element.offsetHeight + this.mouse.scrollY)
                break
        }

        if (Math.abs(finalRow - this.canvas.data.length) < 10) {
            this.extendData(20, "Y")
        }
        if (Math.abs(initialCol - this.canvas.data[0].length) < 10) {
            this.extendData(20, "X")
        }
        this.clearData()
        for (let i = Math.max(initialRow - this.extracells, 0); i < Math.min(finalRow + this.extracells, this.canvas.data.length); i++) {
            for (let j = Math.max(initialCol - this.extracells, 0); j < Math.min(finalCol + this.extracells, this.canvas.data[0].length); j++) {
                this.drawDataCell(this.canvas.data[i][j])
            }
        };
        this.header.startCell = this.header.data[0][initialCol]
        this.header.endCell = this.header.data[0][finalCol]
        this.canvas.startCell = this.canvas.data[initialRow][initialCol]
        this.canvas.endCell = this.canvas.data[finalRow][finalCol]

        this.inputBox.element!.style.top = `${this.inputBox.top - this.mouse.animatey - 0.5}px`
        this.inputBox.element!.style.left = `${this.inputBox.left - this.mouse.animatex - 0.5}px`
    }
    extendData(count: number, axis: "X" | "Y") {
        if (!this.canvas.data.length) {
            this.canvas.data.push([
                {
                    data: "",
                    top: 0,
                    left: 0,
                    height: this.cellheight,
                    width: this.cellwidth,
                    row: 0,
                    col: 0,
                    isbold: false,
                    strokeStyle: this.strokeColor,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "CENTER"
                }
            ])
        }
        if (axis == "X") {
            this.canvas.data.forEach((row, i) => {
                let width = this.cellwidth
                let prevColumns = row.length
                for (let j = prevColumns; j < prevColumns + count; j++) {
                    let left = row[row.length - 1].left + row[row.length - 1].width
                    let top = row[row.length - 1].top
                    let height = row[row.length - 1].height
                    let cell: Cell = {
                        data: "",
                        top: top,
                        left: left,
                        height: height,
                        width: width,
                        row: i,
                        col: j,
                        isbold: false,
                        strokeStyle: this.strokeColor,
                        lineWidth: 1,
                        fontSize: 16,
                        font: "Arial",
                        align: "LEFT"
                    }
                    row.push(cell)
                }
            })
        } else {
            let prevRows = this.canvas.data.length
            for (let i = prevRows; i < prevRows + count; i++) {

                const prev = this.canvas.data[i - 1];
                let height = this.cellheight
                let row = []

                for (let j = 0; j < prev.length; j++) {
                    let left = prev[j].left
                    let top = prev[j].top + prev[j].height
                    let width = prev[j].width
                    let cell: Cell = {
                        data: "",
                        top: top,
                        left: left,
                        height: height,
                        width: width,
                        row: i,
                        col: j,
                        isbold: false,
                        strokeStyle: this.strokeColor,
                        lineWidth: 1,
                        fontSize: 16,
                        font: "Arial",
                        align: "LEFT"
                    }
                    row.push(cell)
                }
                this.canvas.data.push(row)
            }
        }
    }
    canvasMouseMoveHandler(event: MouseEvent) {
        if (this.selectionMode.active) {
            this.inputBox.element!.style.display = "none"
            const { cell } = this.getCell(event)
            const selectedArea = this.getCellsArea(this.selectionMode.startSelectionCell!, cell)
            this.selectionMode.selectedArea = selectedArea
            this.render()
        }
    }
    canvasMouseDownHandler(event: MouseEvent) {
        const { cell } = this.getCell(event)
        this.selectionMode.startSelectionCell = cell
        this.selectionMode.active = true
    }
    canvasMouseupHandler(event: MouseEvent) {
        const startSelectionCell = this.selectionMode.startSelectionCell
        this.selectionMode.active = false

        if (!startSelectionCell) return
        const { cell } = this.getCell(event)
        let newSelectedArea = this.getCellsArea(startSelectionCell, cell)

        if (!newSelectedArea.length) return

        if (newSelectedArea.length > 1) {
            // this.createStatus()
        } else {
            if (!this.selectionMode.selectedArea.length) {
                this.selectionMode.selectedArea = newSelectedArea
                return
            }
            let cell = newSelectedArea[0]

            if (this.checkSameCell(this.selectionMode.selectedArea[0], cell)) {
                this.createInputBox()
            } else {
                this.inputBox.element!.style.display = "none"
                this.setActiveCell()
            }
        }
        this.selectionMode.selectedArea = newSelectedArea
    }

    // events
    attachEvents() {
        this.header.element!.addEventListener("wheel", (e) => this.scroller(e, "HEADER"))
        this.sidebar.element!.addEventListener("wheel", (e) => this.scroller(e, "SIDEBAR"))
        this.canvas.element!.addEventListener("wheel", (e) => this.scroller(e))

        this.canvas.element!.addEventListener("mousemove", this.canvasMouseMoveHandler.bind(this))
        this.header.element!.addEventListener("mousemove", this.headerMouseMoveObserver.bind(this))

        this.canvas.element!.addEventListener("mousedown", this.canvasMouseDownHandler.bind(this))
        this.header.element!.addEventListener("mousedown", this.headerMouseDownObserver.bind(this))

        this.canvas.element!.addEventListener("mouseup", this.canvasMouseupHandler.bind(this))
        this.header.element!.addEventListener("mouseup", this.headerMouseUpObserver.bind(this))
    }

    // header methods
    clearHeader() {
        let ctx = this.header.ctx
        if (!ctx || !this.header.element) return;
        ctx.clearRect(0, 0, this.header.element.offsetWidth, this.header.element.offsetHeight)
    }
    clearHeaderCell(cell: Cell) {
        let ctx = this.header.ctx
        if (!ctx) return
        let prev = this.header.data[0][Math.max(0, cell.col - 1)]
        let next = this.header.data[0][Math.min(this.header.data[0].length, cell.col + 1)]
        ctx.restore()
        ctx.clearRect(prev.left, prev.top, prev.width, prev.height)
        ctx.clearRect(next.left, next.top, next.width, next.height)
        ctx.clearRect(cell.left, cell.top, cell.width, cell.height)
        ctx.save()
        this.drawHeaderCell(prev)
        this.drawHeaderCell(next)
    }
    drawHeaderCell(cell: Cell, active?: boolean) {
        let ctx = this.header.ctx
        if (!ctx) return
        ctx.restore()
        ctx.fillStyle = active ? this.primaryColor + "22" : this.secondaryColor + "33"
        ctx.font = `${cell.fontSize}px ${cell.font}`
        ctx.save()
        ctx.clearRect(cell.left - this.mouse.animatex - this.offset, cell.top - this.offset, cell.width + (this.offset * 2), cell.height + (this.offset * 2))
        ctx.fillRect(cell.left - this.mouse.animatex, cell.top, cell.width, cell.height)
        ctx.save()
        ctx.beginPath()
        ctx.rect(cell.left - this.mouse.animatex - this.offset, cell.top - this.offset, cell.width, cell.height)
        ctx.clip()
        ctx.fillStyle = active ? this.primaryColor : "#000000"
        switch (cell.align) {
            case "CENTER":
                ctx.fillText(cell.data, (cell.width / 2 + (cell.left - this.mouse.animatex) - 4), (cell.height / 2 + (cell.top)) + 5)
                break;
            case "LEFT":
                ctx.fillText(cell.data, (cell.left - this.mouse.animatex) + 5, (cell.height / 2 + (cell.top)) + 5)
                break;
        }
        ctx.restore()
        ctx.strokeStyle = active ? this.primaryColor + "AA" : "#959595aa"
        ctx.stroke()

        if (!active) return;
        ctx.beginPath()
        ctx.moveTo(cell.left - this.mouse.animatex - 4, cell.top + cell.height - 2)
        ctx.lineTo(cell.left - this.mouse.animatex + cell.width + 3, cell.top + cell.height - 2)
        ctx.strokeStyle = this.primaryColor
        ctx.lineWidth = 4
        ctx.stroke()
    }
    drawHeader() {
        let initialCol = this.binarySearch(this.header.data[0], this.mouse.scrollX)
        let finalCol = initialCol
        if (!this.header.element) return;

        for (let j = initialCol; j < this.header.data[0].length; j++) {
            finalCol++
            if (this.header.data[0][j].left > this.header.element.offsetWidth + this.mouse.scrollX)
                break
        }
        if (finalCol > this.header.data[0].length - 1) {
            this.extendHeader(10)
        }

        this.clearHeader()
        this.header.data.forEach(row => {
            for (let i = Math.max(initialCol - this.extracells, 0); i < Math.min(finalCol + this.extracells, this.header.data[0].length); i++) {
                this.drawHeaderCell(row[i])
            }
        });
    }
    extendHeader(count: number) {
        if (!this.header.data.length) {
            this.header.data.push([
                {
                    data: this.toLetters(1),
                    top: 0,
                    left: 0,
                    height: this.cellheight,
                    width: this.cellwidth,
                    row: 0,
                    col: 0,
                    isbold: false,
                    strokeStyle: this.strokeColor,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "CENTER"
                }
            ])
        }

        this.header.data.forEach((row, i) => {
            let prevColumns = row.length
            for (let j = prevColumns; j < prevColumns + count; j++) {
                let left = row[j - 1].left + row[j - 1].width
                let top = row[j - 1].top
                let height = row[j - 1].height
                let width = this.cellwidth
                let cell: Cell = {
                    data: this.toLetters(j + 1),
                    top: top,
                    left: left,
                    height: height,
                    width: width,
                    row: i,
                    col: j,
                    isbold: false,
                    strokeStyle: this.strokeColor,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "CENTER"
                }
                row.push(cell)
            }
        })
    }
    headerMouseMoveObserver(event: MouseEvent) {
        const gap = 2
        const headerElement = this.header.element!
        const headerStartCell = this.header.startCell!
        const headerEndCell = this.header.endCell!
        const { x } = this.getCoordinates(event, headerElement)

        for (let i = Math.max(1, headerStartCell.col - 1); i <= Math.min(this.header.data[0].length, headerEndCell!.col); i++) {
            const edge = this.header.data[0][i].left;

            if (Math.max(edge - gap, 0) < x && x < edge + gap) {
                this.header.edgeDetected = true
                headerElement.style.cursor = "col-resize"
                if (!this.header.isDragging) {
                    this.edgeCell = this.header.data[0][i - 1]
                    this.prevWidth = this.edgeCell.width
                }
                break
            }
            if (!this.header.isDragging)
                headerElement.style.cursor = "default"
            this.header.edgeDetected = false
        }

        if (this.header.isDragging) {
            let diff = x - this.header.startx
            let newWidth = this.prevWidth + diff
            this.widthShifter(this.edgeCell, newWidth, this.header.data)
            this.widthShifter(this.edgeCell, newWidth, this.canvas.data)
        }
    }
    headerMouseUpObserver(event: MouseEvent) {
        if (this.header.isDragging) {
            this.header.isDragging = false
        }
    }
    headerMouseDownObserver(event: MouseEvent) {
        if (this.header.edgeDetected) {
            this.inputBox.element!.style.display = "none"
            this.header.isDragging = true
            const { x } = this.getCoordinates(event)
            this.header.startx = x
            this.prevWidth = this.edgeCell.width
        }
    }

    // sidebar methods
    clearSidebar() {
        let ctx = this.sidebar.ctx
        if (!ctx || !this.sidebar.element) return;
        ctx.clearRect(0, 0, this.sidebar.element.offsetWidth, this.sidebar.element.offsetHeight)
    }
    clearSidebarCell(cell: Cell) {
        let ctx = this.sidebar.ctx
        if (!ctx) return
        let prev = this.sidebar.data[0][Math.max(0, cell.col - 1)]
        let next = this.sidebar.data[0][Math.min(this.sidebar.data[0].length, cell.col + 1)]
        ctx.restore()
        ctx.clearRect(prev.left, prev.top, prev.width, prev.height)
        ctx.clearRect(next.left, next.top, next.width, next.height)
        ctx.clearRect(cell.left, cell.top, cell.width, cell.height)
        ctx.save()
        this.drawHeaderCell(prev)
        this.drawHeaderCell(next)
    }
    drawSidebarCell(cell: Cell, active?: boolean) {
        let ctx = this.sidebar.ctx
        if (!ctx) return
        ctx.restore()
        ctx.fillStyle = active ? this.primaryColor + "22" : this.secondaryColor + "33"
        ctx.font = `${cell.fontSize}px ${cell.font}`
        ctx.save()
        ctx.clearRect(cell.left - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width + (this.offset * 2), cell.height + (this.offset * 2))
        ctx.fillRect(cell.left, cell.top - this.mouse.animatey, cell.width, cell.height)
        ctx.save()
        ctx.beginPath()
        ctx.rect(cell.left - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width, cell.height)
        ctx.clip()
        ctx.fillStyle = active ? this.primaryColor : "#000000"
        switch (cell.align) {
            case "CENTER":
                ctx.fillText(cell.data, (cell.width / 2 + (cell.left) - 4), (cell.height / 2 + (cell.top - this.mouse.animatey)) + 5)
                break;
            case "LEFT":
                ctx.fillText(cell.data, (cell.left) + 5, (cell.height / 2 + (cell.top - this.mouse.animatey)) + 5)
                break;
        }
        ctx.restore()
        ctx.strokeStyle = active ? this.primaryColor + "AA" : "#959595aa"
        ctx.stroke()

        if (!active) return;
        ctx.beginPath()
        ctx.moveTo(cell.left + cell.width - 2, cell.top - this.mouse.animatey - 4)
        ctx.lineTo(cell.left + cell.width - 2, cell.top - this.mouse.animatey + cell.height + 3)
        ctx.strokeStyle = this.primaryColor
        ctx.lineWidth = 4
        ctx.stroke()
    }
    drawSidebar() {
        let initialRow = this.binarySearch(this.sidebar.data.map(c => c[0]), this.mouse.scrollY, true)
        let finalRow = initialRow
        if (!this.sidebar.element) return;

        for (let j = initialRow; j < this.sidebar.data.length; j++) {
            finalRow++
            if (this.sidebar.data[j][0].top > this.sidebar.element.offsetHeight + this.mouse.scrollY)
                break
        }
        if (finalRow > this.sidebar.data.length - 1) {
            this.extendSidebar(10)
        }

        this.clearSidebar()
        for (let i = Math.max(initialRow - this.extracells, 0); i < Math.min(finalRow + this.extracells, this.sidebar.data.length); i++) {
            this.drawSidebarCell(this.sidebar.data[i][0])
        }

    }
    extendSidebar(count: number) {
        if (!this.sidebar.data.length) {
            this.sidebar.data.push([
                {
                    data: String(1),
                    top: 0,
                    left: 0,
                    height: this.cellheight,
                    width: this.mincellwidth,
                    row: 0,
                    col: 0,
                    isbold: false,
                    strokeStyle: this.strokeColor,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "CENTER"
                }
            ])
        }
        let prevRows = this.sidebar.data.length
        for (let j = prevRows; j < prevRows + count; j++) {
            let left = this.sidebar.data[j - 1][0].left
            let top = this.sidebar.data[j - 1][0].top + this.sidebar.data[j - 1][0].height
            let height = this.sidebar.data[j - 1][0].height
            let width = this.mincellwidth
            let cell: Cell = {
                data: String(j + 1),
                top: top,
                left: left,
                height: height,
                width: width,
                row: j,
                col: 0,
                isbold: false,
                strokeStyle: this.strokeColor,
                lineWidth: 1,
                fontSize: 16,
                font: "Arial",
                align: "CENTER"
            }
            this.sidebar.data.push([cell])
        }

    }

    // scroll
    scroller(event: WheelEvent, element?: "HEADER" | "SIDEBAR") {
        let { deltaY } = event
        switch (element) {
            case "HEADER":
                this.mouse.scrollX = Math.max(0, this.mouse.scrollX + deltaY)
                break;
            case "SIDEBAR":
                this.mouse.scrollY = Math.max(0, this.mouse.scrollY + (deltaY < 0 ? -90 : 90))
                break;
            default:
                if (this.mouse.horizontal) {
                    this.mouse.scrollX = Math.max(0, this.mouse.scrollX + deltaY)
                } else {
                    this.mouse.scrollY = Math.max(0, this.mouse.scrollY + (deltaY < 0 ? -90 : 90))
                }
                break;
        }
    }
    smoothUpdate() {
        this.mouse.animatex += (this.mouse.scrollX - this.mouse.animatex) * this.smoothingFactor
        this.mouse.animatey += (this.mouse.scrollY - this.mouse.animatey) * this.smoothingFactor
    }

    // cell
    getCoordinates(event: MouseEvent, canvasElement?: HTMLCanvasElement) {
        if (!canvasElement) {
            canvasElement = this.canvas.element!
        }
        let rect = canvasElement.getBoundingClientRect()
        let x = Math.max(0, event.clientX - rect.left + this.mouse.scrollX)
        let y = Math.max(0, event.clientY - rect.top + this.mouse.scrollY)
        return { x, y }
    }
    getCell(event: MouseEvent, fullSearch: boolean = false): { cell: Cell, x: number, y: number } {
        const { x, y } = this.getCoordinates(event)

        for (let i = !fullSearch ? this.canvas.startCell!.row : 0; i < this.canvas.data.length; i++) {
            const row = this.canvas.data[i];
            for (let j = !fullSearch ? this.canvas.startCell!.col : 0; j < row.length; j++) {
                const cell = row[j];
                if (cell.left < x && x <= cell.left + cell.width && cell.top < y && y <= cell.top + cell.height) {
                    return { cell, x, y }
                }
            }
        }
        return { cell: this.canvas.data[0][0], x, y }
    }
    createInputBox() {
        if (!this.selectionMode.selectedArea.length) return;
        let inputBox = this.inputBox.element!

        const { top, left, width, height, font, fontSize, data, row, col } = this.selectionMode.selectedArea[0]

        this.inputBox.top = top - this.mouse.animatey
        this.inputBox.left = left - this.mouse.animatex

        inputBox.style.top = `${this.inputBox.top}px`
        inputBox.style.left = `${this.inputBox.left}px`
        inputBox.style.width = `${width - 1}px`
        inputBox.style.height = `${height - 1}px`
        inputBox.style.font = `${font}`
        inputBox.style.fontSize = `${fontSize}px`
        inputBox.style.padding = `4px`
        inputBox.style.border = `1px solid white`
        inputBox.value = `${data}`
        // if (!inputActive) {
        inputBox.style.display = `block`
        inputBox.focus()
        inputBox.onchange = (e: any) => {
            e.stopPropagation()
            this.canvas.data[row][col].data = e.target.value
        }
        // }
    }

    // selection
    setSelection() {
        this.highlightCells()
    }
    highlightCells() {
        let context = this.canvas.ctx
        const selectedArea = this.selectionMode.selectedArea
        if (!context || !selectedArea.length) return;

        const startCell = selectedArea[0]
        const endCell = selectedArea[selectedArea.length - 1]

        const leftX1 = Math.min(startCell.left, endCell.left, startCell.left + startCell.width, endCell.left + endCell.width)
        const leftX2 = Math.max(startCell.left, endCell.left, startCell.left + startCell.width, endCell.left + endCell.width)
        const topX1 = Math.min(startCell.top, endCell.top + endCell.height, startCell.top + startCell.height, endCell.top)
        const topX2 = Math.max(startCell.top, endCell.top + endCell.height, startCell.top + startCell.height, endCell.top)

        context.strokeStyle = this.primaryColor
        context.lineWidth = 4

        // if (ants)
        //     context.setLineDash([5, 3])
        context.translate(-this.mouse.animatex, -this.mouse.animatey)

        context.save()
        context.beginPath()
        context.moveTo(leftX1, topX1)
        context.lineTo(leftX2, topX1)
        context.lineTo(leftX2, topX2)
        context.lineTo(leftX1, topX2)
        context.lineTo(leftX1, topX1)

        if (this.selectionMode.selectedArea.length > 1) {
            context.fillStyle = this.primaryColor + "11"
            context.fill()
        }

        context.strokeStyle = "#fff"
        context.lineWidth = 2
        context.stroke()
        context.restore()

        this.drawDataCell(this.selectionMode.startSelectionCell!)
        context.save()

        context.translate(-this.mouse.animatex, -this.mouse.animatey)
        context.beginPath()
        context.strokeStyle = this.primaryColor
        context.lineWidth = 4
        context.moveTo(leftX1 - 4, topX1 - 2)
        context.lineTo(leftX2 + 1, topX1 - 2)
        context.lineTo(leftX2 + 1, topX2 + 1)
        context.lineTo(leftX1 - 2, topX2 + 1)
        context.lineTo(leftX1 - 2, topX1 - 2)
        context.save()
        context.stroke()
        context.restore()
        context.setTransform(1, 0, 0, 1, 0, 0);
        selectedArea.forEach(cell => {
            this.drawHeaderCell(this.header.data[0][cell.col], true)
            this.drawSidebarCell(this.sidebar.data[cell.row][0], true)
        })
    }

    // extras
    binarySearch(arr: Cell[], x: number, vertical?: boolean): number {
        let low = 0;
        let high = arr.length - 1;
        let mid = 0;
        while (high >= low) {
            mid = low + Math.floor((high - low) / 2);

            // If the element is present at the middle
            // itself
            if ((vertical ? arr[mid].top : arr[mid].left) == x)
                return mid;

            // If element is smaller than mid, then
            // it can only be present in left subarray
            if ((vertical ? arr[mid].top : arr[mid].left) > x)
                high = mid - 1;

            // Else the element can only be present
            // in right subarray
            else
                low = mid + 1;
        }
        return mid;
    }
    toLetters(num: number): string {
        var mod = num % 26,
            pow = num / 26 | 0,
            out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
        return pow ? this.toLetters(pow) + out : out;
    }
    checkSameCell(cell1: Cell, cell2: Cell) {
        const { top, left } = cell1
        return cell2.top === top && cell2.left == left
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
                newSelection.push(this.canvas.data[i][j])
            }
        }
        return newSelection
    }
    setActiveCell() {
        this.drawDataCell(this.selectionMode.selectedArea[0]!)
    }
    widthShifter(cell: Cell, newWidth: number, data: Cell[][]) {
        if (newWidth < 60) {
            newWidth = 60
        }

        data.forEach(row => {
            let widthChanged = false
            for (let i = this.canvas.startCell!.col; i < row.length; i++) {
                const c = row[i];
                if (!widthChanged) {
                    if (c.left === cell.left) {
                        c.width = newWidth
                        widthChanged = true
                    }
                } else {
                    c.left = row[i - 1].left + row[i - 1].width
                }
            }
        })
    }
}