var COLHEIGHTS = []
var COLWIDTHS = []
var SELECTED_COLS = []
var PREV_COLS = []
var ctx = null

function init(canvas, input, DATA) {
    const COLHEIGHT = 30;
    const COLWIDTH = 120;
    const HEADERS = Object.keys(DATA[0])

    COLWIDTHS = [...Array(HEADERS.length)].map((_a, i) => i == 0 ? 50 : COLWIDTH);
    COLHEIGHTS = [COLHEIGHT, ...Array(DATA.length)].map((_a, i) => i == 2 ? 100 : COLHEIGHT);
    const totalHeight = COLHEIGHTS.reduce((s, v) => s + v, 0)
    const totalWidth = COLWIDTHS.reduce((s, v) => s + v, 0)

    ctx = canvas.getContext("2d")

    canvas.setAttribute("height", totalHeight)
    canvas.setAttribute("width", totalWidth)

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.font = "16px Arial";

    let currentPosX = 0;
    let currentPosY = 0;
    for (let j = 0; j < HEADERS.length; j++) {
        let title = HEADERS[j];
        ctx.save()
        ctx.rect(currentPosX, currentPosY, COLWIDTHS[j], COLHEIGHTS[0])
        ctx.clip()
        ctx.fillText(title, currentPosX + 5, currentPosY + COLHEIGHTS[0] - 10)
        ctx.restore()
        ctx.stroke()
        currentPosX += COLWIDTHS[j]
    }

    currentPosY += COLHEIGHTS[0]

    for (let i = 0; i < DATA.length; i++) {
        currentPosX = 0
        for (let j = 0; j < HEADERS.length; j++) {
            let value = DATA[i][HEADERS[j]];
            ctx.save()
            ctx.rect(currentPosX, currentPosY, COLWIDTHS[j], COLHEIGHTS[i])
            ctx.clip()
            ctx.fillText(value, currentPosX + 5, (COLHEIGHTS[i] / 2 + currentPosY) + 5)
            ctx.restore()
            ctx.stroke()
            currentPosX += COLWIDTHS[j]
        }
        currentPosY += COLHEIGHTS[i]
    }

    // resizer(canvas, COLHEIGHTS, COLWIDTHS)
    editor(canvas, ctx, input, COLHEIGHTS, COLWIDTHS, DATA, HEADERS)
    rangeselector(canvas, COLHEIGHTS, COLWIDTHS, DATA, HEADERS)

}

function drawColumn(ctx, x, y, width, height, text) {
    // TODO: overflow issue
    ctx.clearRect(x, y, width, height)
    ctx.save()
    ctx.rect(x, y, width, height)
    ctx.clip()
    ctx.fillText(text, x + 5, (height / 2 + y) + 5)
    ctx.restore()
    ctx.stroke()
}

function highlightColumn(x, y, text) {
    ctx.clearRect(x, y, COLWIDTHS[x], COLHEIGHTS[y])
    ctx.save()
    ctx.rect(x, y, COLWIDTHS[x], COLHEIGHTS[y])
    ctx.fillStyle = "#88d9ff33"
    ctx.fillRect(x, y, COLWIDTHS[x], COLHEIGHTS[y])
    ctx.clip()
    ctx.fillText(text, x + 5, (COLHEIGHTS[y] / 2 + y) + 5)
    ctx.restore()
    // ctx.stroke()
}


function getCoordinates(event, canvas) {
    let rect = canvas.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    return [x, y]
}

function getColumn(x, y, COLHEIGHTS = COLHEIGHTS, COLWIDTHS = COLWIDTHS) {
    let sumY = COLHEIGHTS[0];
    let row = 0;
    for (let i = 0; i < COLHEIGHTS.length; i++) {
        sumY += COLHEIGHTS[i];
        if (sumY <= y)
            row++
        else
            break
    }
    let sumX = 0;
    let col = 0;
    for (let i = 0; i < COLWIDTHS.length; i++) {
        sumX += COLWIDTHS[i];
        if (sumX <= x)
            col++
        else
            break
    }
    return [row, col, sumX - COLWIDTHS[col], sumY - COLHEIGHTS[row]]
}

function getTopLeft(row, col) {
    let sumY = COLHEIGHTS[0];
    for (let i = 1; i <= row; i++) {
        sumY += COLHEIGHTS[i];
    }
    let sumX = 0;
    for (let i = 0; i <= col; i++) {
        sumX += COLWIDTHS[i];
    }
    return [sumX - COLWIDTHS[col], sumY - COLHEIGHTS[row]]
}

function getCurrentValue(DATA, HEADERS, row, col) {
    return DATA[row][HEADERS[col]];
}
function setCurrentValue(DATA, HEADERS, row, col, value) {
    return DATA[row][HEADERS[col]] = value;
}

