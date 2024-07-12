"use strict";
var Excel = /** @class */ (function () {
    function Excel(parentElement, csv) {
        this.cellheight = 30;
        this.cellwidth = 100;
        this.wrapper = parentElement;
        this.csv = csv.trim();
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.data = [];
    }
    Excel.prototype.init = function () {
        this.wrapper.appendChild(this.canvas);
        this.createData();
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
                    isbold: false
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
    Excel.prototype.drawCell = function (cell) {
        if (this.ctx) {
            this.ctx.save();
            this.ctx.rect(cell.top, cell.left, cell.width, cell.height);
            this.ctx.clip();
            this.ctx.fillText(cell.data, cell.left + 5, cell.top + (cell.height / 2 + cell.top) + 5);
            this.ctx.restore();
            this.ctx.stroke();
        }
    };
    return Excel;
}());
