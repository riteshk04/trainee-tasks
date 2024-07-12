"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var Excel = /** @class */ (function () {
    function Excel(parentElement, csv) {
        this.header = null;
        this.sidebar = null;
        this.ctx = null;
        this.headers = [];
        this.sidebarcells = [];
        this.cellheight = 30;
        this.cellwidth = 100;
        this.mincellwidth = 60;
        this.scrollX = 0;
        this.scrollY = 0;
        this.data = [];
        this.wrapper = parentElement;
        this.csv = csv.trim();
    }
    Excel.prototype.init = function () {
        this.createData();
        this.createMarkup();
        this.drawHeader();
        this.drawSidebar();
        this.drawGrid();
        // this.extendData(5,"X")
    };
    Excel.prototype.createMarkup = function () {
        this.wrapper.style.boxSizing = "border-box";
        var header = document.createElement("canvas");
        header.width = this.wrapper.offsetWidth;
        header.height = this.cellheight;
        this.wrapper.appendChild(header);
        var sidebar = document.createElement("canvas");
        sidebar.width = this.mincellwidth;
        sidebar.height = this.wrapper.offsetHeight - this.cellheight;
        var canvas = document.createElement("canvas");
        canvas.width = this.wrapper.offsetWidth - this.mincellwidth;
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
            context.fillText(cell.data, center ? (cell.width / 2 + cell.left - 4) : cell.left + 5, (cell.height / 2 + cell.top) + 5);
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
                    left: _this.mincellwidth + j * _this.cellwidth,
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
                _this.headers.push(cell);
            });
        }
    };
    Excel.prototype.drawSidebar = function () {
        var _this = this;
        var arr = __spreadArray([], Array(50), true).map(function (_, i) { return i; });
        if (this.header) {
            arr.forEach(function (c, i) {
                var cell = {
                    data: String(c),
                    top: i * _this.cellheight,
                    left: 0,
                    height: _this.cellheight,
                    width: _this.mincellwidth,
                    row: 0,
                    col: i,
                    isbold: false,
                    strokeStyle: "#959595",
                    lineWidth: 1,
                    fontSize: 16,
                    font: "Arial"
                };
                _this.drawCell(cell, _this.sidebar, true);
                _this.sidebarcells.push(cell);
            });
        }
    };
    return Excel;
}());