function generateInputBox(input, x, y, height, width, row, col, value) {
    input.style.top = `${x}px`
    input.style.left = `${y}px`
    input.style.height = `${height}px`
    input.style.width = `${width}px`
    input.style.display = `block`
    input.value = value
    input.setAttribute("data-row", row)
    input.setAttribute("data-col", col)
    input.focus()
    return input
}

function editor(canvas, ctx, input, COLHEIGHTS, COLWIDTHS, DATA, HEADERS) {
    input.addEventListener("blur", function (e) {
        let value = e.target.value
        let row = parseInt(this.getAttribute("data-row"))
        let col = parseInt(this.getAttribute("data-col"))
        let left = parseInt(this.style.left.replace("left", ""))
        let top = parseInt(this.style.top.replace("left", ""))
        setCurrentValue(DATA, HEADERS, row, col, value)
        drawColumn(ctx, left, top, COLWIDTHS[col], COLHEIGHTS[row], value, true)
    })
    canvas.addEventListener("dblclick", function (event) {
        let [x, y] = getCoordinates(event, canvas)
        let [row, col, leftX, topY] = getColumn(x, y, COLHEIGHTS, COLWIDTHS)
        let value = getCurrentValue(DATA, HEADERS, row, col)
        generateInputBox(input, topY, leftX, COLHEIGHTS[row], COLWIDTHS[col], row, col, value)
    })
}

function renderSelection(event, canvas, startCoordinates) {
    let [endx, endy] = getCoordinates(event, canvas)
    let [endrow, endcol, startcolx, startcoly] = getColumn(endx, endy, COLHEIGHTS, COLWIDTHS)
    let [startrow, startcol, endcolx, endcoly] = startCoordinates
    let start = Math.min(startrow, endrow)
    let end = Math.max(startrow, endrow)
    PREV_COLS = SELECTED_COLS
    SELECTED_COLS = []

    for (let i = start; i <= end; i++) {
        SELECTED_COLS.push([i, startcol])
    }
    if (PREV_COLS.length) {
        let toRemove = PREV_COLS.filter(col => !SELECTED_COLS.map(e => JSON.stringify(e)).includes(JSON.stringify(col)) && col != JSON.stringify([startrow, startcol]))
        toRemove.forEach(([row, col]) => {
            let [x, y] = getTopLeft(row, col)
            // highlightColumn(x, y, "m")
        })
    }

}

function startSelection(event, canvas) {
    let [startx, starty] = getCoordinates(event, canvas)
    let startCoordinates = getColumn(startx, starty, COLHEIGHTS, COLWIDTHS)
    canvas.addEventListener("mousemove", (e) => renderSelection(e, canvas, startCoordinates))
}

function rangeselector(canvas) {
    canvas.addEventListener("mousedown", (e) => startSelection(e, canvas))
}


function startDrag(event, canvas) {
    let [x, y] = getCoordinates(event, canvas)
    console.log(x)
}

function resizer(canvas, _COLHEIGHTS, COLWIDTHS) {
    let LEFTGAP = 10
    let RIGHTGAP = 10

    let hoverareas = COLWIDTHS.reduce((acc, val, i, _arr) => {
        if (i == 0) {
            acc.push(val)
            return acc
        }
        let sum = acc[Math.max(i - 1, 0)] + val
        acc.push(sum)
        return acc
    }, [])

    canvas.addEventListener("mousemove", function (event) {
        let [x, y] = getCoordinates(event, canvas)

        for (let i = 0; i < hoverareas.length; i++) {
            const EDGE = hoverareas[i];
            if (EDGE - LEFTGAP < x && x < EDGE + RIGHTGAP) {
                canvas.style.cursor = "e-resize"
                // canvas.addEventListener("mousedown", startDrag(e))
                break
            } else {
                canvas.style.cursor = "col-resize"
                // canvas.removeEventListener("mousedown", startDrag(e))
            }
        }
    })
}

