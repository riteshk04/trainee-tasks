enum Colors {
  PRIMARY = "#03723c",
  SECONDARY = "#959595",
  STROKE = "#dadada",
}

class Excel {
  csvString: string;
  offset = 0.5;
  wrapper: HTMLElement;
  infiniteXDiv!: HTMLDivElement;
  scrollXWrapper!: HTMLDivElement;
  infiniteYDiv!: HTMLDivElement;
  scrollYWrapper!: HTMLDivElement;
  emptyBox!: HTMLDivElement;
  inputBoxWrapper!: HTMLDivElement;
  cellheight: number = 30;
  cellwidth: number = 100;
  mincellwidth: number = 60;
  dx = 10;
  dy = 10;
  scrolling = false;
  smoothingFactor = 0.1;
  extracells = 30;
  edgeCell!: Cell;
  prevWidth: number = 0;
  busy: any;
  autoScrollbars: any = false;

  keys: KeysPressed = {
    alt: false,
    ctrl: false,
    shift: false,
  };
  activeFunctions: ActiveFunctions = {
    copy: false,
  };
  inputBox: ExcelInputBox = {
    element: null,
    left: 0,
    top: 0,
  };
  canvas: Canvas = {
    ctx: null,
    data: [],
    element: null,
    startCell: null,
    endCell: null,
  };
  sidebar: Canvas = {
    ctx: null,
    data: [],
    element: null,
    endCell: null,
    startCell: null,
  };
  header: HeaderCanva = {
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
  mouse: Pointer = {
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
  selectionMode: SelectionModeCanva = {
    active: false,
    selectedArea: [],
    startSelectionCell: null,
    decoration: false,
    lineDashOffset: 0,
  };

  /**
   * Creates and initializes the App object
   * @param container Specify container to draw the app layout
   * @param csv CSV file as a string
   */
  constructor(container: HTMLElement, csv: string) {
    this.wrapper = container;
    this.csvString = (csv || "").trim();
    this.busy = null;
    this.init();
  }

  /**
   * Initializes the app
   */
  init() {
    this.createData();
    this.createMarkup();
    this.extendHeader(100);
    this.extendSidebar(100);
    this.attachEvents();
    this.smoothUpdate();
    this.drawHeader();
    this.drawSidebar();
    this.drawData();
    this.resizer();
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

    this.canvas.ctx = canvasElement.getContext("2d")!;
    this.header.ctx = headerElement.getContext("2d")!;
    this.sidebar.ctx = sidebarElement.getContext("2d")!;

    this.canvas.element = canvasElement;
    this.sidebar.element = sidebarElement;
    this.header.element = headerElement;
    this.inputBox.element = inputBox;

    // scrollbar
    this.scrollXWrapper = document.createElement("div");
    this.scrollXWrapper.style.overflowX = "scroll";
    this.infiniteXDiv = document.createElement("div");
    this.infiniteXDiv.style.height = "10px";

    this.scrollXWrapper.appendChild(this.infiniteXDiv);
    this.scrollXWrapper.style.position = "absolute";
    this.scrollXWrapper.style.bottom = "0";
    this.scrollXWrapper.style.right = "0";

    this.scrollYWrapper = document.createElement("div");
    this.scrollYWrapper.style.overflowY = "scroll";
    this.infiniteYDiv = document.createElement("div");
    this.infiniteYDiv.style.width = "30px";

    this.scrollYWrapper.appendChild(this.infiniteYDiv);
    this.scrollYWrapper.style.position = "absolute";
    this.scrollYWrapper.style.bottom = "0";
    this.scrollYWrapper.style.right = "0";

    this.scrollXWrapper.style.width = `${
      this.wrapper.offsetWidth - this.mincellwidth
    }px`;
    this.scrollYWrapper.style.height = `${
      this.wrapper.offsetHeight - this.cellheight
    }px`;
    this.wrapper.appendChild(this.scrollXWrapper);
    this.wrapper.appendChild(this.scrollYWrapper);

    this.resizeEventHandler();
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
    if (this.activeFunctions.copy) {
      this.marchingAnts();
    }
  }
  /**
   * Renders the whole app layout based on the new state
   */
  render() {
    if (this.busy) return;

    this.busy = requestAnimationFrame(() => {
      this.busy = null;
      this.render_internal();
    });
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
    this.canvas.element!.width = this.wrapper.offsetWidth - this.mincellwidth;
    this.canvas.element!.height = this.wrapper.offsetHeight - this.cellheight;
    this.header.element!.width = this.wrapper.offsetWidth - this.mincellwidth;
    this.sidebar.element!.height = this.wrapper.offsetHeight - this.cellheight;
    this.scrollXWrapper.style.width = `${
      this.wrapper.offsetWidth - this.mincellwidth
    }px`;
    this.scrollYWrapper.style.height = `${
      this.wrapper.offsetHeight - this.cellheight
    }px`;

    // scaling
    this.header.element!.height = this.cellheight * this.mouse.scale;
    this.sidebar.element!.width = this.mincellwidth * this.mouse.scale;
    this.emptyBox.style.height = `${this.cellheight * this.mouse.scale}px`;
    this.emptyBox.style.width = `${this.mincellwidth * this.mouse.scale}px`;
    this.inputBox.element!.style.scale = String(this.mouse.scale);
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
  scrollHandler(event: any, direction: "X" | "Y") {
    if (direction === "X") this.mouse.scrollX = event.target.scrollLeft;
    if (direction === "Y") this.mouse.scrollY = event.target.scrollTop;
    this.render();
  }
  /**
   * Changes the scale when mouse wheel moved (ctrl+wheel)
   * @param event Mouse wheel event
   */
  scale(event: WheelEvent) {
    if (event.ctrlKey) {
      const { deltaY } = event;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.mouse.scale = Math.max(
        this.mouse.scale + (deltaY < 0 ? 0.1 : -0.1),
        0.5
      );
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
  async createData() {
    this.canvas.data = await new Promise((res) => {
      let data: Cell[][] = [];
      let rows = this.csvString.split("\n");

      rows.forEach((row, i) => {
        let cols = row.split(",");
        let dataRow: Cell[] = [];
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
            strokeStyle: Colors.STROKE,
            lineWidth: 1,
            fontSize: 16,
            font: "Arial",
            align: "LEFT",
          };
          dataRow.push(cell);
        });
        data.push(dataRow);
      });
      res(data);
    });
    if (this.canvas.data.length < 100) {
      this.extendData(100 - this.canvas.data.length, "Y");
    }
    if (this.canvas.data[0].length < 100) {
      this.extendData(100 - this.canvas.data[0].length, "X");
    }
    this.selectionMode.selectedArea = [[this.canvas.data[0][0]]];
    this.selectionMode.startSelectionCell =
      this.selectionMode.selectedArea[0][0];
    this.render();
  }
  /**
   * Clears the main canvas
   */
  clearData() {
    let ctx = this.canvas.ctx;
    if (!ctx || !this.canvas.element) return;
    ctx.clearRect(
      0,
      0,
      this.canvas.element.offsetWidth,
      this.canvas.element.offsetHeight
    );
  }
  /**
   * Paints the cell in the main canvas
   * @param cell Given cell
   * @param active Specify true if active
   * @param selected Specify true if selection cell
   */
  drawDataCell(cell: Cell, active?: boolean, selected?: boolean) {
    let ctx = this.canvas.ctx;
    if (!ctx) return;
    ctx.scale(this.mouse.scale, this.mouse.scale);
    ctx.restore();
    ctx.fillStyle = selected ? Colors.PRIMARY + "22" : "#ffffff";
    ctx.font = `${cell.fontSize}px ${cell.font}`;
    ctx.save();
    ctx.fillRect(
      cell.left - this.mouse.animatex,
      cell.top - this.mouse.animatey,
      cell.width,
      cell.height
    );
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(
      cell.left - this.mouse.animatex - this.offset,
      cell.top - this.mouse.animatey - this.offset
    );
    ctx.lineTo(
      cell.left - this.mouse.animatex - this.offset + cell.width,
      cell.top - this.mouse.animatey - this.offset
    );
    ctx.lineTo(
      cell.left - this.mouse.animatex - this.offset + cell.width,
      cell.top - this.mouse.animatey - this.offset + cell.height
    );
    ctx.lineTo(
      cell.left - this.mouse.animatex - this.offset,
      cell.top - this.mouse.animatey - this.offset + cell.height
    );
    ctx.lineTo(
      cell.left - this.mouse.animatex - this.offset,
      cell.top - this.mouse.animatey - this.offset
    );
    // ctx.rect(cell.left - this.mouse.animatex - this.offset, cell.top - this.mouse.animatey - this.offset, cell.width, cell.height)
    ctx.clip();
    ctx.fillStyle = "#000000";
    switch (cell.align) {
      case "CENTER":
        ctx.fillText(
          cell.data,
          cell.width / 2 + (cell.left - this.mouse.animatex) - 4,
          cell.height / 2 + (cell.top - this.mouse.animatey) + 5
        );
        break;
      case "LEFT":
        ctx.fillText(
          cell.data,
          cell.left - this.mouse.animatex + 5,
          cell.height / 2 + (cell.top - this.mouse.animatey) + 5
        );
        break;
    }
    ctx.restore();
    ctx.strokeStyle = active ? Colors.PRIMARY + "AA" : "#959595aa";
    ctx.stroke();

    if (!active) return;
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
    let initialRow = this.binarySearch(
      this.canvas.data.map((d) => d[0]),
      this.mouse.scrollY,
      true
    );
    let finalRow = initialRow;
    let finalCol = 0;

    if (!this.canvas.element) return;
    for (let j = initialRow; j < this.canvas.data.length; j++) {
      finalCol = initialCol;
      finalRow++;
      for (let j = initialCol; j < this.canvas.data[0].length; j++) {
        finalCol++;
        if (
          this.canvas.data[0][j].left >
          this.canvas.element.offsetWidth + this.mouse.scrollX
        )
          break;
      }
      if (
        this.canvas.data[j][0].top >
        this.canvas.element.offsetHeight + this.mouse.scrollY
      )
        break;
    }

    if (Math.abs(finalRow - this.canvas.data.length) < 50) {
      this.extendData(100, "Y");
    }
    if (Math.abs(initialCol - this.canvas.data[0].length) < 50) {
      this.extendData(100, "X");
    }
    this.clearData();
    for (
      let i = Math.max(initialRow - this.extracells, 0);
      i < Math.min(finalRow + this.extracells, this.canvas.data.length);
      i++
    ) {
      for (
        let j = Math.max(initialCol - this.extracells, 0);
        j < Math.min(finalCol + this.extracells, this.canvas.data[0].length);
        j++
      ) {
        this.drawDataCell(this.canvas.data[i][j]);
      }
    }
    this.header.startCell = this.header.data[0][initialCol];
    this.header.endCell = this.header.data[0][finalCol];
    this.canvas.startCell = this.canvas.data[initialRow][initialCol];
    this.canvas.endCell = this.canvas.data[finalRow][finalCol];

    this.inputBox.element!.style.top = `${
      this.inputBox.top - this.mouse.animatey - 0.5
    }px`;
    this.inputBox.element!.style.left = `${
      this.inputBox.left - this.mouse.animatex - 0.5
    }px`;
    this.infiniteYDiv.style.height = `${
      window.outerHeight + this.canvas.data.length * this.cellheight
    }px`;
    this.infiniteXDiv.style.width = `${
      window.outerWidth + this.canvas.data[0].length * this.cellwidth
    }px`;
  }
  /**
   * Extends the data based on the specified direction
   * @param count Column or Row count
   * @param axis Specify X for columns or Y for rows
   */
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
          strokeStyle: Colors.STROKE,
          lineWidth: 1,
          fontSize: 16,
          font: "Arial",
          align: "CENTER",
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
          let cell: Cell = {
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
          };
          row.push(cell);
        }
      });
    } else {
      let prevRows = this.canvas.data.length;
      for (let i = prevRows; i < prevRows + count; i++) {
        const prev = this.canvas.data[i - 1];
        let height = this.cellheight;
        let row = [];

        for (let j = 0; j < prev.length; j++) {
          let left = prev[j].left;
          let top = prev[j].top + prev[j].height;
          let width = prev[j].width;
          let cell: Cell = {
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
  canvasMouseMoveHandler(event: MouseEvent) {
    if (this.selectionMode.active) {
      this.inputBox.element!.style.display = "none";
      const { cell } = this.getCell(event);
      const selectedArea = this.getCellsArea(
        this.selectionMode.startSelectionCell!,
        cell
      );
      this.selectionMode.selectedArea = selectedArea;
      this.render();
    }
  }
  /**
   * Sets the first cell of the selection mode
   * @param event Mousedown event
   */
  canvasMouseDownHandler(event: MouseEvent) {
    if (this.activeFunctions.copy) {
      this.activeFunctions.copy = false;
    }
    const { cell } = this.getCell(event);
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
  canvasMouseupHandler(event: MouseEvent) {
    const startSelectionCell = this.selectionMode.startSelectionCell;
    this.selectionMode.active = false;

    if (!startSelectionCell) return;
    const { cell } = this.getCell(event);
    let newSelectedArea = this.getCellsArea(startSelectionCell, cell);

    if (!newSelectedArea.length) return;

    if (newSelectedArea.length > 1) {
      // this.createStatus()
    } else {
      if (!this.selectionMode.selectedArea.length) {
        this.selectionMode.selectedArea = newSelectedArea;
        this.render();
        return;
      }
      let cell = newSelectedArea[0][0];

      if (this.checkSameCell(this.selectionMode.selectedArea[0][0], cell)) {
        this.createInputBox();
      } else {
        this.inputBox.element!.style.display = "none";
        // this.setActiveCell();
      }
    }
    this.selectionMode.selectedArea = newSelectedArea;
    console.log(this.selectionMode.selectedArea);
    this.render();
  }

  /**
   * Attaches events on Header, Sidebar, Main canvas and WIndow
   */
  attachEvents() {
    this.header.element!.addEventListener("wheel", (e) =>
      this.scroller(e, "HEADER")
    );
    this.sidebar.element!.addEventListener("wheel", (e) =>
      this.scroller(e, "SIDEBAR")
    );
    this.canvas.element!.addEventListener("wheel", (e) => this.scroller(e));

    this.canvas.element!.addEventListener(
      "mousemove",
      this.canvasMouseMoveHandler.bind(this)
    );
    this.header.element!.addEventListener(
      "mousemove",
      this.headerMouseMoveObserver.bind(this)
    );

    this.canvas.element!.addEventListener(
      "mousedown",
      this.canvasMouseDownHandler.bind(this)
    );
    this.header.element!.addEventListener(
      "mousedown",
      this.headerMouseDownObserver.bind(this)
    );

    this.canvas.element!.addEventListener(
      "mouseup",
      this.canvasMouseupHandler.bind(this)
    );
    this.header.element!.addEventListener(
      "mouseup",
      this.headerMouseUpObserver.bind(this)
    );

    this.scrollXWrapper.addEventListener("scroll", (e) =>
      this.scrollHandler(e, "X")
    );
    this.scrollYWrapper.addEventListener("scroll", (e) =>
      this.scrollHandler(e, "Y")
    );

    this.header.element!.addEventListener("mouseout", () => {
      this.header.isDragging = false;
    });
    this.canvas.element!.addEventListener("mouseout", () => {
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
    if (!ctx || !this.header.element) return;
    ctx.clearRect(
      0,
      0,
      this.header.element.offsetWidth,
      this.header.element.offsetHeight
    );
  }
  /**
   * Paints the given cell in header
   * @param cell Specified cell to draw
   * @param active Specify true if active
   */
  drawHeaderCell(cell: Cell, active?: boolean) {
    let ctx = this.header.ctx;
    if (!ctx) return;
    ctx.scale(this.mouse.scale, this.mouse.scale);
    ctx.restore();
    ctx.fillStyle = active ? Colors.PRIMARY + "22" : Colors.SECONDARY + "33";
    ctx.font = `${cell.fontSize}px ${cell.font}`;
    ctx.save();
    ctx.clearRect(
      cell.left - this.mouse.animatex - this.offset,
      cell.top - this.offset,
      cell.width + this.offset * 2,
      cell.height + this.offset * 2
    );
    ctx.fillRect(
      cell.left - this.mouse.animatex,
      cell.top,
      cell.width,
      cell.height
    );
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      cell.left - this.mouse.animatex - this.offset,
      cell.top - this.offset,
      cell.width,
      cell.height
    );
    ctx.clip();
    ctx.fillStyle = active ? Colors.PRIMARY : "#000000";
    switch (cell.align) {
      case "CENTER":
        ctx.fillText(
          cell.data,
          cell.width / 2 + (cell.left - this.mouse.animatex) - 4,
          cell.height / 2 + cell.top + 5
        );
        break;
      case "LEFT":
        ctx.fillText(
          cell.data,
          cell.left - this.mouse.animatex + 5,
          cell.height / 2 + cell.top + 5
        );
        break;
    }
    ctx.restore();
    ctx.strokeStyle = active ? Colors.PRIMARY + "AA" : "#959595aa";
    ctx.stroke();

    if (!active) return;
    ctx.beginPath();
    ctx.moveTo(cell.left - this.mouse.animatex - 4, cell.top + cell.height - 2);
    ctx.lineTo(
      cell.left - this.mouse.animatex + cell.width + 3,
      cell.top + cell.height - 2
    );
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
    if (!this.header.element) return;

    for (let j = initialCol; j < this.header.data[0].length; j++) {
      finalCol++;
      if (
        this.header.data[0][j].left >
        this.header.element.offsetWidth + this.mouse.scrollX
      )
        break;
    }
    if (finalCol > this.header.data[0].length - 1) {
      this.extendHeader(10);
    }

    this.clearHeader();
    this.header.data.forEach((row) => {
      for (
        let i = Math.max(initialCol - this.extracells, 0);
        i < Math.min(finalCol + this.extracells, this.header.data[0].length);
        i++
      ) {
        this.drawHeaderCell(row[i]);
      }
    });
  }
  /**
   * Extends the header by specified count
   * @param count
   */
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
          strokeStyle: Colors.STROKE,
          lineWidth: 1,
          fontSize: 16,
          font: "Arial",
          align: "CENTER",
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
        let cell: Cell = {
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
        };
        row.push(cell);
      }
    });
  }
  /**
   * Changes the width of the dragged cell
   * @param event Mousemove event
   */
  headerMouseMoveObserver(event: MouseEvent) {
    const gap = 2;
    const headerElement = this.header.element!;
    const headerStartCell = this.header.startCell!;
    const headerEndCell = this.header.endCell!;
    let { x } = this.getCoordinates(event, headerElement);

    for (
      let i = Math.max(1, headerStartCell.col - 1);
      i <= Math.min(this.header.data[0].length, headerEndCell!.col);
      i++
    ) {
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
      if (!this.header.isDragging) headerElement.style.cursor = "default";
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
  headerMouseUpObserver(event: MouseEvent) {
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
  headerMouseDownObserver(event: MouseEvent) {
    if (this.header.edgeDetected) {
      this.inputBox.element!.style.display = "none";
      this.header.isDragging = true;
      const { x } = this.getCoordinates(event);
      this.header.startx = x;
      this.prevWidth = this.edgeCell.width;
    } else {
      this.header.cell_extend = true;
    }
  }
  /**
   * Gets the cell using co-ordinates
   * @param event mouse event
   * @returns cell or false
   */
  getHeaderCell(event: MouseEvent) {
    const { x } = this.getCoordinates(event, this.header.element!);
    for (
      let i = this.header.startCell!.col;
      i < this.header.data[0].length;
      i++
    ) {
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
    if (!ctx || !this.sidebar.element) return;
    ctx.clearRect(
      0,
      0,
      this.sidebar.element.offsetWidth,
      this.sidebar.element.offsetHeight
    );
  }
  /**
   * Paints the specified cell on the canvas
   * @param cell Specified cell
   * @param active If active cell
   * @returns
   */
  drawSidebarCell(cell: Cell, active?: boolean) {
    let ctx = this.sidebar.ctx;
    if (!ctx) return;
    ctx.scale(this.mouse.scale, this.mouse.scale);
    ctx.restore();
    ctx.fillStyle = active ? Colors.PRIMARY + "22" : Colors.SECONDARY + "33";
    ctx.font = `${cell.fontSize}px ${cell.font}`;
    ctx.save();
    ctx.clearRect(
      cell.left - this.offset,
      cell.top - this.mouse.animatey - this.offset,
      cell.width + this.offset * 2,
      cell.height + this.offset * 2
    );
    ctx.fillRect(
      cell.left,
      cell.top - this.mouse.animatey,
      cell.width,
      cell.height
    );
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      cell.left - this.offset,
      cell.top - this.mouse.animatey - this.offset,
      cell.width,
      cell.height
    );
    ctx.clip();
    ctx.fillStyle = active ? Colors.PRIMARY : "#000000";
    switch (cell.align) {
      case "CENTER":
        ctx.fillText(
          cell.data,
          cell.width / 2 + cell.left - 4,
          cell.height / 2 + (cell.top - this.mouse.animatey) + 5
        );
        break;
      case "LEFT":
        ctx.fillText(
          cell.data,
          cell.left + 5,
          cell.height / 2 + (cell.top - this.mouse.animatey) + 5
        );
        break;
    }
    ctx.restore();
    ctx.strokeStyle = active ? Colors.PRIMARY + "AA" : "#959595aa";
    ctx.stroke();

    if (!active) return;
    ctx.beginPath();
    ctx.moveTo(cell.left + cell.width - 2, cell.top - this.mouse.animatey - 4);
    ctx.lineTo(
      cell.left + cell.width - 2,
      cell.top - this.mouse.animatey + cell.height + 3
    );
    ctx.strokeStyle = Colors.PRIMARY;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  /**
   * Paints the sidebar according to screen size
   */
  drawSidebar() {
    let initialRow = this.binarySearch(
      this.sidebar.data.map((c) => c[0]),
      this.mouse.scrollY,
      true
    );
    let finalRow = initialRow;
    if (!this.sidebar.element) return;

    for (let j = initialRow; j < this.sidebar.data.length; j++) {
      finalRow++;
      if (
        this.sidebar.data[j][0].top >
        this.sidebar.element.offsetHeight + this.mouse.scrollY
      )
        break;
    }
    if (finalRow > this.sidebar.data.length - 1) {
      this.extendSidebar(10);
    }

    this.clearSidebar();
    for (
      let i = Math.max(initialRow - this.extracells, 0);
      i < Math.min(finalRow + this.extracells, this.sidebar.data.length);
      i++
    ) {
      this.drawSidebarCell(this.sidebar.data[i][0]);
    }
  }
  /**
   * Extends the sidebar by specified count
   * @param count Extension count
   */
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
          strokeStyle: Colors.STROKE,
          lineWidth: 1,
          fontSize: 16,
          font: "Arial",
          align: "CENTER",
        },
      ]);
    }
    let prevRows = this.sidebar.data.length;
    for (let j = prevRows; j < prevRows + count; j++) {
      let left = this.sidebar.data[j - 1][0].left;
      let top =
        this.sidebar.data[j - 1][0].top + this.sidebar.data[j - 1][0].height;
      let height = this.sidebar.data[j - 1][0].height;
      let width = this.mincellwidth;
      let cell: Cell = {
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
  windowKeypressHandler(event: KeyboardEvent) {
    if (event.target === this.inputBox.element) return;
    this.inputBox.element!.style.display = "none";

    this.keys.ctrl = event.ctrlKey;
    this.keys.alt = event.altKey;
    this.keys.shift = event.shiftKey;
    this.mouse.horizontal = event.shiftKey && event.altKey;

    if (event.key === "c" && event.ctrlKey) {
      this.copyCells();
      return;
    }

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
          [this.selectionMode.startSelectionCell!],
        ];
        break;
      case "Delete":
        this.selectionMode.selectedArea.forEach((row) =>
          row.forEach((c) => (c.data = ""))
        );
        break;
      case "Backspace":
        if (this.selectionMode.selectedArea.length) {
          this.selectionMode.selectedArea[0][0].data = "";
          this.createInputBox();
        }
        break;
      default:
        if (event.key.match(/^\w$/)) {
          this.createInputBox();
        }
        return;
    }
    if (!this.keys.ctrl && this.selectionMode.selectedArea.length > 1) {
      this.selectionMode.selectedArea.forEach((row) =>
        row.forEach((c) => this.drawDataCell(c))
      );
    }
    this.render();
  }
  /**
   * Triggers when user releases the keys
   * @param event Keyboard event
   * @returns
   */
  windowKeyupHandler(event: KeyboardEvent) {
    if (event.target === this.inputBox.element) return;
    this.inputBox.element!.style.display = "none";
    this.mouse.horizontal = event.shiftKey && event.altKey;
  }

  /**
   * Triggers the marching ants animation
   */
  copyCells(): void {
    this.activeFunctions.copy = true;
    this.render();
  }
  /**
   * Updates the dash offset (Recursive call)
   */
  marchingAnts(): void {
    this.selectionMode.lineDashOffset -= 1;
    this.render();
  }

  /**
   * Updates the scroll values when user moves the wheel
   * @param event Mouse wheel event
   * @param element Header or Sidebar
   * @returns void
   */
  scroller(event: WheelEvent, element?: "HEADER" | "SIDEBAR"): void {
    if (event.ctrlKey) return;
    let { deltaY } = event;
    switch (element) {
      case "HEADER":
        this.mouse.scrollX = Math.max(0, this.mouse.scrollX + deltaY);
        break;
      case "SIDEBAR":
        this.mouse.scrollY = Math.max(
          0,
          this.mouse.scrollY + (deltaY < 0 ? -90 : 90)
        );
        break;
      default:
        if (this.mouse.horizontal) {
          this.mouse.scrollX = Math.max(0, this.mouse.scrollX + deltaY);
        } else {
          this.mouse.scrollY = Math.max(
            0,
            this.mouse.scrollY + (deltaY < 0 ? -90 : 90)
          );
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
  smoothUpdate(): void {
    this.mouse.animatex +=
      (this.mouse.scrollX - this.mouse.animatex) * this.smoothingFactor;
    this.mouse.animatey +=
      (this.mouse.scrollY - this.mouse.animatey) * this.smoothingFactor;
    if (
      Math.round(this.mouse.animatex) !== this.mouse.scrollX ||
      Math.round(this.mouse.animatey) !== this.mouse.scrollY
    ) {
      if (this.autoScrollbars) clearTimeout(this.autoScrollbars);
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
   * @param canvasElement Canvas to get the co-ordinates of
   * @returns Co-ordinates
   */
  getCoordinates(
    event: MouseEvent,
    canvasElement?: HTMLCanvasElement
  ): { x: number; y: number } {
    if (!canvasElement) {
      canvasElement = this.canvas.element!;
    }
    let rect = canvasElement.getBoundingClientRect();
    let x =
      Math.max(0, event.clientX - rect.left + this.mouse.scrollX) *
      this.mouse.scale;
    let y =
      Math.max(0, event.clientY - rect.top + this.mouse.scrollY) *
      this.mouse.scale;
    return { x, y };
  }
  /**
   * Gets the cell which is at the specified co-ordinates
   * @param event Event with co-ordinates
   * @param global Specify true if global search
   * @returns Cell, Row & Column
   */
  getCell(
    event: MouseEvent,
    global: boolean = false
  ): { cell: Cell; x: number; y: number } {
    const { x, y } = this.getCoordinates(event);

    for (
      let i = !global ? this.canvas.startCell!.row : 0;
      i < this.canvas.data.length;
      i++
    ) {
      const row = this.canvas.data[i];
      for (
        let j = !global ? this.canvas.startCell!.col : 0;
        j < row.length;
        j++
      ) {
        const cell = row[j];
        if (
          cell.left < x &&
          x <= cell.left + cell.width &&
          cell.top < y &&
          y <= cell.top + cell.height
        ) {
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
  createInputBox(): void {
    if (!this.selectionMode.selectedArea.length) return;
    let inputBox = this.inputBox.element!;

    const { top, left, width, height, font, fontSize, data, row, col } =
      this.selectionMode.selectedArea[0][0];

    this.inputBox.top = top - this.mouse.animatey;
    this.inputBox.left = left - this.mouse.animatex;

    inputBox.style.top = `${this.inputBox.top}px`;
    inputBox.style.left = `${this.inputBox.left}px`;
    inputBox.style.width = `${width - 1}px`;
    inputBox.style.height = `${height - 1}px`;
    inputBox.style.font = `${font}`;
    inputBox.style.fontSize = `${fontSize}px`;
    inputBox.style.padding = `4px`;
    inputBox.style.border = `1px solid white`;
    inputBox.value = `${data}`;
    inputBox.style.display = `block`;
    inputBox.focus();
    inputBox.onchange = (e: any) => {
      e.stopPropagation();
      this.canvas.data[row][col].data = e.target.value;
    };
  }
  /**
   * Moves active cell to specified direction
   * @param direction
   * @returns void
   */
  moveActiveCell(direction: "TOP" | "LEFT" | "RIGHT" | "BOTTOM"): void {
    let activeCell = this.selectionMode.startSelectionCell!;

    let { row, col } = activeCell;
    if (!activeCell) return;

    switch (direction) {
      case "TOP":
        this.selectionMode.selectedArea = [
          [this.canvas.data[Math.max(row - 1, 0)][col]],
        ];
        if (activeCell.top - this.cellheight * 2 < this.mouse.scrollY) {
          this.mouse.scrollY = Math.max(
            0,
            this.mouse.scrollY - this.cellheight
          );
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
            this.canvas.data[row][
              Math.min(this.canvas.data[0].length - 1, col + 1)
            ],
          ],
        ];
        if (
          activeCell.left + this.cellwidth * 2 >
          this.mouse.scrollX + this.canvas.element!.offsetWidth
        ) {
          this.mouse.scrollX += this.cellwidth;
        }
        break;
      case "BOTTOM":
        this.selectionMode.selectedArea = [
          [
            this.canvas.data[Math.min(this.canvas.data.length - 1, row + 1)][
              col
            ],
          ],
        ];
        if (
          activeCell.top + this.cellheight * 2 >
          this.mouse.scrollY + this.canvas.element!.offsetHeight
        ) {
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
  setSelection(): void {
    this.highlightCells();
  }
  /**
   * Highlights the selection
   * @returns void
   */
  highlightCells(): void {
    let context = this.canvas.ctx;
    const selectedArea = this.selectionMode.selectedArea;
    if (!context || !selectedArea.length) return;

    const startCell = selectedArea[0][0];
    const endCell =
      selectedArea[selectedArea.length - 1][
        selectedArea[selectedArea.length - 1].length - 1
      ];

    const leftX1 = Math.min(
      startCell.left,
      endCell.left,
      startCell.left + startCell.width,
      endCell.left + endCell.width
    );
    const leftX2 = Math.max(
      startCell.left,
      endCell.left,
      startCell.left + startCell.width,
      endCell.left + endCell.width
    );
    const topX1 = Math.min(
      startCell.top,
      endCell.top + endCell.height,
      startCell.top + startCell.height,
      endCell.top
    );
    const topX2 = Math.max(
      startCell.top,
      endCell.top + endCell.height,
      startCell.top + startCell.height,
      endCell.top
    );

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

    this.drawDataCell(this.selectionMode.startSelectionCell!);
    context.save();

    context.translate(-this.mouse.animatex, -this.mouse.animatey);
    context.beginPath();
    context.strokeStyle = Colors.PRIMARY;
    context.lineWidth = 4;
    if (this.activeFunctions.copy) {
      context.setLineDash([6, 2]);
      context.lineDashOffset = this.selectionMode.lineDashOffset;
    }
    context.moveTo(leftX1 - 4, topX1 - 2);
    context.lineTo(leftX2 + 1, topX1 - 2);
    context.lineTo(leftX2 + 1, topX2 + 1);
    context.lineTo(leftX1 - 2, topX2 + 1);
    context.lineTo(leftX1 - 2, topX1 - 2);
    context.save();

    context.stroke();
    context.restore();
    context.setTransform(1, 0, 0, 1, 0, 0);

    if (this.inputBox.element!.style.display === "none") {
      context.beginPath();
      context.fillStyle = Colors.PRIMARY;
      context.rect(
        leftX2 - this.mouse.animatex - 4,
        topX2 - this.mouse.animatey - 4,
        8,
        8
      );
      context.fill();
      context.strokeStyle = "#ffffff";
      context.lineWidth = 2;
      context.stroke();
    }

    if (selectedArea.length) {
      selectedArea.forEach((row) => {
        this.drawSidebarCell(this.sidebar.data[row[0].row][0], true);
      });
      selectedArea[0].forEach((cell) =>
        this.drawHeaderCell(this.header.data[0][cell.col], true)
      );
    }
  }

  /**
   * Creates the given chart
   */
  createChart(type: ChartType) {
    const chartConfig = {
      height: 600,
      width: 600,
      position: { x: 10, y: 10 },
    };
    const chart = new AppChart(
      this.selectionMode.selectedArea,
      this.inputBoxWrapper,
      chartConfig,
      type
    );
    chart.render();
  }

  /**
   * Searches the nearest left position of the cell specified mouse position
   * @param arr Array of cells
   * @param x Specified position
   * @param vertical for searching the row
   * @returns Nearest cell's left (top if vertical search)
   */
  binarySearch(arr: Cell[], x: number, vertical?: boolean): number {
    let low = 0;
    let high = arr.length - 1;
    let mid = 0;
    while (high >= low) {
      mid = low + Math.floor((high - low) / 2);
      if ((vertical ? arr[mid].top : arr[mid].left) == x) return mid;
      if ((vertical ? arr[mid].top : arr[mid].left) > x) high = mid - 1;
      else low = mid + 1;
    }
    return mid;
  }
  /**
   * Converts specified integer to characters
   * @param num A number to convert to characters
   * @returns Characters like: A,B,C..., AA, AB...
   */
  toLetters(num: number): string {
    var mod = num % 26,
      pow = (num / 26) | 0,
      out = mod ? String.fromCharCode(64 + mod) : (--pow, "Z");
    return pow ? this.toLetters(pow) + out : out;
  }
  /**
   * To check if a cell is same as another cell
   * @param cell
   * @param targetcell
   * @returns boolean
   */
  checkSameCell(cell: Cell, targetcell: Cell): boolean {
    const { top, left } = cell;
    return targetcell.top === top && targetcell.left == left;
  }
  /**
   * To get all cells within the start and end cell of the selection
   * @param start Start cell of the selection
   * @param end End cell of the selection
   * @returns Array of cells
   */
  getCellsArea(start: Cell, end: Cell): Cell[][] {
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
  setActiveCell(): void {
    this.drawDataCell(this.selectionMode.selectedArea[0][0]!);
  }

  /**
   * Changes the width of the given cell and corresponding columns.
   *
   * Shifts the left of the following cells
   * @param cell Cell
   * @param width New width of the given cell
   * @param data 2D cell array
   */
  async widthShifter(cell: Cell, width: number, data: Cell[][]): Promise<void> {
    if (width < 60) {
      width = 60;
    }

    data.forEach((row) => {
      let widthChanged = false;
      for (let i = this.canvas.startCell!.col; i < row.length; i++) {
        const c = row[i];
        if (!widthChanged) {
          if (c.left === cell.left) {
            c.width = width;
            widthChanged = true;
          }
        } else {
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
  getStats(): WorkbookStats {
    let min = Infinity,
      max = -Infinity,
      avg = -Infinity,
      sum = 0,
      count = 0,
      ncount = 0;
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
    if (!ncount) sum = Infinity;
    return { count, max, min, sum, avg };
  }
}

class AppChart {
  data: ChartData;
  wrapper: HTMLElement;
  config: ChartConfig;
  type: ChartType;
  ctx!: CanvasRenderingContext2D;

  constructor(
    data: Cell[][],
    wrapper: HTMLElement,
    config: ChartConfig,
    type: ChartType
  ) {
    this.data = this.parseData(data);
    this.type = type;
    this.config = config;
    this.wrapper = wrapper;
  }
  render() {
    this.createMarkup();
    this.initChart();
  }
  createMarkup() {
    const chartWrapper = document.createElement("div");
    const chartcanva = document.createElement("canvas");
    const ctx = chartcanva.getContext("2d");

    chartWrapper.appendChild(chartcanva);
    chartWrapper.style.position = "absolute";
    chartWrapper.style.backgroundColor = "white";
    chartWrapper.style.padding = "16px";
    chartWrapper.style.boxShadow = "16px";
    chartWrapper.style.border = "1px solid #959595";
    chartWrapper.style.top = `${this.config.position.x}px`;
    chartWrapper.style.left = `${this.config.position.x}px`;
    chartWrapper.style.width = `${this.config.width}px`;
    chartWrapper.style.height = `${this.config.height}px`;

    chartcanva.style.height = `${chartWrapper.offsetHeight}px`;
    chartcanva.style.width = `${chartWrapper.offsetWidth}px`;

    this.ctx = ctx!;
    this.wrapper.appendChild(chartWrapper);
  }
  initChart() {
    if (!this.ctx) return;

    const chartConfig = {
      type: this.type.toLowerCase(),
      data: this.data,
      responsive: true,
    };
    console.log(chartConfig);
    // // @ts-ignore
    // Chart.defaults.backgroundColor = "#9BD0F5";
    // // @ts-ignore
    // Chart.defaults.borderColor = "#36A2EB";
    // // @ts-ignore
    // Chart.defaults.color = "#000";
    // @ts-ignore
    new Chart(this.ctx, chartConfig);
  }

  /**
   * Converts 2D array to Chart.js config object
   * @param data
   * @returns
   */
  parseData(data: Cell[][]): ChartData {
    if (!data.length) return { labels: [], datasets: [] };

    const labels = data.map((_, i) => i + 1);

    const datasets = [];
    for (let i = 0; i < data[0].length; i++) {
      const dataset: any = {
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
        if (j === 0) continue;
        const cell = data[j][i];
        dataset.data.push(parseInt(cell.data));
      }
      datasets.push(dataset);
    }
    return { labels, datasets };
  }
}
