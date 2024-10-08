"use strict";
var Colors;
(function (Colors) {
    Colors["PRIMARY"] = "#03723c";
    Colors["SECONDARY"] = "#959595";
    Colors["STROKE"] = "#dadada";
})(Colors || (Colors = {}));
class Excel {
    /**
     * Creates and initializes the App object
     * @param container Specify container to draw the app layout
     * @param json 1D array of cells to be rendered
     */
    constructor(container, fileId = "-1") {
        this.jsonData = [];
        this.offset = 0.5;
        this.cellheight = 30;
        this.cellwidth = 100;
        this.mincellwidth = 60;
        this.dx = 10;
        this.dy = 10;
        this.scrolling = false;
        this.smoothingFactor = 0.1;
        this.extracells = 30;
        this.prevWidth = 0;
        this.autoScrollbars = false;
        this.keys = {
            alt: false,
            ctrl: false,
            shift: false,
        };
        this.inputBox = {
            element: null,
            left: 0,
            top: 0,
            outMode: false,
            prevValue: "",
        };
        this.canvas = {
            ctx: null,
            data: [],
            element: null,
            startCell: null,
            endCell: null,
        };
        this.sidebar = {
            ctx: null,
            data: [],
            element: null,
            endCell: null,
            startCell: null,
        };
        this.header = {
            ctx: null,
            data: [],
            element: null,
            isDragging: false,
            edgeDetected: false,
            endCell: null,
            startCell: null,
            startx: 0,
            cell_extend: false,
            selected_cells: -1,
        };
        this.mouse = {
            x: 0,
            y: 0,
            startx: 0,
            starty: 0,
            up: false,
            horizontal: false,
            scrollX: 0,
            scrollY: 0,
            animatex: 0,
            animatey: 0,
            pscrollX: 100,
            pscrollY: 100,
            scale: 1,
        };
        this.selectionMode = {
            active: false,
            selectedArea: [],
            startSelectionCell: null,
            decoration: false,
            lineDashOffset: 0,
        };
        this.clipboard = {
            mode: null,
            data: [],
        };
        this.findReplace = {
            find: "",
            replace: "",
            cells: [],
        };
        this.currentFile = -1;
        this.currentPageY = 0;
        this.currentPageX = 1;
        this.wrapper = container;
        this.jsonData = [];
        this.currentFile = parseInt(fileId);
        this.busy = null;
        this.init();
        this.API = this.getExcelAPIUrls("http://localhost:5165/api/Cells/");
    }
    /**
     * Initializes the app
     */
    init() {
        this.createMarkup();
        this.extendCells(110, "X");
        this.extendCells(110, "Y");
        this.extendHeader(200);
        this.extendSidebar(200);
        this.setActiveCells();
        this.paginate("horizontal");
        this.paginate("vertical");
        this.attachEvents();
        this.smoothUpdate();
        this.drawHeader();
        this.drawSidebar();
        this.drawData();
        this.resizer();
    }
    /**
     * Executes functions for successful rendering
     */
    render_internal() {
        this.smoothUpdate();
        this.drawHeader();
        this.drawSidebar();
        this.drawData();
        this.setSelection();
        this.positionInputBox();
        if (this.clipboard.mode) {
            this.marchingAnts();
        }
    }
    /**
     * Renders the whole app layout based on the new state
     */
    render() {
        if (this.busy)
            return;
        this.busy = requestAnimationFrame(() => {
            this.busy = null;
            this.render_internal();
        });
    }
    paginate(direction) {
        fetch("http://localhost:5165/api/Cells/file/" +
            this.currentFile +
            "/" +
            this.currentPageX +
            "/" +
            this.currentPageY)
            .then((response) => response.json())
            .then((data) => {
            this.fillData(data);
            if ([data[0]].some(c => c.row === 0 && c.col === 0)) {
                this.setActiveCells();
            }
            direction === "horizontal" && this.currentPageX++;
            direction === "vertical" && this.currentPageY++;
        });
    }
    setActiveCells() {
        this.selectionMode.startSelectionCell = this.canvas.data[0][0];
        this.selectionMode.selectedArea = [[this.canvas.data[0][0]]];
    }
    /**
     * Creates the markup and appends it to the given container/wrapper
     */
    createMarkup() {
        this.wrapper.style.boxSizing = "border-box";
        this.wrapper.style.position = "relative";
        this.wrapper.style.fontSize = "0";
        let headWrapper = document.createElement("div");
        headWrapper.style.display = "flex";
        let inputBox = document.createElement("input");
        inputBox.style.display = "none";
        inputBox.style.position = "absolute";
        inputBox.style.boxSizing = "border-box";
        inputBox.style.outline = "none";
        let emptyBox = document.createElement("div");
        emptyBox.style.width = `${this.mincellwidth}px`;
        emptyBox.style.height = `${this.cellheight}px`;
        emptyBox.style.boxSizing = "border-box";
        emptyBox.style.flexShrink = "0";
        emptyBox.style.display = "inline-block";
        emptyBox.style.background = Colors.SECONDARY + "33";
        emptyBox.style.borderRight = `0.5px solid ${Colors.SECONDARY + "aa"}`;
        emptyBox.style.borderBottom = `0.5px solid ${Colors.SECONDARY + "aa"}`;
        this.emptyBox = emptyBox;
        let headerElement = document.createElement("canvas");
        headerElement.height = this.cellheight;
        headerElement.style.boxSizing = "border-box";
        headerElement.style.zIndex = "1";
        headerElement.style.background = "white";
        headWrapper.appendChild(emptyBox);
        headWrapper.appendChild(headerElement);
        this.wrapper.appendChild(headWrapper);
        // this.wrapper.appendChild(headerElement)
        let sidebarElement = document.createElement("canvas");
        sidebarElement.width = this.mincellwidth;
        let inputBoxWrapper = document.createElement("div");
        inputBoxWrapper.style.position = "relative";
        inputBoxWrapper.style.display = "inline-block";
        this.inputBoxWrapper = inputBoxWrapper;
        let canvasElement = document.createElement("canvas");
        canvasElement.style.cursor = "cell";
        inputBoxWrapper.appendChild(canvasElement);
        inputBoxWrapper.appendChild(inputBox);
        let canvaWraper = document.createElement("div");
        canvaWraper.style.display = "flex";
        canvaWraper.appendChild(sidebarElement);
        canvaWraper.appendChild(inputBoxWrapper);
        this.wrapper.appendChild(canvaWraper);
        this.canvas.ctx = canvasElement.getContext("2d");
        this.header.ctx = headerElement.getContext("2d");
        this.sidebar.ctx = sidebarElement.getContext("2d");
        this.canvas.element = canvasElement;
        this.sidebar.element = sidebarElement;
        this.header.element = headerElement;
        this.inputBox.element = inputBox;
        // scrollbar
        this.scrollXWrapper = document.createElement("div");
        this.scrollXWrapper.style.overflowX = "scroll";
        this.infiniteXDiv = document.createElement("div");
        this.infiniteXDiv.style.height = "1px";
        this.scrollXWrapper.appendChild(this.infiniteXDiv);
        this.scrollXWrapper.style.position = "absolute";
        this.scrollXWrapper.style.bottom = "0";
        this.scrollXWrapper.style.right = "0";
        this.scrollYWrapper = document.createElement("div");
        this.scrollYWrapper.style.overflowY = "scroll";
        this.infiniteYDiv = document.createElement("div");
        this.infiniteYDiv.style.width = "1px";
        this.scrollYWrapper.appendChild(this.infiniteYDiv);
        this.scrollYWrapper.style.position = "absolute";
        this.scrollYWrapper.style.bottom = "0";
        this.scrollYWrapper.style.right = "0";
        this.scrollXWrapper.style.width = `${this.wrapper.offsetWidth - this.mincellwidth}px`;
        this.scrollYWrapper.style.height = `${this.wrapper.offsetHeight - this.cellheight}px`;
        this.wrapper.appendChild(this.scrollXWrapper);
        this.wrapper.appendChild(this.scrollYWrapper);
        this.resizeEventHandler();
    }
    /**
     * To remove the contents of the excel object from the DOM
     */
    hide() {
        this.wrapper.innerHTML = "";
    }
    /**
     * Adjusts the size of every canvas based on the wrappers dimentions
     */
    resizeEventHandler() {
        this.canvas.element.width = this.wrapper.offsetWidth - this.mincellwidth;
        this.canvas.element.height = this.wrapper.offsetHeight - this.cellheight;
        this.header.element.width = this.wrapper.offsetWidth - this.mincellwidth;
        this.sidebar.element.height = this.wrapper.offsetHeight - this.cellheight;
        this.scrollXWrapper.style.width = `${this.wrapper.offsetWidth - this.mincellwidth}px`;
        this.scrollYWrapper.style.height = `${this.wrapper.offsetHeight - this.cellheight}px`;
        // scaling
        this.header.element.height = this.cellheight * this.mouse.scale;
        this.sidebar.element.width = this.mincellwidth * this.mouse.scale;
        this.emptyBox.style.height = `${this.cellheight * this.mouse.scale}px`;
        this.emptyBox.style.width = `${this.mincellwidth * this.mouse.scale}px`;
        this.inputBox.element.style.scale = String(this.mouse.scale);
        this.render();
    }
    /**
     * Attaches the resize event on the window
     */
    resizer() {
        window.addEventListener("resize", () => this.resizeEventHandler());
    }
    /**
     * Changes the scroll value when scrollbars dragged
     * @param event ScrollEvent
     * @param direction Scroll direction
     */
    scrollHandler(event, direction) {
        if (direction === "X")
            this.mouse.scrollX = event.target.scrollLeft;
        if (direction === "Y")
            this.mouse.scrollY = event.target.scrollTop;
        this.render();
    }
    /**
     * Changes the scale when mouse wheel moved (ctrl+wheel)
     * @param event Mouse wheel event
     */
    scale(event) {
        if (event.ctrlKey) {
            const { deltaY } = event;
            event.preventDefault();
            event.stopImmediatePropagation();
            this.mouse.scale = Math.max(this.mouse.scale + (deltaY < 0 ? 0.1 : -0.1), 0.5);
            this.mouse.scale = Math.min(this.mouse.scale, 2);
            this.resizeEventHandler();
        }
    }
    /**
     * Converts CSV to JSON in async mode.
     *
     * Extends the header and sidebar accordingly.
     *
     * Sets the active cell
     */
    async fillData(data) {
        await new Promise((res) => {
            this.jsonData = data;
            this.jsonData.forEach((jsonCell, j) => {
                let cell = {
                    ...jsonCell,
                    top: jsonCell.row * this.cellheight,
                    left: jsonCell.col * this.cellwidth,
                    height: this.cellheight,
                    width: this.cellwidth,
                    isbold: false,
                    strokeStyle: Colors.STROKE,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "LEFT",
                };
                try {
                    this.canvas.data[jsonCell.row][jsonCell.col] = {
                        ...this.canvas.data[jsonCell.row][jsonCell.col],
                        ...cell,
                    };
                }
                catch (e) {
                    console.log(e);
                }
                this.currentFile = jsonCell.file;
            });
            if (this.selectionMode.selectedArea.length == 0)
                this.selectionMode.selectedArea = [[this.canvas.data[0][0]]];
            if (!this.selectionMode.startSelectionCell)
                this.selectionMode.startSelectionCell =
                    this.selectionMode.selectedArea[0][0];
            this.inputBox.element.value = this.selectionMode.selectedArea[0][0].data;
            res(this.canvas.data);
        });
        this.render();
    }
    /**
     * Clears the main canvas
     */
    clearData() {
        let ctx = this.canvas.ctx;
        if (!ctx || !this.canvas.element)
            return;
        ctx.clearRect(0, 0, this.canvas.element.offsetWidth, this.canvas.element.offsetHeight);
    }
    /**
     * Paints the cell in the main canvas
     * @param cell Given cell
     * @param active Specify true if active
     * @param selected Specify true if selection cell
     */
    drawDataCell(cell, active, selected) {
        let ctx = this.canvas.ctx;
        if (!ctx)
            return;
        ctx.scale(this.mouse.scale, this.mouse.scale);
        ctx.restore();
        ctx.fillStyle = selected ? Colors.PRIMARY + "22" : "#ffffff";
        ctx.font = `${cell.fontSize}px ${cell.font}`;
        ctx.save();
        ctx.fillRect(cell.left - this.mouse.animatex, cell.top - this.mouse.animatey, cell.width, cell.height);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cell.left - this.mouse.animatex - this.offset, cell.top - this.mouse.animatey - this.offset);
        ctx.lineTo(cell.left - this.mouse.animatex - this.offset + cell.width, cell.top - this.mouse.animatey - this.offset);
        ctx.lineTo(cell.left - this.mouse.animatex - this.offset + cell.width, cell.top - this.mouse.animatey - this.offset + cell.height);
        ctx.lineTo(cell.left - this.mouse.animatex - this.offset, cell.top - this.mouse.animatey - this.offset + cell.height);
        ctx.lineTo(cell.left - this.mouse.animatex - this.offset, cell.top - this.mouse.animatey - this.offset);
        // ctx.rect(cell.left - this.mouse.animatex - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width, cell.height)
        ctx.clip();
        ctx.fillStyle = "#000000";
        switch (cell.align) {
            case "CENTER":
                ctx.fillText(cell.data, cell.width / 2 + (cell.left - this.mouse.animatex) - 4, cell.height / 2 + (cell.top - this.mouse.animatey) + 5);
                break;
            case "LEFT":
                ctx.fillText(cell.data, cell.left - this.mouse.animatex + 5, cell.height / 2 + (cell.top - this.mouse.animatey) + 5);
                break;
        }
        ctx.restore();
        ctx.strokeStyle = active ? Colors.PRIMARY + "AA" : "#959595aa";
        ctx.stroke();
        if (!active)
            return;
        ctx.beginPath();
        ctx.rect(cell.left - 2, cell.top - 2, cell.width + 4, cell.height + 4);
        ctx.strokeStyle = Colors.PRIMARY;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    /**
     * Repaints the canvas based on screen size with the new state
     */
    drawData() {
        if (!this.canvas.data.length) {
            return;
        }
        let initialCol = this.binarySearch(this.canvas.data[0], this.mouse.scrollX);
        let initialRow = this.binarySearch(this.canvas.data.map((d) => d[0]), this.mouse.scrollY, true);
        let finalRow = initialRow;
        let finalCol = 0;
        if (!this.canvas.element)
            return;
        for (let j = initialRow; j < this.canvas.data.length; j++) {
            finalCol = initialCol;
            finalRow++;
            for (let j = initialCol; j < this.canvas.data[0].length; j++) {
                finalCol++;
                if (this.canvas.data[0][j].left >
                    this.canvas.element.offsetWidth + this.mouse.scrollX) {
                    break;
                }
            }
            if (this.canvas.data[j][0].top >
                this.canvas.element.offsetHeight + this.mouse.scrollY)
                break;
        }
        if (Math.abs(finalRow - this.canvas.data.length) < 50) {
            this.extendCells(100, "Y");
            this.paginate("vertical");
        }
        if (Math.abs(initialCol - this.canvas.data[0].length) < 50) {
            this.extendCells(100, "X");
            this.paginate("horizontal");
        }
        this.clearData();
        for (let i = Math.max(initialRow - this.extracells, 0); i < Math.min(finalRow + this.extracells, this.canvas.data.length); i++) {
            for (let j = Math.max(initialCol - this.extracells, 0); j < Math.min(finalCol + this.extracells, this.canvas.data[0].length); j++) {
                try {
                    this.drawDataCell(this.canvas.data[i][j]);
                }
                catch (e) {
                    console.log(this.canvas.data[i][j], i, j);
                    console.log(this.canvas.data[i]);
                    break;
                }
            }
        }
        this.header.startCell = this.header.data[0][initialCol];
        this.header.endCell = this.header.data[0][finalCol];
        this.canvas.startCell = this.canvas.data[initialRow][initialCol];
        this.canvas.endCell = this.canvas.data[finalRow][finalCol];
        this.infiniteYDiv.style.height = `${window.outerHeight + this.canvas.data.length * this.cellheight}px`;
        this.infiniteXDiv.style.width = `${window.outerWidth + this.canvas.data[0].length * this.cellwidth}px`;
    }
    /**
     * Extends the data based on the specified direction
     * @param count Column or Row count
     * @param axis Specify X for columns or Y for rows
     */
    async extendCells(count, axis) {
        if (!this.canvas.data.length) {
            this.canvas.data.push([
                {
                    id: -1,
                    data: "",
                    top: 0,
                    left: 0,
                    height: this.cellheight,
                    width: this.cellwidth,
                    row: 0,
                    col: 0,
                    isbold: false,
                    strokeStyle: Colors.STROKE,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "CENTER",
                    file: this.currentFile,
                },
            ]);
        }
        if (axis == "X") {
            this.canvas.data.forEach((row, i) => {
                let width = this.cellwidth;
                let prevColumns = row.length;
                for (let j = prevColumns; j < prevColumns + count; j++) {
                    let left = row[row.length - 1].left + row[row.length - 1].width;
                    let top = row[row.length - 1].top;
                    let height = row[row.length - 1].height;
                    let cell = {
                        id: -1,
                        data: "",
                        top: top,
                        left: left,
                        height: height,
                        width: width,
                        row: i,
                        col: j,
                        isbold: false,
                        strokeStyle: Colors.STROKE,
                        lineWidth: 1,
                        fontSize: 16,
                        font: "Arial",
                        align: "LEFT",
                        file: this.currentFile,
                    };
                    row.push(cell);
                }
            });
        }
        else {
            let prevRows = this.canvas.data.length;
            for (let i = prevRows; i < prevRows + count; i++) {
                const prev = this.canvas.data[i - 1];
                let height = this.cellheight;
                let row = [];
                for (let j = 0; j < prev.length; j++) {
                    let left = prev[j].left;
                    let top = prev[j].top + prev[j].height;
                    let width = prev[j].width;
                    let cell = {
                        id: -1,
                        data: "",
                        top: top,
                        left: left,
                        height: height,
                        width: width,
                        row: i,
                        col: j,
                        isbold: false,
                        strokeStyle: Colors.STROKE,
                        lineWidth: 1,
                        fontSize: 16,
                        font: "Arial",
                        align: "LEFT",
                        file: this.currentFile,
                    };
                    row.push(cell);
                }
                this.canvas.data.push(row);
                if (this.header.selected_cells !== -1) {
                    this.selectionMode.selectedArea.push([
                        row[this.header.selected_cells],
                    ]);
                }
            }
        }
    }
    /**
     * Checks if user is in selection mode and repaints the canvas with the selection
     * @param event Mousemove event
     */
    canvasMouseMoveHandler(event) {
        if (this.selectionMode.active) {
            this.inputBox.element.style.display = "none";
            const { cell } = this.getCell(event);
            const selectedArea = this.getCellsArea(this.selectionMode.startSelectionCell, cell);
            this.selectionMode.selectedArea = selectedArea;
            this.render();
        }
    }
    /**
     * Sets the first cell of the selection mode
     * @param event Mousedown event
     */
    canvasMouseDownHandler(event) {
        const prevCell = this.selectionMode.startSelectionCell;
        const prevValue = this.inputBox.element.value;
        const { cell } = this.getCell(event);
        if (prevCell.id === -1) {
            if (this.inputBox.element.value !== "") {
                this.API.createOrUpdateCell({
                    ...prevCell,
                    data: this.inputBox.element.value,
                }).then((data) => {
                    this.canvas.data[prevCell.row][prevCell.col] = {
                        ...this.canvas.data[prevCell.row][prevCell.col],
                        ...data,
                    };
                });
            }
        }
        else {
            if (this.inputBox.element.value.trim().length === 0) {
                this.API.deleteCell(prevCell.id).then(() => {
                    this.canvas.data[prevCell.row][prevCell.col].data = prevValue;
                });
            }
            else {
                this.API.createOrUpdateCell({
                    ...prevCell,
                    data: this.inputBox.element.value,
                }).then(() => {
                    this.canvas.data[prevCell.row][prevCell.col].data = prevValue;
                });
            }
        }
        this.selectionMode.startSelectionCell = cell;
        this.selectionMode.active = true;
        this.header.selected_cells = -1;
        this.render();
    }
    /**
     * Handles the click event
     *
     * Checks if double clicked to create the input box
     *
     * Ends the cell selection
     * @param event Mouseup event
     */
    canvasMouseupHandler(event) {
        const startSelectionCell = this.selectionMode.startSelectionCell;
        this.selectionMode.active = false;
        if (!startSelectionCell)
            return;
        const { cell } = this.getCell(event);
        let newSelectedArea = this.getCellsArea(startSelectionCell, cell);
        if (!newSelectedArea.length)
            return;
        if (newSelectedArea.length > 1) {
            // this.createStatus()
        }
        else {
            if (!this.selectionMode.selectedArea.length) {
                this.selectionMode.selectedArea = newSelectedArea;
                this.render();
                return;
            }
            let cell = newSelectedArea[0][0];
            if (this.checkSameCell(this.selectionMode.selectedArea[0][0], cell)) {
                this.positionInputBox();
                this.showInputBox();
            }
            else {
                this.inputBox.element.style.display = "none";
                // this.setActiveCell();
            }
        }
        this.selectionMode.selectedArea = newSelectedArea;
        this.render();
    }
    /**
     * Attaches events on Header, Sidebar, Main canvas and WIndow
     */
    attachEvents() {
        this.header.element.addEventListener("wheel", (e) => this.scroller(e, "HEADER"));
        this.sidebar.element.addEventListener("wheel", (e) => this.scroller(e, "SIDEBAR"));
        this.canvas.element.addEventListener("wheel", (e) => this.scroller(e));
        this.canvas.element.addEventListener("mousemove", this.canvasMouseMoveHandler.bind(this));
        this.header.element.addEventListener("mousemove", this.headerMouseMoveObserver.bind(this));
        this.canvas.element.addEventListener("mousedown", this.canvasMouseDownHandler.bind(this));
        this.header.element.addEventListener("mousedown", this.headerMouseDownObserver.bind(this));
        this.canvas.element.addEventListener("mouseup", this.canvasMouseupHandler.bind(this));
        this.header.element.addEventListener("mouseup", this.headerMouseUpObserver.bind(this));
        this.scrollXWrapper.addEventListener("scroll", (e) => this.scrollHandler(e, "X"));
        this.scrollYWrapper.addEventListener("scroll", (e) => this.scrollHandler(e, "Y"));
        this.header.element.addEventListener("mouseout", () => {
            this.header.isDragging = false;
        });
        this.canvas.element.addEventListener("mouseout", () => {
            this.selectionMode.active = false;
        });
        window.addEventListener("keydown", this.windowKeypressHandler.bind(this));
        window.addEventListener("keyup", this.windowKeyupHandler.bind(this));
        window.addEventListener("wheel", (e) => this.scale(e), { passive: false });
    }
    /**
     * To clear the header canvas
     */
    clearHeader() {
        let ctx = this.header.ctx;
        if (!ctx || !this.header.element)
            return;
        ctx.clearRect(0, 0, this.header.element.offsetWidth, this.header.element.offsetHeight);
    }
    /**
     * Paints the given cell in header
     * @param cell Specified cell to draw
     * @param active Specify true if active
     */
    drawHeaderCell(cell, active) {
        let ctx = this.header.ctx;
        if (!ctx)
            return;
        ctx.scale(this.mouse.scale, this.mouse.scale);
        ctx.restore();
        ctx.fillStyle = active ? Colors.PRIMARY + "22" : Colors.SECONDARY + "33";
        ctx.font = `${cell.fontSize}px ${cell.font}`;
        ctx.save();
        ctx.clearRect(cell.left - this.mouse.animatex - this.offset, cell.top - this.offset, cell.width + this.offset * 2, cell.height + this.offset * 2);
        ctx.fillRect(cell.left - this.mouse.animatex, cell.top, cell.width, cell.height);
        ctx.save();
        ctx.beginPath();
        ctx.rect(cell.left - this.mouse.animatex - this.offset, cell.top - this.offset, cell.width, cell.height);
        ctx.clip();
        ctx.fillStyle = active ? Colors.PRIMARY : "#000000";
        switch (cell.align) {
            case "CENTER":
                ctx.fillText(cell.data, cell.width / 2 + (cell.left - this.mouse.animatex) - 4, cell.height / 2 + cell.top + 5);
                break;
            case "LEFT":
                ctx.fillText(cell.data, cell.left - this.mouse.animatex + 5, cell.height / 2 + cell.top + 5);
                break;
        }
        ctx.restore();
        ctx.strokeStyle = active ? Colors.PRIMARY + "AA" : "#959595aa";
        ctx.stroke();
        if (!active)
            return;
        ctx.beginPath();
        ctx.moveTo(cell.left - this.mouse.animatex - 4, cell.top + cell.height - 2);
        ctx.lineTo(cell.left - this.mouse.animatex + cell.width + 3, cell.top + cell.height - 2);
        ctx.strokeStyle = Colors.PRIMARY;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    /**
     * Paints the header based on the screen size
     */
    drawHeader() {
        let initialCol = this.binarySearch(this.header.data[0], this.mouse.scrollX);
        let finalCol = initialCol;
        if (!this.header.element)
            return;
        for (let j = initialCol; j < this.header.data[0].length; j++) {
            finalCol++;
            if (this.header.data[0][j].left >
                this.header.element.offsetWidth + this.mouse.scrollX)
                break;
        }
        if (finalCol > this.header.data[0].length - 1) {
            this.extendHeader(10);
        }
        this.clearHeader();
        this.header.data.forEach((row) => {
            for (let i = Math.max(initialCol - this.extracells, 0); i < Math.min(finalCol + this.extracells, this.header.data[0].length); i++) {
                this.drawHeaderCell(row[i]);
            }
        });
    }
    /**
     * Extends the header by specified count
     * @param count
     */
    extendHeader(count) {
        if (!this.header.data.length) {
            this.header.data.push([
                {
                    id: -1,
                    data: this.toLetters(1),
                    top: 0,
                    left: 0,
                    height: this.cellheight,
                    width: this.cellwidth,
                    row: 0,
                    col: 0,
                    isbold: false,
                    strokeStyle: Colors.STROKE,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "CENTER",
                    file: this.currentFile,
                },
            ]);
        }
        this.header.data.forEach((row, i) => {
            let prevColumns = row.length;
            for (let j = prevColumns; j < prevColumns + count; j++) {
                let left = row[j - 1].left + row[j - 1].width;
                let top = row[j - 1].top;
                let height = row[j - 1].height;
                let width = this.cellwidth;
                let cell = {
                    id: -1,
                    data: this.toLetters(j + 1),
                    top: top,
                    left: left,
                    height: height,
                    width: width,
                    row: i,
                    col: j,
                    isbold: false,
                    strokeStyle: Colors.STROKE,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "CENTER",
                    file: this.currentFile,
                };
                row.push(cell);
            }
        });
    }
    /**
     * Changes the width of the dragged cell
     * @param event Mousemove event
     */
    headerMouseMoveObserver(event) {
        const gap = 2;
        const headerElement = this.header.element;
        const headerStartCell = this.header.startCell;
        const headerEndCell = this.header.endCell;
        let { x } = this.getCoordinates(event, headerElement);
        for (let i = Math.max(1, headerStartCell.col - 1); i <= Math.min(this.header.data[0].length, headerEndCell.col); i++) {
            const edge = this.header.data[0][i].left;
            if (Math.max(edge - gap, 0) < x && x < edge + gap) {
                this.header.edgeDetected = true;
                headerElement.style.cursor = "e-resize";
                if (!this.header.isDragging) {
                    this.edgeCell = this.header.data[0][i - 1];
                    this.prevWidth = this.edgeCell.width;
                }
                break;
            }
            if (!this.header.isDragging)
                headerElement.style.cursor = "default";
            this.header.edgeDetected = false;
        }
        if (this.header.isDragging) {
            let diff = x - this.header.startx;
            let newWidth = this.prevWidth + diff;
            this.widthShifter(this.edgeCell, newWidth, this.header.data);
            this.widthShifter(this.edgeCell, newWidth, this.canvas.data);
        }
        this.render();
    }
    /**
     * Sets dragging to false
     */
    headerMouseUpObserver(event) {
        if (this.header.isDragging) {
            this.header.isDragging = false;
        }
        if (this.header.cell_extend) {
            const cell = this.getHeaderCell(event);
            if (cell) {
                let selectedArr = [];
                for (let i = 0; i < this.canvas.data.length; i++) {
                    const row = this.canvas.data[i];
                    selectedArr.push([row[cell.col]]);
                }
                this.selectionMode.selectedArea = selectedArr;
                this.header.selected_cells = cell.col;
                this.selectionMode.startSelectionCell = selectedArr[0][0];
                this.render();
            }
            this.header.cell_extend = false;
        }
    }
    /**
     * Sets the previews details of the dragged cell
     * @param event Mousedown event
     */
    headerMouseDownObserver(event) {
        if (this.header.edgeDetected) {
            this.inputBox.element.style.display = "none";
            this.header.isDragging = true;
            const { x } = this.getCoordinates(event);
            this.header.startx = x;
            this.prevWidth = this.edgeCell.width;
        }
        else {
            this.header.cell_extend = true;
        }
    }
    /**
     * Gets the cell using co-ordinates
     * @param event mouse event
     * @returns cell or false
     */
    getHeaderCell(event) {
        const { x } = this.getCoordinates(event, this.header.element);
        for (let i = this.header.startCell.col; i < this.header.data[0].length; i++) {
            let cell = this.header.data[0][i];
            if (cell.left < x && x < cell.left + cell.width) {
                return cell;
            }
        }
        return false;
    }
    /**
     * To clear the sidebar
     */
    clearSidebar() {
        let ctx = this.sidebar.ctx;
        if (!ctx || !this.sidebar.element)
            return;
        ctx.clearRect(0, 0, this.sidebar.element.offsetWidth, this.sidebar.element.offsetHeight);
    }
    /**
     * Paints the specified cell on the canvas
     * @param cell Specified cell
     * @param active If active cell
     * @returns
     */
    drawSidebarCell(cell, active) {
        let ctx = this.sidebar.ctx;
        if (!ctx)
            return;
        ctx.scale(this.mouse.scale, this.mouse.scale);
        ctx.restore();
        ctx.fillStyle = active ? Colors.PRIMARY + "22" : Colors.SECONDARY + "33";
        ctx.font = `${cell.fontSize}px ${cell.font}`;
        ctx.save();
        ctx.clearRect(cell.left - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width + this.offset * 2, cell.height + this.offset * 2);
        ctx.fillRect(cell.left, cell.top - this.mouse.animatey, cell.width, cell.height);
        ctx.save();
        ctx.beginPath();
        ctx.rect(cell.left - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width, cell.height);
        ctx.clip();
        ctx.fillStyle = active ? Colors.PRIMARY : "#000000";
        switch (cell.align) {
            case "CENTER":
                ctx.fillText(cell.data, cell.width / 2 + cell.left - 4, cell.height / 2 + (cell.top - this.mouse.animatey) + 5);
                break;
            case "LEFT":
                ctx.fillText(cell.data, cell.left + 5, cell.height / 2 + (cell.top - this.mouse.animatey) + 5);
                break;
        }
        ctx.restore();
        ctx.strokeStyle = active ? Colors.PRIMARY + "AA" : "#959595aa";
        ctx.stroke();
        if (!active)
            return;
        ctx.beginPath();
        ctx.moveTo(cell.left + cell.width - 2, cell.top - this.mouse.animatey - 4);
        ctx.lineTo(cell.left + cell.width - 2, cell.top - this.mouse.animatey + cell.height + 3);
        ctx.strokeStyle = Colors.PRIMARY;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    /**
     * Paints the sidebar according to screen size
     */
    drawSidebar() {
        let initialRow = this.binarySearch(this.sidebar.data.map((c) => c[0]), this.mouse.scrollY, true);
        let finalRow = initialRow;
        if (!this.sidebar.element)
            return;
        for (let j = initialRow; j < this.sidebar.data.length; j++) {
            finalRow++;
            if (this.sidebar.data[j][0].top >
                this.sidebar.element.offsetHeight + this.mouse.scrollY)
                break;
        }
        if (finalRow > this.sidebar.data.length - 1) {
            this.extendSidebar(10);
        }
        this.clearSidebar();
        for (let i = Math.max(initialRow - this.extracells, 0); i < Math.min(finalRow + this.extracells, this.sidebar.data.length); i++) {
            this.drawSidebarCell(this.sidebar.data[i][0]);
        }
    }
    /**
     * Extends the sidebar by specified count
     * @param count Extension count
     */
    extendSidebar(count) {
        if (!this.sidebar.data.length) {
            this.sidebar.data.push([
                {
                    id: -1,
                    data: String(1),
                    top: 0,
                    left: 0,
                    height: this.cellheight,
                    width: this.mincellwidth,
                    row: 0,
                    col: 0,
                    isbold: false,
                    strokeStyle: Colors.STROKE,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "CENTER",
                    file: this.currentFile,
                },
            ]);
        }
        let prevRows = this.sidebar.data.length;
        for (let j = prevRows; j < prevRows + count; j++) {
            let left = this.sidebar.data[j - 1][0].left;
            let top = this.sidebar.data[j - 1][0].top + this.sidebar.data[j - 1][0].height;
            let height = this.sidebar.data[j - 1][0].height;
            let width = this.mincellwidth;
            let cell = {
                id: -1,
                data: String(j + 1),
                top: top,
                left: left,
                height: height,
                width: width,
                row: j,
                col: 0,
                isbold: false,
                strokeStyle: Colors.STROKE,
                lineWidth: 1,
                fontSize: 16,
                font: "Arial",
                align: "CENTER",
                file: this.currentFile,
            };
            this.sidebar.data.push([cell]);
        }
    }
    /**
     * Triggers when user presses the keys
     *
     * For moving the active cell and executing other key based functions
     * @param event Keyboard event
     * @returns
     */
    windowKeypressHandler(event) {
        if (event.target === this.inputBox.element)
            return;
        this.inputBox.element.style.display = "none";
        this.keys.ctrl = event.ctrlKey;
        this.keys.alt = event.altKey;
        this.keys.shift = event.shiftKey;
        this.mouse.horizontal = event.shiftKey && event.altKey;
        if (event.key === "c" && event.ctrlKey) {
            this.copy();
            return;
        }
        if (event.key === "x" && event.ctrlKey) {
            this.cut();
            return;
        }
        if (event.key === "v" && event.ctrlKey) {
            this.paste();
            return;
        }
        if (this.inputBox.outMode)
            return;
        switch (event.key) {
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
                event.preventDefault();
                break;
            case "Enter":
                this.moveActiveCell("BOTTOM");
                break;
            case "Escape":
                this.selectionMode.selectedArea = [
                    [this.selectionMode.startSelectionCell],
                ];
                break;
            case "Delete":
                this.selectionMode.selectedArea.forEach((row) => row.forEach((c) => {
                    if (c.id !== -1)
                        this.API.deleteCell(c.id);
                    c.data = "";
                }));
                break;
            case "Backspace":
                if (this.selectionMode.selectedArea.length) {
                    this.selectionMode.selectedArea[0][0].data = "";
                    this.positionInputBox();
                    this.showInputBox();
                }
                break;
            default:
                if (event.target !== this.canvas.element)
                    return;
                if (event.key.match(/^\w$/)) {
                    this.positionInputBox();
                    this.showInputBox();
                }
                return;
        }
        if (!this.keys.ctrl && this.selectionMode.selectedArea.length > 1) {
            // this.selectionMode.selectedArea.forEach((row) =>
            //   row.forEach((c) => this.drawDataCell(c))
            // );
        }
        this.render();
    }
    /**
     * Triggers when user releases the keys
     * @param event Keyboard event
     * @returns
     */
    windowKeyupHandler(event) {
        if (event.target === this.inputBox.element)
            return;
        this.inputBox.element.style.display = "none";
        this.mouse.horizontal = event.shiftKey && event.altKey;
    }
    /**
     * Updates the dash offset (Recursive call)
     */
    marchingAnts() {
        this.selectionMode.lineDashOffset -= 1;
        this.render();
    }
    /**
     * Updates the scroll values when user moves the wheel
     * @param event Mouse wheel event
     * @param element Header or Sidebar
     * @returns void
     */
    scroller(event, element) {
        if (event.ctrlKey)
            return;
        let { deltaY } = event;
        switch (element) {
            case "HEADER":
                this.mouse.scrollX = Math.max(0, this.mouse.scrollX + deltaY);
                break;
            case "SIDEBAR":
                this.mouse.scrollY = Math.max(0, this.mouse.scrollY + (deltaY < 0 ? -90 : 90));
                break;
            default:
                if (this.mouse.horizontal) {
                    this.mouse.scrollX = Math.max(0, this.mouse.scrollX + deltaY);
                }
                else {
                    this.mouse.scrollY = Math.max(0, this.mouse.scrollY + (deltaY < 0 ? -90 : 90));
                }
                break;
        }
        this.render();
    }
    /**
     * To update the layout smoothly
     *
     * For smooth scrolling effect
     */
    smoothUpdate() {
        this.mouse.animatex +=
            (this.mouse.scrollX - this.mouse.animatex) * this.smoothingFactor;
        this.mouse.animatey +=
            (this.mouse.scrollY - this.mouse.animatey) * this.smoothingFactor;
        if (Math.round(this.mouse.animatex) !== this.mouse.scrollX ||
            Math.round(this.mouse.animatey) !== this.mouse.scrollY) {
            if (this.autoScrollbars)
                clearTimeout(this.autoScrollbars);
            if (Math.round(this.mouse.animatex) !== this.mouse.scrollX)
                this.autoScrollbars = setTimeout(() => {
                    this.scrollXWrapper.scroll(this.mouse.scrollX, 0);
                }, 10);
            else
                this.autoScrollbars = setTimeout(() => {
                    this.scrollYWrapper.scroll(0, this.mouse.scrollY);
                }, 10);
            this.render();
        }
    }
    /**
     * Gets the co-ordinates of the mouse relative to the canvas
     * @param event Mouse event
     * @param element Canvas to get the co-ordinates of
     * @returns Co-ordinates
     */
    getCoordinates(event, element) {
        if (!element) {
            element = this.canvas.element;
        }
        let rect = element.getBoundingClientRect();
        let x = Math.max(0, event.clientX - rect.left + this.mouse.scrollX) *
            this.mouse.scale;
        let y = Math.max(0, event.clientY - rect.top + this.mouse.scrollY) *
            this.mouse.scale;
        return { x, y };
    }
    /**
     * Gets the cell which is at the specified co-ordinates
     * @param event Event with co-ordinates
     * @param global Specify true if global search
     * @returns Cell, Row & Column
     */
    getCell(event, global = false) {
        const { x, y } = this.getCoordinates(event);
        for (let i = !global ? this.canvas.startCell.row : 0; i < this.canvas.data.length; i++) {
            const row = this.canvas.data[i];
            for (let j = !global ? Math.max(this.canvas.startCell.col - 1, 0) : 0; j < row.length; j++) {
                const cell = row[j];
                if (cell &&
                    cell.left < x &&
                    x <= cell.left + cell.width &&
                    cell.top < y &&
                    y <= cell.top + cell.height) {
                    return { cell, x, y };
                }
            }
        }
        return { cell: this.canvas.data[0][0], x, y };
    }
    /**
     * Creates the input box at active cell's position
     * @returns void
     */
    positionInputBox() {
        const { top, left, data } = this.selectionMode.selectedArea[0][0];
        this.inputBox.top = top - this.mouse.animatey;
        this.inputBox.left = left - this.mouse.animatex;
        this.inputBox.element.style.top = `${this.inputBox.top}px`;
        this.inputBox.element.style.left = `${this.inputBox.left}px`;
        this.inputBox.element.setAttribute("data-value", data);
        this.inputBox.element.value = data;
    }
    /**
     * Changes the visibility
     */
    showInputBox() {
        if (!this.selectionMode.selectedArea.length)
            return;
        let inputBox = this.inputBox.element;
        const { row, col, width, height, font, fontSize, data } = this.selectionMode.startSelectionCell;
        inputBox.style.display = `block`;
        inputBox.style.animationDuration = `0s`;
        inputBox.style.transitionDuration = `0s`;
        inputBox.style.width = `${width - 1}px`;
        inputBox.style.height = `${height - 1}px`;
        inputBox.style.font = `${font}`;
        inputBox.style.fontSize = `${fontSize}px`;
        inputBox.style.padding = `4px`;
        inputBox.style.border = `1px solid white`;
        inputBox.value = `${data}`;
        inputBox.focus();
        inputBox.onchange = (e) => {
            e.stopPropagation();
            this.canvas.data[row][col].data = e.target.value;
        };
    }
    /**
     * Moves active cell to specified direction
     * @param direction
     * @returns void
     */
    moveActiveCell(direction) {
        let activeCell = this.selectionMode.startSelectionCell;
        let { row, col } = activeCell;
        if (!activeCell)
            return;
        switch (direction) {
            case "TOP":
                this.selectionMode.selectedArea = [
                    [this.canvas.data[Math.max(row - 1, 0)][col]],
                ];
                if (activeCell.top - this.cellheight * 2 < this.mouse.scrollY) {
                    this.mouse.scrollY = Math.max(0, this.mouse.scrollY - this.cellheight);
                }
                break;
            case "LEFT":
                this.selectionMode.selectedArea = [
                    [this.canvas.data[row][Math.max(col - 1, 0)]],
                ];
                if (activeCell.left - this.cellwidth * 2 < this.mouse.scrollX) {
                    this.mouse.scrollX = Math.max(0, this.mouse.scrollX - this.cellwidth);
                }
                break;
            case "RIGHT":
                this.selectionMode.selectedArea = [
                    [
                        this.canvas.data[row][Math.min(this.canvas.data[0].length - 1, col + 1)],
                    ],
                ];
                if (activeCell.left + this.cellwidth * 2 >
                    this.mouse.scrollX + this.canvas.element.offsetWidth) {
                    this.mouse.scrollX += this.cellwidth;
                }
                break;
            case "BOTTOM":
                this.selectionMode.selectedArea = [
                    [
                        this.canvas.data[Math.min(this.canvas.data.length - 1, row + 1)][col],
                    ],
                ];
                if (activeCell.top + this.cellheight * 2 >
                    this.mouse.scrollY + this.canvas.element.offsetHeight) {
                    this.mouse.scrollY += this.cellheight;
                }
                break;
        }
        this.selectionMode.startSelectionCell =
            this.selectionMode.selectedArea[0][0];
        this.render();
    }
    /**
     * wrapper method for highlight selection
     */
    setSelection() {
        this.highlightSelectionCells();
        this.highlightClipboardCells();
    }
    /**
     * Highlights the selection
     * @returns void
     */
    highlightSelectionCells() {
        let context = this.canvas.ctx, activeSelection = false;
        const selectedArea = this.selectionMode.selectedArea;
        if (!context || !selectedArea.length)
            return;
        if (this.clipboard.data.length)
            activeSelection =
                selectedArea.length === this.clipboard.data.length &&
                    selectedArea[0].length === this.clipboard.data[0].length;
        const startCell = selectedArea[0][0];
        const endCell = selectedArea[selectedArea.length - 1][selectedArea[selectedArea.length - 1].length - 1];
        const leftX1 = Math.min(startCell.left, endCell.left, startCell.left + startCell.width, endCell.left + endCell.width);
        const leftX2 = Math.max(startCell.left, endCell.left, startCell.left + startCell.width, endCell.left + endCell.width);
        const topX1 = Math.min(startCell.top, endCell.top + endCell.height, startCell.top + startCell.height, endCell.top);
        const topX2 = Math.max(startCell.top, endCell.top + endCell.height, startCell.top + startCell.height, endCell.top);
        context.strokeStyle = Colors.PRIMARY;
        context.lineWidth = 4;
        context.translate(-this.mouse.animatex, -this.mouse.animatey);
        context.save();
        context.beginPath();
        context.moveTo(leftX1, topX1);
        context.lineTo(leftX2, topX1);
        context.lineTo(leftX2, topX2);
        context.lineTo(leftX1, topX2);
        context.lineTo(leftX1, topX1);
        context.fillStyle = Colors.PRIMARY + "11";
        context.fill();
        context.strokeStyle = "#fff";
        context.lineWidth = 2;
        // context.stroke()
        context.restore();
        this.drawDataCell(this.selectionMode.startSelectionCell);
        context.save();
        context.translate(-this.mouse.animatex, -this.mouse.animatey);
        context.beginPath();
        context.strokeStyle = Colors.PRIMARY;
        context.lineWidth = 4;
        context.moveTo(leftX1 - 4, topX1 - 2);
        context.lineTo(leftX2 + 1, topX1 - 2);
        context.lineTo(leftX2 + 1, topX2 + 1);
        context.lineTo(leftX1 - 2, topX2 + 1);
        context.lineTo(leftX1 - 2, topX1 - 2);
        context.save();
        context.stroke();
        context.restore();
        context.setTransform(1, 0, 0, 1, 0, 0);
        if (this.inputBox.element.style.display === "none") {
            context.beginPath();
            context.fillStyle = Colors.PRIMARY;
            context.rect(leftX2 - this.mouse.animatex - 4, topX2 - this.mouse.animatey - 4, 8, 8);
            context.fill();
            context.strokeStyle = "#ffffff";
            context.lineWidth = 2;
            context.stroke();
        }
        if (selectedArea.length) {
            selectedArea.forEach((row) => {
                this.drawSidebarCell(this.sidebar.data[row[0].row][0], true);
            });
            selectedArea[0].forEach((cell) => this.drawHeaderCell(this.header.data[0][cell.col], true));
        }
    }
    highlightClipboardCells() {
        let context = this.canvas.ctx;
        const selectedArea = this.clipboard.data;
        if (!context || !selectedArea.length)
            return;
        const startCell = selectedArea[0][0];
        const endCell = selectedArea[selectedArea.length - 1][selectedArea[selectedArea.length - 1].length - 1];
        const leftX1 = Math.min(startCell.left, endCell.left, startCell.left + startCell.width, endCell.left + endCell.width);
        const leftX2 = Math.max(startCell.left, endCell.left, startCell.left + startCell.width, endCell.left + endCell.width);
        const topX1 = Math.min(startCell.top, endCell.top + endCell.height, startCell.top + startCell.height, endCell.top);
        const topX2 = Math.max(startCell.top, endCell.top + endCell.height, startCell.top + startCell.height, endCell.top);
        context.translate(-this.mouse.animatex, -this.mouse.animatey);
        context.beginPath();
        context.strokeStyle = Colors.PRIMARY;
        context.lineWidth = 4;
        if (this.clipboard) {
            context.setLineDash([6, 2]);
            context.lineDashOffset = this.selectionMode.lineDashOffset;
        }
        context.moveTo(leftX1, topX1);
        context.lineTo(leftX2 - 1, topX1);
        context.lineTo(leftX2 - 1, topX2);
        context.lineTo(leftX1, topX2 - 1);
        context.lineTo(leftX1, topX1 - 1);
        context.save();
        context.stroke();
        context.restore();
        context.setTransform(1, 0, 0, 1, 0, 0);
    }
    /**
     * Creates the given chart
     */
    createChart(type) {
        const chartConfig = {
            height: 300,
            width: 300,
            position: { x: 10, y: 10 },
        };
        const chart = new AppChart(this.selectionMode.selectedArea, this.inputBoxWrapper, chartConfig, type, this);
        chart.create();
    }
    /**
     * Searches the nearest left position of the cell specified mouse position
     * @param arr Array of cells
     * @param x Specified position
     * @param vertical for searching the row
     * @returns Nearest cell's left (top if vertical search)
     */
    binarySearch(arr, x, vertical) {
        let low = 0;
        let high = arr.length - 1;
        let mid = 0;
        while (high >= low) {
            mid = low + Math.floor((high - low) / 2);
            if ((vertical ? arr[mid].top : arr[mid].left) == x)
                return mid;
            if ((vertical ? arr[mid].top : arr[mid].left) > x)
                high = mid - 1;
            else
                low = mid + 1;
        }
        return mid;
    }
    /**
     * Converts specified integer to characters
     * @param num A number to convert to characters
     * @returns Characters like: A,B,C..., AA, AB...
     */
    toLetters(num) {
        var mod = num % 26, pow = (num / 26) | 0, out = mod ? String.fromCharCode(64 + mod) : (--pow, "Z");
        return pow ? this.toLetters(pow) + out : out;
    }
    /**
     * To check if a cell is same as another cell
     * @param cell
     * @param targetcell
     * @returns boolean
     */
    checkSameCell(cell, targetcell) {
        const { top, left } = cell;
        return targetcell.top === top && targetcell.left == left;
    }
    /**
     * To get all cells within the start and end cell of the selection
     * @param start Start cell of the selection
     * @param end End cell of the selection
     * @returns Array of cells
     */
    getCellsArea(start, end) {
        let { row: starty, col: startx } = start;
        let { row: endy, col: endx } = end;
        let startX = Math.min(startx, endx);
        let endX = Math.max(startx, endx);
        let startY = Math.min(starty, endy);
        let endY = Math.max(starty, endy);
        let newSelection = [];
        for (let i = startY; i <= endY; i++) {
            let rows = [];
            for (let j = startX; j <= endX; j++) {
                rows.push(this.canvas.data[i][j]);
            }
            newSelection.push(rows);
        }
        return newSelection;
    }
    /**
     * Repaints the first cell of the selection for white background color
     */
    setActiveCell() {
        this.drawDataCell(this.selectionMode.selectedArea[0][0]);
    }
    /**
     * Changes the width of the given cell and corresponding columns.
     *
     * Shifts the left of the following cells
     * @param cell Cell
     * @param width New width of the given cell
     * @param data 2D cell array
     */
    async widthShifter(cell, width, data) {
        if (width < 60) {
            width = 60;
        }
        data.forEach((row) => {
            let widthChanged = false;
            for (let i = this.canvas.startCell.col; i < row.length; i++) {
                const c = row[i];
                if (!widthChanged) {
                    if (c.left === cell.left) {
                        c.width = width;
                        widthChanged = true;
                    }
                }
                else {
                    c.left = row[i - 1].left + row[i - 1].width;
                }
            }
        });
    }
    /**
     * Calculates statistics of the current selection.
     *
     * Returns Infinity as value if multiple data types
     * @returns Count, Max, Min, Sum, Average
     */
    getStats() {
        let min = Infinity, max = -Infinity, avg = -Infinity, sum = 0, count = 0, ncount = 0;
        this.selectionMode.selectedArea.forEach((row) => {
            row.forEach((cell) => {
                count++;
                if (cell.data.trim().match(/^\-?\d+$/)) {
                    let n = parseFloat(cell.data);
                    if (!Number.isNaN(n)) {
                        min = n < min ? n : min;
                        max = n > max ? n : max;
                        sum += n;
                        ncount++;
                    }
                }
            });
        });
        avg = sum / ncount;
        if (!ncount)
            sum = Infinity;
        return { count, max, min, sum, avg };
    }
    /**
     * Copies the cells to clipboard and sets the selected cells in 2d array
     */
    copy() {
        this.clipboard.data = this.selectionMode.selectedArea;
        this.clipboard.mode = "COPY";
        const csvString = this.generateCSVString(this.selectionMode.selectedArea);
        navigator.clipboard.writeText(csvString);
        this.render();
    }
    cut() {
        this.clipboard.data = this.selectionMode.selectedArea;
        this.clipboard.mode = "CUT";
        const csvString = this.generateCSVString(this.selectionMode.selectedArea);
        navigator.clipboard.writeText(csvString);
        this.render();
    }
    paste() {
        let startCell = this.selectionMode.startSelectionCell;
        /**
         * Check for data overflow
         */
        if (this.canvas.data.length - startCell.row > this.clipboard.data.length) {
            this.extendCells(100, "Y");
        }
        if (!this.clipboard.data.length)
            return;
        if (this.canvas.data[0].length - startCell.col >
            this.clipboard.data[0].length) {
            this.extendCells(100, "X");
        }
        let newSelectionArea = [];
        for (let i = 0; i < this.clipboard.data.length; i++) {
            const row = this.clipboard.data[i];
            const newSelectionAreaRow = [];
            for (let j = 0; j < row.length; j++) {
                const col = row[j];
                const data = col.data;
                this.canvas.data[startCell.row + i][startCell.col + j].data = data;
                this.API.createOrUpdateCell({
                    ...this.canvas.data[startCell.row + i][startCell.col + j],
                    data,
                });
                if (this.clipboard.mode === "CUT") {
                    col.data = "";
                    if (col.id !== -1)
                        this.API.deleteCell(col.id);
                    col.id = -1;
                }
                newSelectionAreaRow.push(this.canvas.data[startCell.row + i][startCell.col + j]);
            }
            newSelectionArea.push(newSelectionAreaRow);
        }
        this.clipboard.mode = null;
        this.selectionMode.selectedArea = newSelectionArea;
        this.clipboard.data = [];
        this.render();
    }
    sort(desc = false) {
        let selectedArea = this.selectionMode.selectedArea;
        if (!selectedArea.length)
            return;
        let tMat = [];
        tMat = [...new Array(selectedArea[0].length)];
        tMat = tMat.map(() => [...new Array(selectedArea.length)]);
        for (let i = 0; i < selectedArea[0].length; i++) {
            for (let j = 0; j < selectedArea.length; j++) {
                tMat[i][j] = selectedArea[j][i];
            }
        }
        this.render();
    }
    find(text) {
        this.findReplace.find = text;
        this.findReplace.cells = [];
        for (let i = 0; i < this.canvas.data.length; i++) {
            const row = this.canvas.data[i];
            for (let j = 0; j < row.length; j++) {
                const cell = row[j];
                if (cell.data.match(String(text))) {
                    this.findReplace.cells.push(cell);
                }
            }
        }
        return {
            count: this.findReplace.cells.length,
            goto: (target) => {
                if (target > 0 && target <= this.findReplace.cells.length) {
                    this.selectionMode.selectedArea = [
                        [this.findReplace.cells[target - 1]],
                    ];
                    this.selectionMode.startSelectionCell =
                        this.findReplace.cells[target - 1];
                    this.render();
                }
            },
        };
    }
    replace() { }
    /**
     * To stop window events for outside operations
     * @param mode boolean
     */
    outsideInputMode(mode) {
        this.inputBox.outMode = mode;
    }
    /**
     * Generates CSV string from 2D array
     * @param data 2D array input
     * @returns CSV string
     */
    generateCSVString(data) {
        return data.map((row) => row.map((col) => col.data).join(",")).join("\n");
    }
    getExcelAPIUrls(host) {
        return {
            createOrUpdateCell: (data) => fetch(host + data.id, {
                method: "PUT",
                body: JSON.stringify({
                    ...data,
                }),
                headers: {
                    "Content-Type": "application/json",
                    "Response-Type": "application/json",
                },
            }).then((response) => response.json()),
            deleteCell: async (id) => {
                await fetch(host + id, {
                    method: "DELETE",
                });
            },
        };
    }
    fetchData() {
        if (this.currentFile) {
            fetch("http://localhost:5165/api/Cells/file/" + this.currentFile)
                .then((response) => response.json())
                .then((data) => {
                this.fillData(data);
            });
        }
    }
}
class AppChart {
    constructor(data, wrapper, config, type, canvaContext) {
        this.dragConfig = {
            startCords: {
                x: 0,
                y: 0,
            },
            prevPos: {
                x: 0,
                y: 0,
            },
            active: false,
        };
        this.resizeConfig = {
            active: false,
            currentMode: 0,
            height: 0,
            width: 0,
            startPos: {
                x: 0,
                y: 0,
            },
            startCords: {
                x: 0,
                y: 0,
            },
        };
        this.mouse = {
            x: 0,
            y: 0,
        };
        this.data = this.parseData(data);
        this.type = type;
        this.config = config;
        this.wrapper = wrapper;
        this.context = canvaContext;
    }
    render() {
        if (this.busy)
            return;
        this.busy = requestAnimationFrame(() => {
            this.busy = null;
            this.setPosition();
        });
    }
    setPosition() {
        this.chartWrapper.style.top = `${this.config.position.y}px`;
        this.chartWrapper.style.left = `${this.config.position.x}px`;
        this.chartWrapper.style.width = `${this.config.width}px`;
        this.chartWrapper.style.height = `${this.config.height}px`;
    }
    create() {
        this.createMarkup();
        this.initChart();
        this.attachEvents();
    }
    createMarkup() {
        const chartWrapper = document.createElement("div");
        const chartcanva = document.createElement("canvas");
        const ctx = chartcanva.getContext("2d");
        chartWrapper.appendChild(chartcanva);
        chartWrapper.style.position = "absolute";
        chartWrapper.style.backgroundColor = "white";
        chartWrapper.style.cursor = "all-scroll";
        chartWrapper.style.padding = "16px";
        chartWrapper.style.boxShadow = "16px";
        chartWrapper.style.border = "1px solid #959595";
        chartWrapper.style.top = `${this.config.position.y}px`;
        chartWrapper.style.left = `${this.config.position.x}px`;
        chartWrapper.style.width = `${this.config.width}px`;
        chartWrapper.style.height = `${this.config.height}px`;
        chartcanva.style.height = `${chartWrapper.offsetHeight}px`;
        chartcanva.style.width = `${chartWrapper.offsetWidth}px`;
        chartWrapper.style.animationDuration = "0s";
        chartWrapper.style.transitionDuration = "0s";
        this.ctx = ctx;
        this.chartWrapper = chartWrapper;
        this.wrapper.appendChild(chartWrapper);
    }
    attachEvents() {
        window.addEventListener("mousedown", this.wrapperMouseDown.bind(this));
        window.addEventListener("mousemove", this.wrapperMouseMove.bind(this));
        window.addEventListener("mouseup", this.wrapperMouseUp.bind(this));
        window.addEventListener("mouseout", () => {
            this.dragConfig.active = false;
        });
    }
    initChart() {
        if (!this.ctx)
            return;
        const chartConfig = {
            type: this.type.toLowerCase(),
            data: this.data,
            responsive: true,
        };
        // // @ts-ignore
        // Chart.defaults.backgroundColor = "#9BD0F5";
        // // @ts-ignore
        // Chart.defaults.borderColor = "#36A2EB";
        // // @ts-ignore
        // Chart.defaults.color = "#000";
        // @ts-ignore
        new Chart(this.ctx, chartConfig);
    }
    checkInteraction(event) {
        const { x, y } = this.config.position;
        if (this.resizeConfig.active)
            return;
        if (x + this.chartWrapper.offsetWidth - this.mouse.x < 10) {
            this.resizeConfig.currentMode = 1;
            this.chartWrapper.style.cursor = "e-resize";
        }
        else if (y + this.chartWrapper.offsetHeight - this.mouse.y < 10) {
            this.resizeConfig.currentMode = 2;
            this.chartWrapper.style.cursor = "n-resize";
        }
        else {
            this.resizeConfig.currentMode = 0;
            this.chartWrapper.style.cursor = "all-scroll";
        }
    }
    /**
     * Converts 2D array to Chart.js config object
     * @param data
     * @returns
     */
    parseData(data) {
        if (!data.length)
            return { labels: [], datasets: [] };
        const labels = data.map((_, i) => i + 1);
        const datasets = [];
        for (let i = 0; i < data[0].length; i++) {
            const dataset = {
                label: data[0][i].data,
                data: [],
                borderWidth: 1,
                backgroundColor: [
                    "rgba(255, 99, 132, 0.2)",
                    "rgba(255, 159, 64, 0.2)",
                    "rgba(255, 205, 86, 0.2)",
                    "rgba(75, 192, 192, 0.2)",
                    "rgba(54, 162, 235, 0.2)",
                    "rgba(153, 102, 255, 0.2)",
                    "rgba(201, 203, 207, 0.2)",
                ],
            };
            for (let j = 0; j < data.length; j++) {
                if (j === 0)
                    continue;
                const cell = data[j][i];
                dataset.data.push(parseInt(cell.data));
            }
            datasets.push(dataset);
        }
        return { labels, datasets };
    }
    wrapperMouseDown(event) {
        const { x, y } = this.context.getCoordinates(event);
        if (this.resizeConfig.currentMode) {
            this.resizeConfig.active = true;
            this.resizeConfig.startCords = { x, y };
            this.resizeConfig.startPos = this.config.position;
            this.resizeConfig.width = this.chartWrapper.offsetWidth;
            this.resizeConfig.height = this.chartWrapper.offsetHeight;
        }
        else {
            this.dragConfig.startCords = { x, y };
            // this.dragConfig.prevPos = this.config.position;
            this.dragConfig.active = true;
        }
    }
    wrapperMouseMove(event) {
        const { x, y } = this.context.getCoordinates(event);
        if (this.dragConfig.active) {
            const newLeft = this.dragConfig.prevPos.x + x - this.dragConfig.startCords.x;
            const newTop = this.dragConfig.prevPos.y + y - this.dragConfig.startCords.y;
            this.config.position.x = Math.max(newLeft, 0);
            this.config.position.y = Math.max(newTop, 0);
            this.render();
        }
        this.mouse.x = x;
        this.mouse.y = y;
        this.checkInteraction(event);
        if (this.resizeConfig.active) {
            const { x, y } = this.context.getCoordinates(event);
            if (this.resizeConfig.currentMode === 1) {
                const diffX = x - this.resizeConfig.startCords.x;
                const newWidth = this.resizeConfig.width + diffX;
                this.config.width = Math.max(200, newWidth);
            }
            if (this.resizeConfig.currentMode === 2) {
                const diffY = y - this.resizeConfig.startCords.y;
                const newHeight = this.resizeConfig.height + diffY;
                this.config.height = Math.max(200, newHeight);
            }
            this.render();
        }
    }
    wrapperMouseUp() {
        this.dragConfig.active = false;
        this.resizeConfig.active = false;
        this.resizeConfig.currentMode = 0;
        // this.dragConfig.prevPos = this.config.position
    }
}
