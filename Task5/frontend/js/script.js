const uploadedFiles = [];


const fileUploadMarkup = (id, name, size, progress) => {
    return `
    <div class="file" data-id="${id}">
        <img src="./assets/images/fileicon.png" alt="">
        <div class="content">
            <i class="fa fa-close"></i>
            <div class="title">${name}</div>
            <div class="size">${size / 1000}KB</div>
            <div class="progress-bar">
                <div class="progress" style="width: ${progress}%"></div>
            </div>
        </div>
    </div>`
}

const fileCardMarkup = ({
    id,
    name,
    size,
    dateModified,
    dateUploaded
}) => {
    return `
    <div class="file-card" data-id="${id}">
        <div class="menus">
            <i class="fas fa-ellipsis-v"></i>
            <div class="menu-content">
                <button class="menu-item"><i class="fa fa-circle-info"></i> Info</button>
                <button class="menu-item"><i class="fa-solid fa-arrow-up-right-from-square"></i>
                    Open</button>
                <button class="menu-item delete-btn" data-id="${id}"><i class="fa fa-trash"></i> Delete</button>
            </div>
        </div>
        <img src="./assets/images/fileicon.png" alt="">
        <div class="card-content">
            <div class="card-title">${name}</div>
            <div class="text-muted">Size: ${size / 1000}KB</div>
            <div class="dates">
                <div class="date-uploaded">Uploaded: ${new Date(dateUploaded).toString().split(" ").filter((e, i) => i < 4).join(" ")}</div>
                <d4v class="date-modified">Modified: ${new Date(dateModified).toString().split(" ").filter((e, i) => i < 4).join(" ")}</div>
            </div>
        </div>
    </div>`
}

function fileListRefresher() {
    if (uploadedFiles.length) {
        if ($(".files-wrapper").hasClass("hidden")) {
            $(".files-wrapper").toggleClass("hidden")
        }
        let markup = uploadedFiles.map((file, id) => fileCardMarkup({ id, ...file }))
        $(".files-wrapper .files").html(markup);
        $(".files-empty").hide()
    } else {
        if (!$(".files-wrapper").hasClass("hidden")) {
            $(".files-wrapper").toggleClass("hidden")
        }
        $(".files-empty").show()
    }
    $(".file-uploads").html(uploadedFiles.map((f, i) => fileUploadMarkup(i, f.name, f.size, 100)))

    $(".file-uploads .file .fa.fa-close").click(function () {
        uploadedFiles.splice($(this).attr("data-id"), 1)
        $(this).parent().parent().remove()
        fileListRefresher()
    })

    $(".file-card .delete-btn").click(function () {
        let index = parseInt($(this).parent().attr("data-id"))
        uploadedFiles.splice(index, 1)
        fileListRefresher()
    })
}

async function getJSON(file) {
    return new Promise((res, rej) => {
        let json = []
        let fread = new FileReader()
        fread.onload = (e) => {
            let raw = e.target.result.trim();
            let rows = raw.split("\n")
            let headers = rows[0].split(",")
            for (let i = 1; i < rows.length; i++) {
                let object = {}
                for (let j = 0; j < headers.length; j++) {
                    object[headers[j]] = rows[i].split(",")[j]
                }
                json.push(object)
            }
            res(json)
        }
        fread.onerror = (e) => {
            rej(e)
        }
        fread.readAsText(file)
    })
}

$(function () {

    $(".upload-csv-btn").click(function () {
        $(".dialogue-wrapper").toggleClass("hidden");
    })
    $(".close-dialogue-btn").click(function () {
        $(".dialogue-wrapper").toggleClass("hidden");
    })

    $("#fileuploader").change(async function (event) {
        let files = event.target.files
        if (!files.length) {
            alert("No files selected")
        } else {
            for (let file of files) {
                let data = await getJSON(file)
                let time = new Date().getTime();
                let payload = {
                    name: file.name,
                    size: file.size,
                    dateUploaded: time,
                    dateModified: time,
                    data: data
                }
                uploadedFiles.push(payload)
            }
        }
        fileListRefresher()
    })

    $(".file-upload-btn").click(function () {
        if (!uploadedFiles.length) {
            alert("No files uploaded")
            return
        }
        $(".dialogue-wrapper").toggleClass("hidden");
    })
})
