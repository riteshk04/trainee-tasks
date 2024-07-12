type Cell = {
    data: string,
    top: number
    left: number
    height: number
    width: number
    row: number
    col: number
    isbold: boolean
}

class Excel {
    wrapper: HTMLElement;
    canvas: HTMLCanvasElement;
    csv: string;
    ctx: CanvasRenderingContext2D | null;
    cellheight: number = 30
    cellwidth: number = 100
    data: Cell[][]

    constructor(parentElement: HTMLElement, csv: string) {
        this.wrapper = parentElement
        this.csv = csv.trim()
        this.canvas = document.createElement("canvas")
        this.ctx = this.canvas.getContext("2d")
        this.data = []
    }

    init() {
        this.wrapper.appendChild(this.canvas)
        this.createData()
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
                    isbold: false
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

    drawCell(cell: Cell) {
        if (this.ctx) {
            this.ctx.save()
            this.ctx.rect(cell.top, cell.left, cell.width, cell.height)
            this.ctx.clip()
            this.ctx.fillText(cell.data, cell.left + 5, cell.top + (cell.height / 2 + cell.top) + 5)
            this.ctx.restore()
            this.ctx.stroke()
        }
    }
}