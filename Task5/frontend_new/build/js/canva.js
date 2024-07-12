"use strict";
var Excel = /** @class */ (function () {
    function Excel(parentElement, csv) {
        this.header = null;
        this.sidebar = null;
        this.ctx = null;
        this.cellheight = 30;
        this.cellwidth = 100;
        this.data = [];
        this.wrapper = parentElement;
        this.csv = csv.trim();
    }
    Excel.prototype.init = function () {
        this.createData();
        this.createMarkup();
        this.drawHeader();
        this.drawGrid();
    };
    Excel.prototype.createMarkup = function () {
        this.wrapper.style.boxSizing = "border-box";
        var header = document.createElement("canvas");
        header.width = this.wrapper.offsetWidth;
        header.height = this.cellheight;
        this.wrapper.appendChild(header);
        var sidebar = document.createElement("canvas");
        sidebar.width = this.cellwidth;
        sidebar.height = this.wrapper.offsetHeight - this.cellheight;
        var canvas = document.createElement("canvas");
        canvas.width = this.wrapper.offsetWidth - this.cellwidth;
        canvas.height = this.wrapper.offsetHeight - this.cellheight;
        this.wrapper.appendChild(sidebar);
        this.wrapper.appendChild(canvas);
        this.ctx = canvas.getContext("2d");
        this.header = header.getContext("2d");
        this.sidebar = sidebar.getContext("2d");
    };
    Excel.prototype.createData = function () {
        var _this = this;
        this.data = [];
        var rows = this.csv.split("\n");
        rows.forEach(function (row, i) {
            var cols = row.split(",");
            var dataRow = [];
            cols.forEach(function (col, j) {
                var cell = {
                    data: col,
                    top: i * _this.cellheight,
                    left: j * _this.cellwidth,
                    height: _this.cellheight,
                    width: _this.cellwidth,
                    row: i,
                    col: j,
                    isbold: false,
                    strokeStyle: "#959595",
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial"
                };
                dataRow.push(cell);
            });
            _this.data.push(dataRow);
        });
    };
    Excel.prototype.drawGrid = function () {
        var _this = this;
        this.data.forEach(function (row) { return row.forEach(function (cell) {
            _this.drawCell(cell);
        }); });
    };
    Excel.prototype.drawCell = function (cell, ctx, center) {
        var context = null;
        context = ctx ? ctx : this.ctx;
        if (context) {
            context.strokeStyle = cell.strokeStyle;
            context.lineWidth = cell.lineWidth;
            context.font = "".concat(cell.fontSize, "px ").concat(cell.font);
            context.save();
            context.rect(cell.left, cell.top, cell.width, cell.height);
            context.clip();
            context.fillText(cell.data, center ? (cell.width / 2 + cell.left) : cell.left + 5, (cell.height / 2 + cell.top) + 5);
            context.restore();
            context.stroke();
        }
    };
    Excel.prototype.drawHeader = function () {
        var _this = this;
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var arr = chars.split("");
        if (this.header) {
            arr.forEach(function (c, j) {
                var cell = {
                    data: c,
                    top: 0,
                    left: (j + 1) * _this.cellwidth,
                    height: _this.cellheight,
                    width: _this.cellwidth,
                    row: 0,
                    col: j,
                    isbold: false,
                    strokeStyle: "#959595",
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial"
                };
                _this.drawCell(cell, _this.header, true);
            });
        }
    };
    return Excel;
}());
