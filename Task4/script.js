const courses = [
    {
        "name": "Acceleration",
        "image": "./assets/images/imageMask.png",
        "expired": false,
        "subject": "Physics",
        "grade": {
            "count": 7,
            "additional": 2
        },
        "content": {
            "units": 4,
            "lessons": 18,
            "topics": 24
        },
        "classes": [
            {
                "selected": false,
                "name": "Mr. Frank's Class A",
                "students": 44,
                "date": {
                    "from": "14-Oct-2019",
                    "to": "20-Oct-2020",
                }
            },
            {
                "selected": true,
                "name": "Mr. Frank's Class B",
                "students": 50,
                "date": {
                    "from": "21-Jan-2020",
                    "to": "21-Aug-2020",
                }
            },
        ],
        "starred": true
    },
    {
        "name": "Displacement, Velocity and Speed",
        "image": "./assets/images/imageMask-2.png",
        "expired": false,
        "subject": "Physics 2",
        "grade": {
            "count": 6,
            "additional": 3
        },
        "content": {
            "units": 2,
            "lessons": 15,
            "topics": 20
        },
        "classes": [
        ],

        "starred": true
    },
    {
        "name": "Introduction to biology: Micro organism and how they affect...",
        "image": "./assets/images/imageMask-3.png",
        "expired": true,
        "subject": "Physics",
        "grade": {
            "count": 4,
            "additional": 1
        },
        "content": {
            "units": 2,
            "lessons": 15,
            "topics": 20
        },
        "classes": [
        ],

        "starred": true
    },
    {
        "name": "Displacement, Velocity and Speed",
        "image": "./assets/images/imageMask-1.png",
        "expired": false,
        "subject": "Physics 2",
        "grade": {
            "count": 6,
            "additional": 3
        },
        "content": {
            "units": 2,
            "lessons": 15,
            "topics": 20
        },
        "classes": [
        ],

        "starred": true
    },
    {
        "name": "Acceleration",
        "image": "./assets/images/imageMask.png",
        "expired": false,
        "subject": "Physics",
        "grade": {
            "count": 7,
            "additional": 2
        },
        "content": {
            "units": 4,
            "lessons": 18,
            "topics": 24
        },
        "classes": [
            {
                "selected": false,
                "name": "Mr. Frank's Class A",
                "students": 44,
                "date": {
                    "from": "14-Oct-2019",
                    "to": "20-Oct-2020",
                }
            },
            {
                "selected": true,
                "name": "Mr. Frank's Class B",
                "students": 50,
                "date": {
                    "from": "21-Jan-2020",
                    "to": "21-Aug-2020",
                }
            },
        ],
        "starred": true
    },
    {
        "name": "Displacement, Velocity and Speed",
        "image": "./assets/images/imageMask-2.png",
        "expired": false,
        "subject": "Physics 2",
        "grade": {
            "count": 6,
            "additional": 3
        },
        "content": {
            "units": 2,
            "lessons": 15,
            "topics": 20
        },
        "classes": [
        ],

        "starred": true
    },
    {
        "name": "Introduction to biology: Micro organism and how they affect...",
        "image": "./assets/images/imageMask-3.png",
        "expired": true,
        "subject": "Physics",
        "grade": {
            "count": 4,
            "additional": 1
        },
        "content": {
            "units": 2,
            "lessons": 15,
            "topics": 20
        },
        "classes": [
        ],

        "starred": true
    },
    {
        "name": "Displacement, Velocity and Speed",
        "image": "./assets/images/imageMask-1.png",
        "expired": false,
        "subject": "Physics 2",
        "grade": {
            "count": 6,
            "additional": 3
        },
        "content": {
            "units": 2,
            "lessons": 15,
            "topics": 20
        },
        "classes": [
        ],

        "starred": true
    },
    {
        "name": "Introduction to biology: Micro organism and how they affect...",
        "image": "./assets/images/imageMask-3.png",
        "expired": false,
        "subject": "Physics",
        "grade": {
            "count": 4,
            "additional": 1
        },
        "content": {
            "units": 2,
            "lessons": 15,
            "topics": 20
        },
        "classes": [
        ],

        "starred": true
    },
];


(function () {
    let cardContainer = document.querySelector(".container .grid");
    let cards = courses.map(({
        image,
        name,
        subject,
        grade,
        expired,
        classes,
        content,
        starred,
    }) => `
        <div class="course-card">
        ${expired ? `<div class="expired">EXPIRED</div>` : ``}
        ${starred ?
            `<i class="fa fa-star fa-lg gold"></i>` :
            `<i class="fa fa-star fa-lg"></i>`
        }
            <div class="course-details">
                <img src="${image}" alt="">
                <div class="grow">
                    <div class="title"><b>${name}</b></div>
                    <div class="subject-grade">
                        ${subject} | Grade ${grade.count} <span class="green">+${grade.additional}</span>
                    </div>
                    <div class="subject-grade">
                        <b>${content.units}</b> Units
                        <b>${content.lessons}</b> Lessons
                        <b>${content.topics}</b> Topics
                    </div>
                    <select ${!!!classes.length ? "disabled" : ""}>
                    ${!!!classes.length ? `<option> No classes </option>` : ``}
                    ${classes.map((c, i) => `<option value="name" ${c.selected ? `selected` : ``}>${c.name}</option>`)}
                    </select>
                    <div class="subject-grade">
                       ${[...classes.filter(c => c.selected)].map(e =>
            `${e.students} Students | ${e.date.from} - ${e.date.to}`
        )}
                    </div>
                </div>
            </div>
            <div class="action-buttons">
                <img src="./assets/icons/preview.svg" alt="">
                <img src="./assets/icons/manage course.svg" alt="">
                <img src="./assets/icons/grade submissions.svg" alt="">
                <img src="./assets/icons/reports.svg" alt="">
            </div>
        </div>
    `).join("")
    cardContainer.innerHTML = cards
}())