$(function () {
    const data =
        [
            {
                "id": "1",
                "name": "Perice",
                "country": "Zambia",
                "email_id": "pkneeshaw0@si.edu",
                "gender": "Male",
                "telephone_number": "583-125-0584",
                "state": "",
                "city": "Mungwi",
                "addr1": "Room 390",
                "addr2": "Apt 299",
                "dob": "2/7/2002",
                "FY2019-20": "588941",
                "FY2020-21": "610137",
                "FY2021-22": "745617",
                "FY2022-23": "807292",
                "FY2023-24": "927796"
            },
            {
                "id": "2",
                "name": "Marci",
                "country": "Mayotte",
                "email_id": "mlorman1@about.com",
                "gender": "Female",
                "telephone_number": "860-560-7873",
                "state": "",
                "city": "Chirongui",
                "addr1": "Apt 678",
                "addr2": "Room 389",
                "dob": "11/5/2004",
                "FY2019-20": "587098",
                "FY2020-21": "680356",
                "FY2021-22": "718990",
                "FY2022-23": "886035",
                "FY2023-24": "902030"
            },
            {
                "id": "3",
                "name": "Karoly",
                "country": "China",
                "email_id": "kbeal2@yahoo.com",
                "gender": "Female",
                "telephone_number": "855-469-8973",
                "state": "",
                "city": "Sanjie",
                "addr1": "Apt 405",
                "addr2": "Suite 5",
                "dob": "5/19/2006",
                "FY2019-20": "546864",
                "FY2020-21": "680819",
                "FY2021-22": "771538",
                "FY2022-23": "882994",
                "FY2023-24": "1040143"
            },
            {
                "id": "4",
                "name": "Dulce",
                "country": "Indonesia",
                "email_id": "dricardou3@shinystat.com",
                "gender": "Female",
                "telephone_number": "684-642-7087",
                "state": "",
                "city": "Sumurgung",
                "addr1": "Room 1300",
                "addr2": "Room 1228",
                "dob": "9/19/2009",
                "FY2019-20": "533020",
                "FY2020-21": "659810",
                "FY2021-22": "744962",
                "FY2022-23": "815186",
                "FY2023-24": "929364"
            },
            {
                "id": "5",
                "name": "Barrie",
                "country": "Vietnam",
                "email_id": "byushmanov4@slideshare.net",
                "gender": "Female",
                "telephone_number": "533-119-5194",
                "state": "",
                "city": "Cà Mau",
                "addr1": "17th Floor",
                "addr2": "11th Floor",
                "dob": "9/11/2006",
                "FY2019-20": "597458",
                "FY2020-21": "627644",
                "FY2021-22": "792878",
                "FY2022-23": "834491",
                "FY2023-24": "1029385"
            },
            {
                "id": "6",
                "name": "Merna",
                "country": "Sweden",
                "email_id": "morro5@tumblr.com",
                "gender": "Female",
                "telephone_number": "806-308-1096",
                "state": "Stockholm",
                "city": "Södertälje",
                "addr1": "Suite 50",
                "addr2": "Room 1361",
                "dob": "11/9/2008",
                "FY2019-20": "578472",
                "FY2020-21": "611664",
                "FY2021-22": "736827",
                "FY2022-23": "874343",
                "FY2023-24": "901968"
            },
            {
                "id": "7",
                "name": "Maura",
                "country": "China",
                "email_id": "mglassborow6@163.com",
                "gender": "Female",
                "telephone_number": "179-160-6151",
                "state": "",
                "city": "Ningtang",
                "addr1": "Suite 2",
                "addr2": "Apt 496",
                "dob": "4/29/2003",
                "FY2019-20": "520092",
                "FY2020-21": "694729",
                "FY2021-22": "784070",
                "FY2022-23": "806163",
                "FY2023-24": "956583"
            },
            {
                "id": "8",
                "name": "Hollie",
                "country": "Guatemala",
                "email_id": "hdunbavin7@nifty.com",
                "gender": "Female",
                "telephone_number": "985-937-3816",
                "state": "",
                "city": "Monjas",
                "addr1": "Suite 59",
                "addr2": "12th Floor",
                "dob": "9/26/2006",
                "FY2019-20": "593967",
                "FY2020-21": "691998",
                "FY2021-22": "765226",
                "FY2022-23": "893432",
                "FY2023-24": "992291"
            },
            {
                "id": "9",
                "name": "Glendon",
                "country": "Portugal",
                "email_id": "graoult8@boston.com",
                "gender": "Male",
                "telephone_number": "473-922-8183",
                "state": "Porto",
                "city": "Vila Verde",
                "addr1": "PO Box 4255",
                "addr2": "PO Box 1998",
                "dob": "4/22/2006",
                "FY2019-20": "563961",
                "FY2020-21": "695090",
                "FY2021-22": "791257",
                "FY2022-23": "883935",
                "FY2023-24": "925655"
            },
            {
                "id": "10",
                "name": "Tiphani",
                "country": "Thailand",
                "email_id": "tgentzsch9@rediff.com",
                "gender": "Female",
                "telephone_number": "730-331-7955",
                "state": "",
                "city": "Wat Bot",
                "addr1": "17th Floor",
                "addr2": "Suite 89",
                "dob": "9/18/2001",
                "FY2019-20": "518558",
                "FY2020-21": "683932",
                "FY2021-22": "720123",
                "FY2022-23": "803959",
                "FY2023-24": "928845"
            },
            {
                "id": "11",
                "name": "Maddie",
                "country": "Guinea",
                "email_id": "mgatusa@shop-pro.jp",
                "gender": "Female",
                "telephone_number": "652-142-5706",
                "state": "",
                "city": "Fria",
                "addr1": "Apt 1027",
                "addr2": "Room 1985",
                "dob": "6/11/2009",
                "FY2019-20": "503782",
                "FY2020-21": "639833",
                "FY2021-22": "765876",
                "FY2022-23": "866706",
                "FY2023-24": "904465"
            },
        ]
    const canvas = $(".container .excel canvas")[0]
    const input = $(".container .excel input")[0]
    console.log("🚀 ~ input:", input)
    init(canvas, input, data)

})