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
    header: CanvasRenderingContext2D | null = null;
    sidebar: CanvasRenderingContext2D | null = null;
    ctx: CanvasRenderingContext2D | null = null;

    data: Cell[][]
    headers: Cell[] = []
    sidebarcells: Cell[] = []
    wrapper: HTMLElement;

    cellheight: number = 30
    cellwidth: number = 100
    mincellwidth: number = 60
    csv: string;

    scrollX: number = 0
    scrollY: number = 0

    constructor(parentElement: HTMLElement, csv: string) {
        this.data = []
        this.wrapper = parentElement
        this.csv = csv.trim()
    }

    init() {
        this.createData()
        this.createMarkup()
        this.drawHeader()
        this.drawSidebar()
        this.drawGrid()
        // this.extendData(5,"X")
    }

    createMarkup() {
        this.wrapper.style.boxSizing = "border-box"
        let header = document.createElement("canvas")
        header.width = this.wrapper.offsetWidth
        header.height = this.cellheight
        this.wrapper.appendChild(header)

        let sidebar = document.createElement("canvas")
        sidebar.width = this.mincellwidth
        sidebar.height = this.wrapper.offsetHeight - this.cellheight

        let canvas = document.createElement("canvas")
        canvas.width = this.wrapper.offsetWidth - this.mincellwidth
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
            context.fillText(cell.data, center ? (cell.width / 2 + cell.left - 4) : cell.left + 5, (cell.height / 2 + cell.top) + 5)
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
                    left: this.mincellwidth + j * this.cellwidth,
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
                this.headers.push(cell)
            })
        }
    }

    drawSidebar() {
        let arr = [...Array(50)].map((_, i) => i)
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
                    strokeStyle: "#959595",
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial"
                }
                this.drawCell(cell, this.sidebar, true)
                this.sidebarcells.push(cell)
            })
        }
    }
    // extendData(count: number, axis: "X" | "Y") {
    //     if (axis == "X") {
    //         this.data.forEach((row, i) => {
    //             let left = row[row.length - 1].left + row[row.length - 1].width
    //             let top = row[row.length - 1].top
    //             let height = this.cellheight
    //             let width = this.cellwidth
    //             for (let j = row.length; j < row.length + count; j++) {
    //                 let cell: Cell = {
    //                     data: "",
    //                     top: top,
    //                     left: left,
    //                     height: height,
    //                     width: width,
    //                     row: i,
    //                     col: j,
    //                     isbold: false,
    //                     strokeStyle: "#959595",
    //                     lineWidth: 1,
    //                     fontSize: 16,
    //                     font: "Arial"
    //                 }
    //                 row.push(cell)
    //                 this.drawCell(cell)
    //             }
    //         })
    //     }
    // }
}