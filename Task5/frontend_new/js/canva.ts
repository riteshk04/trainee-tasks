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

class Excel {
    data: Cell[][]
    wrapper: HTMLElement;
    header: CanvasRenderingContext2D | null = null;
    sidebar: CanvasRenderingContext2D | null = null;
    ctx: CanvasRenderingContext2D | null = null
    cellheight: number = 30
    cellwidth: number = 100
    csv: string;

    constructor(parentElement: HTMLElement, csv: string) {
        this.data = []
        this.wrapper = parentElement
        this.csv = csv.trim()
    }

    init() {
        this.createData()
        this.createMarkup()
        this.drawHeader()
        this.drawGrid()
    }

    createMarkup() {
        this.wrapper.style.boxSizing = "border-box"
        let header = document.createElement("canvas")
        header.width = this.wrapper.offsetWidth
        header.height = this.cellheight
        this.wrapper.appendChild(header)

        let sidebar = document.createElement("canvas")
        sidebar.width = this.cellwidth
        sidebar.height = this.wrapper.offsetHeight - this.cellheight

        let canvas = document.createElement("canvas")
        canvas.width = this.wrapper.offsetWidth - this.cellwidth
        canvas.height = this.wrapper.offsetHeight - this.cellheight

        this.wrapper.appendChild(sidebar)
        this.wrapper.appendChild(canvas)

        this.ctx = canvas.getContext("2d")
        this.header = header.getContext("2d")
        this.sidebar = sidebar.getContext("2d")
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
                    strokeStyle: "#959595",
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial"
                }
                dataRow.push(cell)
            })
            this.data.push(dataRow)
        })
    }

    drawGrid() {
        this.data.forEach(row => row.forEach(cell => {
            this.drawCell(cell)
        }))
    }

    drawCell(cell: Cell, ctx?: CanvasRenderingContext2D | null, center?: boolean) {
        let context = null
        context = ctx ? ctx : this.ctx

        if (context) {
            context.strokeStyle = cell.strokeStyle;
            context.lineWidth = cell.lineWidth;
            context.font = `${cell.fontSize}px ${cell.font}`;
            context.save()
            context.rect(cell.left, cell.top, cell.width, cell.height)
            context.clip()
            context.fillText(cell.data, center ? (cell.width / 2 + cell.left) : cell.left + 5, (cell.height / 2 + cell.top) + 5)
            context.restore()
            context.stroke()
        }
    }

    drawHeader() {
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let arr = chars.split("")

        if (this.header) {
            arr.forEach((c, j) => {
                let cell: Cell = {
                    data: c,
                    top: 0,
                    left: (j + 1) * this.cellwidth,
                    height: this.cellheight,
                    width: this.cellwidth,
                    row: 0,
                    col: j,
                    isbold: false,
                    strokeStyle: "#959595",
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial"
                }
                this.drawCell(cell, this.header, true)
            })
        }
    }
}