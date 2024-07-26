"use strict";
const primaryColor = "#03723c";
const strokeColor = "#dadada";
class Excel {
    constructor(parentElement, csv) {
        this.header = null;
        this.sidebar = null;
        this.ctx = null;
        this.headers = [];
        this.sidebarcells = [];
        this.selectedCells = [];
        this.selectedArea = [];
        this.tableWidth = 0;
        this.tableHeight = 0;
        this.cellheight = 30;
        this.cellwidth = 100;
        this.mincellwidth = 60;
        this.startx = 0;
        this.prevWidth = 0;
        this.scrollX = 0;
        this.scrollY = 0;
        this.isDraggingCanvas = false;
        this.isDraggingHeader = false;
        this.inputActive = false;
        this.edgeDetected = false;
        this.selectionMode = false;
        this.horizontalScroll = false;
        this.data = [];
        this.wrapper = parentElement;
        this.csv = csv.trim();
    }
    init() {
        this.createData();
        this.createMarkup();
        this.createHeader();
        this.drawHeader();
        this.drawSidebar();
        this.drawExcel();
        this.resizer();
        this.attachEventHandlers();
    }
    // Event handlers
    attachEventHandlers() {
        this.canvasElement.addEventListener("mouseup", this.canvasMouseupHandler.bind(this));
        this.canvasElement.addEventListener("mousedown", this.canvasMouseDownHandler.bind(this));
        this.canvasElement.addEventListener("mousemove", this.canvasMouseMoveHandler.bind(this));
        this.canvasElement.addEventListener("mouseout", () => { this.isDraggingCanvas = false; });
        this.canvasElement.addEventListener("wheel", this.scroller.bind(this));
        this.headerElement.addEventListener("mousemove", this.headerMouseMoveObserver.bind(this));
        this.headerElement.addEventListener("mouseup", this.headerMouseUpObserver.bind(this));
        this.headerElement.addEventListener("mousedown", this.headerMouseDownObserver.bind(this));
        this.headerElement.addEventListener("mouseout", () => { this.isDraggingHeader = false; });
        window.addEventListener("keydown", this.windowKeypressHandler.bind(this));
        window.addEventListener("keyup", this.windowKeyupHandler.bind(this));
    }
    canvasMouseupHandler(event) {
        const { cell } = this.getCell(event);
        let newSelectedArea = this.getCellsArea(this.startSelectionCell, cell);
        if (!newSelectedArea.length)
            return;
        if (newSelectedArea.length > 1) {
            this.selectedArea = newSelectedArea;
            this.createStatus();
        }
        else {
            let cell = newSelectedArea[0];
            this.selectedArea.forEach(c => this.drawCell(c));
            if (this.checkSameCell(this.activeInputCell, cell)) {
                this.createInputBox(cell);
            }
            else {
                this.inputBox.style.display = "none";
                this.setActiveCell(cell);
            }
        }
        this.selectionMode = false;
    }
    createStatus() {
    }
    getCellsArea(startCell, endCell) {
        let { row: starty, col: startx } = startCell;
        let { row: endy, col: endx } = endCell;
        let startX = Math.min(startx, endx);
        let endX = Math.max(startx, endx);
        let startY = Math.min(starty, endy);
        let endY = Math.max(starty, endy);
        let newSelection = [];
        for (let i = startY; i <= endY; i++) {
            for (let j = startX; j <= endX; j++) {
                newSelection.push(this.data[i][j]);
            }
        }
        return newSelection;
    }
    canvasMouseDownHandler(event) {
        const { cell } = this.getCell(event);
        this.startSelectionCell = cell;
        this.selectionMode = true;
    }
    canvasMouseMoveHandler(event) {
        if (this.selectionMode) {
            this.inputBox.style.display = "none";
            if (!this.checkSameCell(this.activeInputCell, this.startSelectionCell)) {
                this.drawCell(this.activeInputCell);
                this.activeInputCell = this.startSelectionCell;
                this.setActiveCell(this.activeInputCell);
            }
            const { cell } = this.getCell(event);
            const selectedArea = this.getCellsArea(this.startSelectionCell, cell);
            this.highlightCells(this.startSelectionCell, cell);
            const toRemoved = this.selectedArea.filter(c => selectedArea.indexOf(c) === -1);
            // selectedArea.forEach(c => this.drawCell(c))
            toRemoved.forEach(c => this.drawCell(c));
            this.selectedArea = selectedArea;
        }
    }
    windowKeyupHandler(event) {
        if (event.target === this.inputBox)
            return;
        this.inputBox.style.display = "none";
        this.horizontalScroll = event.shiftKey && event.altKey;
    }
    windowKeypressHandler(event) {
        if (event.target === this.inputBox)
            return;
        this.inputBox.style.display = "none";
        this.horizontalScroll = event.shiftKey && event.altKey;
        let ctrlClick = false;
        switch (event.key) {
            case "Control":
                ctrlClick = true;
                break;
            case "ArrowDown":
                this.moveActiveCell("BOTTOM");
                break;
            case "ArrowUp":
                this.moveActiveCell("TOP");
                break;
            case "ArrowLeft":
                this.moveActiveCell("LEFT");
                break;
            case "ArrowRight":
                this.moveActiveCell("RIGHT");
                break;
            case "Tab":
                this.moveActiveCell("RIGHT");
                break;
            case "Enter":
                this.moveActiveCell("BOTTOM");
                break;
            case "Escape":
                break;
            case "Backspace":
                let value = this.activeInputCell.data;
                this.activeInputCell.data = value.substring(0, value.length - 1);
                this.drawCell(this.activeInputCell);
                this.highLightCell(this.activeInputCell);
                break;
            default:
                if (event.key.match(/^\w$/)) {
                    this.createInputBox(this.activeInputCell);
                }
                this.drawCell(this.activeInputCell);
                this.highLightCell(this.activeInputCell);
                return;
        }
        if (!ctrlClick && this.selectedArea.length > 1) {
            this.selectedArea.forEach(c => this.drawCell(c));
        }
    }
    headerMouseMoveObserver(event) {
        const gap = 2;
        const { x } = this.getCoordinates(event, this.headerElement);
        for (let i = 1; i < this.headers[0].length; i++) {
            const edge = this.headers[0][i].left;
            if (Math.max(edge - gap, 0) < x && x < edge + gap) {
                this.edgeDetected = true;
                this.headerElement.style.cursor = "col-resize";
                if (!this.isDraggingHeader) {
                    this.edgeCell = this.headers[0][i - 1];
                    this.prevWidth = this.edgeCell.width;
                }
                break;
            }
            if (!this.isDraggingHeader)
                this.headerElement.style.cursor = "default";
            this.edgeDetected = false;
        }
        if (this.isDraggingHeader) {
            let diff = x - this.startx;
            let newWidth = this.prevWidth + diff;
            this.widthShifter(this.edgeCell, newWidth, this.headers);
            this.widthShifter(this.edgeCell, newWidth, this.data);
            this.drawHeader();
            this.drawGrid();
        }
    }
    headerMouseUpObserver(event) {
        if (this.isDraggingHeader) {
            this.isDraggingHeader = false;
        }
    }
    headerMouseDownObserver(event) {
        if (this.edgeDetected) {
            this.isDraggingHeader = true;
            const { x } = this.getCoordinates(event);
            this.startx = x;
            this.prevWidth = this.edgeCell.width;
        }
    }
    // Draw methods
    drawGrid() {
        var _a;
        (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.data.forEach(row => row.forEach(cell => {
            this.drawCell(cell, this.ctx, false);
        }));
        if (this.data.length && this.data[0].length) {
            if (!this.activeInputCell) {
                this.activeInputCell = this.data[0][0];
            }
            this.highLightCell(this.activeInputCell);
        }
    }
    drawExcel() {
        var _a, _b, _c;
        (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        (_b = this.header) === null || _b === void 0 ? void 0 : _b.clearRect(0, 0, this.headerElement.width, this.headerElement.height);
        (_c = this.sidebar) === null || _c === void 0 ? void 0 : _c.clearRect(0, 0, this.sidebarElement.width, this.sidebarElement.height);
        let canvaWidth = this.canvasElement.offsetWidth;
        let canvaHeight = this.canvasElement.offsetHeight;
        let initHeight = 0;
        let newScrollY = this.scrollY;
        let newScrollX = this.scrollX;
        let activeCellCreated = false;
        // this.ctx?.translate(-newScrollX, -newScrollY)
        // this.header?.translate(-newScrollX, -newScrollY)
        for (let i = newScrollY / this.cellheight; i < this.data.length; i++) {
            const row = this.data[i];
            if (i === this.data.length - 1) {
                this.extendData(10, "Y");
            }
            if (initHeight > canvaHeight + newScrollY) {
                break;
            }
            else {
                let initWidth = 0;
                initHeight += row[0].height;
                this.drawCell(this.sidebarcells[i], this.sidebar);
                for (let j = 0; j < row.length; j++) {
                    if (j === row.length - 1) {
                        this.extendData(1, "X");
                    }
                    if (initWidth > canvaWidth + newScrollX) {
                        break;
                    }
                    else {
                        initWidth += row[j].width;
                        const col = row[j];
                        this.drawCell(col);
                        this.drawCell(this.headers[0][j], this.header);
                        if (!activeCellCreated && !this.activeInputCell) {
                            activeCellCreated = true;
                            this.activeInputCell = col;
                            this.highLightCell(this.activeInputCell);
                        }
                    }
                }
            }
        }
        // this.ctx?.setTransform(1, 0, 0, 1, 0, 0);
        // this.header?.setTransform(1, 0, 0, 1, 0, 0);
        // if (this.data.length && this.data[0].length) {
        //     if (!this.activeInputCell) {
        //         this.activeInputCell = this.data[0][0]
        //     }
        //     this.highLightCell(this.activeInputCell)
        // }
        // requestAnimationFrame(this.drawExcel.bind(this))
    }
    createHeader() {
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let arr = chars.split("");
        let arr1d = [];
        if (this.header) {
            arr.forEach((c, j) => {
                let cell = {
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
                };
                arr1d.push(cell);
            });
            this.headers.push(arr1d);
        }
    }
    extendSidebar(count) {
        let prevRows = this.sidebarcells.length;
        for (let i = prevRows; i < prevRows + count; i++) {
            const prev = this.sidebarcells[i - 1];
            let height = this.cellheight;
            let top = prev.top + prev.height;
            let width = prev.width;
            let cell = {
                data: String(i + 1),
                top: top,
                left: 0,
                height: height,
                width: width,
                row: i,
                col: 0,
                isbold: false,
                strokeStyle: strokeColor,
                lineWidth: 1,
                fontSize: 16,
                font: "Arial",
                align: "CENTER"
            };
            this.sidebarcells.push(cell);
        }
    }
    extendHeader(count) {
        this.headers.forEach((row, i) => {
            let left = row[row.length - 1].left + row[row.length - 1].width;
            let top = row[row.length - 1].top;
            let height = row[row.length - 1].height;
            let width = this.cellwidth;
            let prevColumns = row.length;
            for (let j = prevColumns; j < prevColumns + count; j++) {
                let cell = {
                    data: this.toLetters(j + 1),
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
                };
                row.push(cell);
                this.drawCell(cell);
            }
        });
    }
    widthShifter(cell, newWidth, data) {
        if (newWidth < 60) {
            newWidth = 60;
        }
        data.forEach(row => {
            let widthChanged = false;
            row.forEach((c, i) => {
                if (!widthChanged) {
                    if (c.left === cell.left) {
                        c.width = newWidth;
                        widthChanged = true;
                    }
                }
                else {
                    c.left = row[i - 1].left + row[i - 1].width;
                }
            });
        });
    }
    drawHeader() {
        this.headers[0].forEach(cell => {
            this.drawCell(cell, this.header, true);
        });
    }
    drawSidebar() {
        let arr = [...Array(this.data.length || 50)].map((_, i) => i + 1);
        if (this.header) {
            arr.forEach((c, i) => {
                let cell = {
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
                    align: "CENTER"
                };
                this.drawCell(cell, this.sidebar, true);
                this.sidebarcells.push(cell);
            });
        }
    }
    // Data methods
    createMarkup() {
        this.wrapper.style.boxSizing = "border-box";
        this.wrapper.style.position = "relative";
        let inputBox = document.createElement("input");
        inputBox.style.display = "none";
        inputBox.style.position = "absolute";
        inputBox.style.boxSizing = "border-box";
        inputBox.style.outline = "none";
        // inputBox.onkeydown = e => e.stopPropagation()
        let emptyBox = document.createElement("div");
        emptyBox.style.width = `${this.mincellwidth}px`;
        emptyBox.style.height = `${this.cellheight}px`;
        emptyBox.style.boxSizing = "border-box";
        emptyBox.style.display = "inline-block";
        let header = document.createElement("canvas");
        header.width = this.wrapper.offsetWidth - this.cellwidth;
        header.height = this.cellheight;
        header.style.boxSizing = "border-box";
        this.wrapper.appendChild(emptyBox);
        this.wrapper.appendChild(header);
        let sidebar = document.createElement("canvas");
        sidebar.width = this.mincellwidth;
        sidebar.height = this.wrapper.offsetHeight - this.cellheight;
        let inputBoxWrapper = document.createElement("div");
        inputBoxWrapper.style.position = "relative";
        inputBoxWrapper.style.display = "inline-block";
        let canvas = document.createElement("canvas");
        canvas.width = this.wrapper.offsetWidth - this.mincellwidth;
        canvas.height = this.wrapper.offsetHeight - this.cellheight;
        canvas.style.cursor = "cell";
        inputBoxWrapper.appendChild(canvas);
        inputBoxWrapper.appendChild(inputBox);
        this.wrapper.appendChild(sidebar);
        this.wrapper.appendChild(inputBoxWrapper);
        this.ctx = canvas.getContext("2d");
        this.header = header.getContext("2d");
        this.sidebar = sidebar.getContext("2d");
        // canvas.addEventListener("wheel", (e) => this.scroller(e, canvas))
        // sidebar.addEventListener("wheel", (e) => this.scroller(e, sidebar))
        // header.addEventListener("wheel", (e) => this.scroller(e, header))
        this.canvasElement = canvas;
        this.sidebarElement = sidebar;
        this.headerElement = header;
        this.inputBox = inputBox;
        this.canvasElement.width = this.wrapper.offsetWidth - this.mincellwidth;
        this.canvasElement.height = this.wrapper.offsetHeight - this.cellheight;
        this.headerElement.width = this.wrapper.offsetWidth - this.cellwidth;
        this.sidebarElement.height = this.wrapper.offsetHeight - this.cellheight;
    }
    createData() {
        this.data = [];
        let rows = this.csv.split("\n");
        rows.forEach((row, i) => {
            let cols = row.split(",");
            let dataRow = [];
            cols.forEach((col, j) => {
                let cell = {
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
                };
                dataRow.push(cell);
            });
            this.data.push(dataRow);
        });
    }
    extendData(count, axis) {
        if (axis == "X") {
            this.data.forEach((row, i) => {
                let left = row[row.length - 1].left + row[row.length - 1].width;
                let top = row[row.length - 1].top;
                let height = row[row.length - 1].height;
                let width = this.cellwidth;
                let prevColumns = row.length;
                for (let j = prevColumns; j < prevColumns + count; j++) {
                    let cell = {
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
                    };
                    row.push(cell);
                    this.drawCell(cell);
                }
            });
            this.extendHeader(count);
        }
        else {
            let prevRows = this.data.length;
            for (let i = prevRows; i < prevRows + count; i++) {
                const prev = this.data[i - 1];
                let height = this.cellheight;
                let row = [];
                for (let j = 0; j < prev.length; j++) {
                    let left = prev[j].left;
                    let top = prev[j].top + prev[j].height;
                    let width = prev[j].width;
                    let cell = {
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
                    };
                    this.drawCell(cell);
                    row.push(cell);
                }
                this.data.push(row);
            }
            this.extendSidebar(count);
        }
    }
    resizer() {
        const resizeEventHandler = function () {
            this.canvasElement.width = this.wrapper.offsetWidth - this.mincellwidth;
            this.canvasElement.height = this.wrapper.offsetHeight - this.cellheight;
            this.headerElement.width = this.wrapper.offsetWidth - this.cellwidth;
            this.sidebarElement.height = this.wrapper.offsetHeight - this.cellheight;
            this.drawGrid();
            this.drawHeader();
            this.drawSidebar();
        };
        window.addEventListener("resize", resizeEventHandler.bind(this));
    }
    clearElement(ele, context) {
        if (!context)
            context = this.ctx;
        context.clearRect(0, 0, ele.offsetWidth, ele.offsetHeight);
    }
    // cell methods
    getCoordinates(event, canvasElement) {
        if (!canvasElement) {
            canvasElement = this.canvasElement;
        }
        let rect = canvasElement.getBoundingClientRect();
        let x = Math.max(0, event.clientX - rect.left + this.scrollX);
        let y = Math.max(0, event.clientY - rect.top + this.scrollY);
        return { x, y };
    }
    getCell(event) {
        const { x, y } = this.getCoordinates(event);
        for (let i = 0; i < this.data.length; i++) {
            const row = this.data[i];
            for (let j = 0; j < row.length; j++) {
                const cell = row[j];
                if (cell.left < x && x <= cell.left + cell.width && cell.top < y && y <= cell.top + cell.height) {
                    return { cell, x, y };
                }
            }
        }
        return { cell: this.data[0][0], x, y };
    }
    drawCell(cell, ctx, clear = true, type) {
        let context = null;
        context = ctx ? ctx : this.ctx;
        if (context) {
            switch (context) {
                case this.sidebar:
                    context.translate(this.scrollX, 0);
                    break;
                case this.header:
                    context.translate(0, this.scrollY);
                    break;
                default:
                    break;
            }
            context.strokeStyle = cell.strokeStyle;
            context.lineWidth = cell.lineWidth;
            context.setLineDash([]);
            context.font = `${cell.fontSize}px ${cell.font}`;
            if (clear)
                context.clearRect(cell.left - this.scrollX - 2, cell.top - 2 - this.scrollY, cell.width + 4, cell.height + 4);
            else
                context.clearRect(cell.left - this.scrollX - 0.5, cell.top - this.scrollY - 0.5, cell.width + 1, cell.height + 1);
            context.save();
            context.beginPath();
            context.rect(cell.left - this.scrollX - 0.5, cell.top - this.scrollY - 0.5, cell.width + 1, cell.height + 1);
            // context.fillStyle = "#65eaf84a"
            // context.fillRect(cell.left, cell.top, cell.width, cell.height)
            context.clip();
            context.fillText(cell.data, cell.align === "CENTER" ?
                (cell.width / 2 + (cell.left - this.scrollX) - 4) :
                cell.align !== "RIGHT" ?
                    (cell.left - this.scrollX) + 5 :
                    ((cell.left - this.scrollX) + cell.width / 2), (cell.height / 2 + (cell.top - this.scrollY)) + 5);
            context.restore();
            context.stroke();
            if (type) {
            }
            context.setTransform(1, 0, 0, 1, 0, 0);
            // if (!sidecells) {
            //     this.drawCell(this.data[cell.row+1][cell.col], ctx,false,true)
            //     this.drawCell(this.data[cell.row][cell.col+1], ctx,false,true)
            // }
        }
    }
    drawSidebarCell(cell) {
    }
    moveActiveCell(direction) {
        let { row, col } = this.activeInputCell;
        if (!this.activeInputCell)
            return;
        this.drawCell(this.activeInputCell);
        switch (direction) {
            case "TOP":
                this.activeInputCell = this.data[Math.max(row - 1, 0)][col];
                if (this.activeInputCell.top - this.cellheight < this.scrollY) {
                    this.scrollY = Math.max(0, this.scrollY - this.cellheight);
                    this.drawExcel();
                }
                break;
            case "LEFT":
                this.activeInputCell = this.data[row][Math.max(col - 1, 0)];
                if (this.activeInputCell.left - this.cellwidth < this.scrollX) {
                    this.scrollX = Math.max(0, this.scrollX - this.cellwidth);
                    this.drawExcel();
                }
                break;
            case "RIGHT":
                this.activeInputCell = this.data[row][Math.min(this.data[0].length - 1, col + 1)];
                if (this.activeInputCell.left + this.cellwidth > this.scrollX + this.canvasElement.offsetWidth) {
                    this.scrollX += this.cellwidth;
                    this.drawExcel();
                }
                break;
            case "BOTTOM":
                this.activeInputCell = this.data[Math.min(this.data.length - 1, row + 1)][col];
                if (this.activeInputCell.top + this.cellheight > this.scrollY + this.canvasElement.offsetHeight) {
                    this.scrollY += this.cellheight;
                    this.drawExcel();
                }
                break;
        }
        this.highLightCell(this.activeInputCell);
    }
    setActiveCell(cell) {
        this.drawCell(this.activeInputCell);
        this.activeInputCell = cell;
        this.highLightCell(this.activeInputCell);
    }
    highLightCell(cell) {
        let context = this.ctx;
        if (!context)
            return;
        context.strokeStyle = primaryColor;
        context.lineWidth = 2;
        context.save();
        context.beginPath();
        context.rect(cell.left - this.scrollX - 1, cell.top - this.scrollY - 1, cell.width + 1, cell.height + 1);
        context.clip();
        context.restore();
        context.stroke();
    }
    highlightCells(startCell, endCell, ants) {
        this.selectedArea.forEach(c => this.drawCell(c, undefined, true));
        let context = this.ctx;
        if (!context)
            return;
        context.strokeStyle = primaryColor;
        context.lineWidth = 2;
        context.beginPath();
        if (ants)
            context.setLineDash([5, 3]);
        context.translate(-this.scrollX, -this.scrollY);
        // context.strokeRect(this.scrollX + startCell.left, this.scrollY + startCell.top, cell.width, cell.height)
        let leftX1 = Math.min(startCell.left, endCell.left, startCell.left + startCell.width, endCell.left + endCell.width);
        let leftX2 = Math.max(startCell.left, endCell.left, startCell.left + startCell.width, endCell.left + endCell.width);
        let topX1 = Math.min(startCell.top, endCell.top + endCell.height, startCell.top + startCell.height, endCell.top);
        let topX2 = Math.max(startCell.top, endCell.top + endCell.height, startCell.top + startCell.height, endCell.top);
        context.moveTo(leftX1, topX1);
        context.lineTo(leftX2, topX1);
        context.lineTo(leftX2, topX2);
        context.lineTo(leftX1, topX2);
        context.lineTo(leftX1, topX1);
        context.stroke();
        context.setTransform(1, 0, 0, 1, 0, 0);
    }
    setSelectionCell(cell, ctx) {
        let context = null;
        context = ctx ? ctx : this.ctx;
        if (context) {
            context.strokeStyle = cell.strokeStyle;
            context.lineWidth = cell.lineWidth;
            context.font = `${cell.fontSize}px ${cell.font}`;
            context.clearRect(this.scrollX + cell.left - 1, this.scrollY + cell.top - 0.5, cell.width + 1, cell.height + 1);
            context.beginPath();
            context.save();
            context.rect(this.scrollX + cell.left - 1, this.scrollY + cell.top - 0.5, cell.width + 1, cell.height + 1);
            context.fillStyle = "#65eaf84a";
            context.fillRect(this.scrollX + cell.left - 1, this.scrollY + cell.top - 0.5, cell.width + 1, cell.height + 1);
            context.clip();
            context.fillText(cell.data, cell.align === "CENTER" ? (cell.width / 2 + cell.left - 4) : cell.left + 5, (cell.height / 2 + cell.top) + 5);
            context.restore();
            context.stroke();
        }
    }
    checkSameCell(cell1, cell2) {
        const { top, left } = cell1;
        return cell2.top === top && cell2.left == left;
    }
    // Input box
    createInputBox(cell) {
        const { top, left, width, height, font, fontSize, data, row, col } = cell;
        this.inputBox.style.top = `${top - this.scrollY - 0.5}px`;
        this.inputBox.style.left = `${left - this.scrollX - 0.5}px`;
        this.inputBox.style.width = `${width}px`;
        this.inputBox.style.height = `${height}px`;
        this.inputBox.style.font = `${font}`;
        this.inputBox.style.fontSize = `${fontSize}px`;
        this.inputBox.style.paddingLeft = `3px`;
        this.inputBox.style.border = `1px solid ${primaryColor}`;
        this.inputBox.value = `${data}`;
        // if (!this.inputActive) {
        this.inputBox.style.display = `block`;
        this.inputBox.focus();
        this.inputActive = true;
        this.inputBox.onchange = (e) => {
            e.stopPropagation();
            this.data[row][col].data = e.target.value;
        };
        // }
    }
    scroller(event) {
        let { deltaY } = event;
        if (this.horizontalScroll) {
            this.scrollX = Math.max(0, this.scrollX + deltaY);
        }
        else {
            this.scrollY = Math.max(0, this.scrollY + (deltaY < 0 ? -30 : 30));
        }
        this.drawExcel();
    }
    toLetters(num) {
        var mod = num % 26, pow = num / 26 | 0, out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
        return pow ? this.toLetters(pow) + out : out;
    }
}
