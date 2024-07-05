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
    const headers = Object.keys(data[0])

    const canvas = $(".container .excel canvas")[0]
    const colheight = 30;
    const colwidth = 120;
    const strlimit = 12
    const ctx = canvas.getContext("2d")

    canvas.setAttribute("height", data.length * colheight)
    canvas.setAttribute("width", headers.length * colwidth)

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.font = "16px Arial";

    for (let j = 0; j < headers.length; j++) {
        let title = headers[j];
        title = title?.length > strlimit ? title.substring(0, strlimit) + "..." : title

        ctx.strokeRect(colwidth * j, 0, colwidth, colheight);
        ctx.fillText(title, j * colwidth + 5, colheight - 5)
    }

    for (let i = 1; i < data.length; i++) {
        for (let j = 0; j < headers.length; j++) {
            let value = data[i][headers[j]];
            value = value?.length > strlimit ? value.substring(0, strlimit) + "..." : value

            ctx.strokeRect(colwidth * j, i * colheight, colwidth, colheight);
            ctx.fillText(value, j * colwidth + 4, i * colheight + 26)
            // const metrics = context.measureText(value);
            // const width = metrics.width;
        }
    }


    canvas.addEventListener("mousemove", function(event){
        console.log(event)
    })
})