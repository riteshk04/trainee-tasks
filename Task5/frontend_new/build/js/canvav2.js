"use strict";
class ExcelV2 {
    constructor(parentElement, csv) {
        this.primaryColor = "#03723c";
        this.secondaryColor = "#959595";
        this.strokeColor = "#dadada";
        this.offset = 0.5;
        this.canvas = { ctx: null, data: [], element: null };
        this.header = { ctx: null, data: [], element: null };
        this.sidebar = { ctx: null, data: [], element: null };
        this.mouse = { x: 0, y: 0, startx: 0, starty: 0, up: false, horizontal: false, scrollX: 0, scrollY: 0, animatex: 0, animatey: 0, pscrollX: 100, pscrollY: 100 };
        this.cellheight = 30;
        this.cellwidth = 100;
        this.mincellwidth = 60;
        this.dx = 10;
        this.dy = 10;
        this.scrolling = false;
        this.wrapper = parentElement;
        this.csvString = csv.trim();
        this.init();
    }
    init() {
        this.createMarkup();
        this.canvas.data = this.createData();
        this.extendHeader(100);
        this.extendSidebar(100);
        this.attachEvents();
        this.smoothUpdate();
        this.drawHeader();
        this.drawSidebar();
        this.drawData();
    }
    // rendering
    createMarkup() {
        this.wrapper.style.boxSizing = "border-box";
        this.wrapper.style.position = "relative";
        this.wrapper.style.fontSize = "0";
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
        emptyBox.style.background = this.secondaryColor + "33";
        emptyBox.style.borderRight = `0.5px solid ${this.secondaryColor + "aa"}`;
        emptyBox.style.borderBottom = `0.5px solid ${this.secondaryColor + "aa"}`;
        let headerElement = document.createElement("canvas");
        headerElement.width = this.wrapper.offsetWidth - this.mincellwidth;
        headerElement.height = this.cellheight;
        headerElement.style.boxSizing = "border-box";
        this.wrapper.appendChild(emptyBox);
        this.wrapper.appendChild(headerElement);
        let sidebarElement = document.createElement("canvas");
        sidebarElement.width = this.mincellwidth;
        sidebarElement.height = this.wrapper.offsetHeight - this.cellheight;
        let inputBoxWrapper = document.createElement("div");
        inputBoxWrapper.style.position = "relative";
        inputBoxWrapper.style.display = "inline-block";
        let canvasElement = document.createElement("canvas");
        canvasElement.width = this.wrapper.offsetWidth - this.mincellwidth;
        canvasElement.height = this.wrapper.offsetHeight - this.cellheight;
        canvasElement.style.cursor = "cell";
        inputBoxWrapper.appendChild(canvasElement);
        inputBoxWrapper.appendChild(inputBox);
        this.wrapper.appendChild(sidebarElement);
        this.wrapper.appendChild(inputBoxWrapper);
        this.canvas.ctx = canvasElement.getContext("2d");
        this.header.ctx = headerElement.getContext("2d");
        this.sidebar.ctx = sidebarElement.getContext("2d");
        // canvas.addEventListener("wheel", (e) => this.scroller(e, canvas))
        // sidebar.addEventListener("wheel", (e) => this.scroller(e, sidebar))
        // header.addEventListener("wheel", (e) => this.scroller(e, header))
        this.canvas.element = canvasElement;
        this.sidebar.element = sidebarElement;
        this.header.element = headerElement;
        this.inputBox = inputBox;
        this.canvas.element.width = this.wrapper.offsetWidth - this.mincellwidth;
        this.canvas.element.height = this.wrapper.offsetHeight - this.cellheight;
        this.header.element.width = this.wrapper.offsetWidth - this.mincellwidth;
        this.sidebar.element.height = this.wrapper.offsetHeight - this.cellheight;
    }
    render() {
        requestAnimationFrame(this.render.bind(this));
        this.smoothUpdate();
        this.drawHeader();
        this.drawSidebar();
        this.drawData();
        this.drawHeaderCell(this.header.data[0][0], true);
        this.drawSidebarCell(this.sidebar.data[0][0], true);
        this.drawDataCell(this.canvas.data[0][0], true);
        // this.clearDataCell(this.canvas.data[0][1])
    }
    resizer() {
        const resizeEventHandler = function () {
            this.canvas.element.width = this.wrapper.offsetWidth - this.mincellwidth;
            this.canvas.element.height = this.wrapper.offsetHeight - this.cellheight;
            this.header.element.width = this.wrapper.offsetWidth - this.cellwidth;
            this.sidebar.element.height = this.wrapper.offsetHeight - this.cellheight;
            this.drawData();
            this.drawHeader();
            this.drawSidebar();
        };
        window.addEventListener("resize", resizeEventHandler.bind(this));
    }
    // data
    createData() {
        let data = [];
        let rows = this.csvString.split("\n");
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
                    strokeStyle: this.strokeColor,
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial",
                    align: "LEFT"
                };
                dataRow.push(cell);
            });
            data.push(dataRow);
        });
        return data;
    }
    clearData() {
        let ctx = this.canvas.ctx;
        if (!ctx || !this.canvas.element)
            return;
        ctx.clearRect(0, 0, this.canvas.element.offsetWidth, this.canvas.element.offsetHeight);
    }
    clearDataCell(cell) {
        let ctx = this.canvas.ctx;
        if (!ctx)
            return;
        let prev = this.canvas.data[0][Math.max(0, cell.col - 1)];
        let next = this.canvas.data[0][Math.min(this.canvas.data[0].length, cell.col + 1)];
        ctx.restore();
        for (let i = Math.max(0, cell.row - 1); i <= Math.min(this.canvas.data.length, cell.row + 1); i++) {
            for (let j = Math.max(0, cell.col - 1); j <= Math.min(this.canvas.data[0].length, cell.col + 1); j++) {
                const cell = this.canvas.data[i][j];
                ctx.clearRect(cell.left, cell.top, cell.width, cell.height);
                this.drawDataCell(cell);
                ctx.save();
            }
        }
    }
    drawDataCell(cell, active, selected) {
        let ctx = this.canvas.ctx;
        if (!ctx)
            return;
        ctx.restore();
        ctx.fillStyle = selected ? this.primaryColor + "22" : "#ffffff";
        ctx.font = `${cell.fontSize}px ${cell.font}`;
        ctx.save();
        ctx.clearRect(cell.left - this.mouse.animatex - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width + (this.offset * 2), cell.height + (this.offset * 2));
        ctx.fillRect(cell.left - this.mouse.animatex, cell.top - this.mouse.animatey, cell.width, cell.height);
        ctx.save();
        ctx.beginPath();
        ctx.rect(cell.left - this.mouse.animatex - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width, cell.height);
        ctx.clip();
        ctx.fillStyle = "#000000";
        switch (cell.align) {
            case "CENTER":
                ctx.fillText(cell.data, (cell.width / 2 + (cell.left - this.mouse.animatex) - 4), (cell.height / 2 + (cell.top - this.mouse.animatey)) + 5);
                break;
            case "LEFT":
                ctx.fillText(cell.data, (cell.left - this.mouse.animatex) + 5, (cell.height / 2 + (cell.top - this.mouse.animatey)) + 5);
                break;
        }
        ctx.restore();
        ctx.strokeStyle = active ? this.primaryColor + "AA" : "#959595aa";
        ctx.stroke();
        if (!active)
            return;
        ctx.beginPath();
        ctx.rect(cell.left - 2, cell.top - 2, cell.width + 4, cell.height + 4);
        ctx.strokeStyle = this.primaryColor;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    drawData() {
        let initialCol = this.binarySearch(this.canvas.data[0], this.mouse.scrollX);
        let initialRow = this.binarySearch(this.canvas.data.map(d => d[0]), this.mouse.scrollY, true);
        let finalRow = initialRow;
        let finalCol = 0;
        if (!this.canvas.element)
            return;
        for (let j = initialRow; j < this.canvas.data.length; j++) {
            finalCol = initialCol;
            finalRow++;
            for (let j = initialCol; j < this.canvas.data[0].length; j++) {
                finalCol++;
                if (this.canvas.data[0][j].left > this.canvas.element.offsetWidth + this.mouse.scrollX)
                    break;
            }
            if (this.canvas.data[j][0].top > this.canvas.element.offsetHeight + this.mouse.scrollY)
                break;
        }
        this.clearData();
        for (let i = Math.max(initialRow - 3, 0); i < finalRow; i++) {
            for (let j = Math.max(initialCol - 1, 0); j < finalCol; j++) {
                this.drawDataCell(this.canvas.data[i][j]);
            }
        }
        ;
    }
    extendData(count, axis) {
        if (axis == "X") {
            this.canvas.data.forEach((row, i) => {
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
                        strokeStyle: this.strokeColor,
                        lineWidth: 1,
                        fontSize: 16,
                        font: "Arial",
                        align: "LEFT"
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
                    };
                    row.push(cell);
                }
                this.canvas.data.push(row);
            }
        }
    }
    // events
    attachEvents() {
        this.header.element.addEventListener("wheel", (e) => this.scroller(e, "HEADER"));
        this.sidebar.element.addEventListener("wheel", (e) => this.scroller(e, "SIDEBAR"));
    }
    // canvas methods
    clearHeader() {
        let ctx = this.header.ctx;
        if (!ctx || !this.header.element)
            return;
        ctx.clearRect(0, 0, this.header.element.offsetWidth, this.header.element.offsetHeight);
    }
    clearHeaderCell(cell) {
        let ctx = this.header.ctx;
        if (!ctx)
            return;
        let prev = this.header.data[0][Math.max(0, cell.col - 1)];
        let next = this.header.data[0][Math.min(this.header.data[0].length, cell.col + 1)];
        ctx.restore();
        ctx.clearRect(prev.left, prev.top, prev.width, prev.height);
        ctx.clearRect(next.left, next.top, next.width, next.height);
        ctx.clearRect(cell.left, cell.top, cell.width, cell.height);
        ctx.save();
        this.drawHeaderCell(prev);
        this.drawHeaderCell(next);
    }
    drawHeaderCell(cell, active) {
        let ctx = this.header.ctx;
        if (!ctx)
            return;
        ctx.restore();
        ctx.fillStyle = active ? this.primaryColor + "22" : this.secondaryColor + "33";
        ctx.font = `${cell.fontSize}px ${cell.font}`;
        ctx.save();
        ctx.clearRect(cell.left - this.mouse.animatex - this.offset, cell.top - this.offset, cell.width + (this.offset * 2), cell.height + (this.offset * 2));
        ctx.fillRect(cell.left - this.mouse.animatex, cell.top, cell.width, cell.height);
        ctx.save();
        ctx.beginPath();
        ctx.rect(cell.left - this.mouse.animatex - this.offset, cell.top - this.offset, cell.width + (this.offset * 2), cell.height);
        ctx.clip();
        ctx.fillStyle = active ? this.primaryColor : "#000000";
        switch (cell.align) {
            case "CENTER":
                ctx.fillText(cell.data, (cell.width / 2 + (cell.left - this.mouse.animatex) - 4), (cell.height / 2 + (cell.top)) + 5);
                break;
            case "LEFT":
                ctx.fillText(cell.data, (cell.left - this.mouse.animatex) + 5, (cell.height / 2 + (cell.top)) + 5);
                break;
        }
        ctx.restore();
        ctx.strokeStyle = active ? this.primaryColor + "AA" : "#959595aa";
        ctx.stroke();
        if (!active)
            return;
        ctx.beginPath();
        ctx.moveTo(cell.left - this.mouse.animatex - 4, cell.top + cell.height - 2);
        ctx.lineTo(cell.left - this.mouse.animatex + cell.width + 4, cell.top + cell.height - 2);
        ctx.strokeStyle = this.primaryColor;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    drawHeader() {
        let initialCol = this.binarySearch(this.header.data[0], this.mouse.scrollX);
        let finalCol = initialCol;
        if (!this.header.element)
            return;
        for (let j = initialCol; j < this.header.data[0].length; j++) {
            finalCol++;
            if (this.header.data[0][j].left > this.header.element.offsetWidth + this.mouse.scrollX)
                break;
        }
        if (finalCol > this.header.data[0].length - 1) {
            this.extendHeader(10);
        }
        this.clearHeader();
        this.header.data.forEach(row => {
            for (let i = Math.max(initialCol - 1, 0); i < finalCol; i++) {
                this.drawHeaderCell(row[i]);
            }
        });
    }
    extendHeader(count) {
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
                };
                row.push(cell);
            }
        });
    }
    // sidebar methods
    clearSidebar() {
        let ctx = this.sidebar.ctx;
        if (!ctx || !this.sidebar.element)
            return;
        ctx.clearRect(0, 0, this.sidebar.element.offsetWidth, this.sidebar.element.offsetHeight);
    }
    clearSidebarCell(cell) {
        let ctx = this.sidebar.ctx;
        if (!ctx)
            return;
        let prev = this.sidebar.data[0][Math.max(0, cell.col - 1)];
        let next = this.sidebar.data[0][Math.min(this.sidebar.data[0].length, cell.col + 1)];
        ctx.restore();
        ctx.clearRect(prev.left, prev.top, prev.width, prev.height);
        ctx.clearRect(next.left, next.top, next.width, next.height);
        ctx.clearRect(cell.left, cell.top, cell.width, cell.height);
        ctx.save();
        this.drawHeaderCell(prev);
        this.drawHeaderCell(next);
    }
    drawSidebarCell(cell, active) {
        let ctx = this.sidebar.ctx;
        if (!ctx)
            return;
        ctx.restore();
        ctx.fillStyle = active ? this.primaryColor + "22" : this.secondaryColor + "33";
        ctx.font = `${cell.fontSize}px ${cell.font}`;
        ctx.save();
        ctx.clearRect(cell.left - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width + (this.offset * 2), cell.height + (this.offset * 2));
        ctx.fillRect(cell.left, cell.top - this.mouse.animatey, cell.width, cell.height);
        ctx.save();
        ctx.beginPath();
        ctx.rect(cell.left - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width, cell.height);
        ctx.clip();
        ctx.fillStyle = active ? this.primaryColor : "#000000";
        switch (cell.align) {
            case "CENTER":
                ctx.fillText(cell.data, (cell.width / 2 + (cell.left) - 4), (cell.height / 2 + (cell.top - this.mouse.animatey)) + 5);
                break;
            case "LEFT":
                ctx.fillText(cell.data, (cell.left) + 5, (cell.height / 2 + (cell.top - this.mouse.animatey)) + 5);
                break;
        }
        ctx.restore();
        ctx.strokeStyle = active ? this.primaryColor + "AA" : "#959595aa";
        ctx.stroke();
        if (!active)
            return;
        ctx.beginPath();
        ctx.moveTo(cell.left + cell.width - 2, cell.top - this.mouse.animatey - 4);
        ctx.lineTo(cell.left + cell.width - 2, cell.top - this.mouse.animatey + cell.height + 4);
        ctx.strokeStyle = this.primaryColor;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    drawSidebar() {
        let initialRow = this.binarySearch(this.sidebar.data.map(c => c[0]), this.mouse.scrollY, true);
        let finalRow = initialRow;
        if (!this.sidebar.element)
            return;
        for (let j = initialRow; j < this.sidebar.data.length; j++) {
            finalRow++;
            if (this.sidebar.data[j][0].top > this.sidebar.element.offsetHeight + this.mouse.scrollY)
                break;
        }
        if (finalRow > this.sidebar.data.length - 1) {
            this.extendSidebar(10);
        }
        this.clearSidebar();
        for (let i = Math.max(initialRow - 3, 0); i < finalRow; i++) {
            this.drawSidebarCell(this.sidebar.data[i][0]);
        }
    }
    extendSidebar(count) {
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
            ]);
        }
        let prevRows = this.sidebar.data.length;
        for (let j = prevRows; j < prevRows + count; j++) {
            let left = this.sidebar.data[j - 1][0].left;
            let top = this.sidebar.data[j - 1][0].top + this.sidebar.data[j - 1][0].height;
            let height = this.sidebar.data[j - 1][0].height;
            let width = this.mincellwidth;
            let cell = {
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
            };
            this.sidebar.data.push([cell]);
        }
    }
    // scroll
    scroller(event, element) {
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
        this.scrolling = true;
    }
    smoothUpdate() {
        let smoothx = this.mouse.animatex;
        let smoothy = this.mouse.animatey;
        if (smoothx != this.mouse.scrollX) {
            if (smoothx > this.mouse.scrollX) {
                this.mouse.animatex = Math.max(0, smoothx - this.dx);
            }
            else {
                this.mouse.animatex = Math.max(0, smoothx + this.dx);
            }
        }
        if (smoothy != this.mouse.scrollY) {
            if (smoothy > this.mouse.scrollY) {
                this.mouse.animatey = Math.max(0, smoothy - this.dy);
            }
            else {
                this.mouse.animatey = Math.max(0, smoothy + this.dy);
            }
        }
    }
    // extras
    binarySearch(arr, x, vertical) {
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
    toLetters(num) {
        var mod = num % 26, pow = num / 26 | 0, out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
        return pow ? this.toLetters(pow) + out : out;
    }
}
