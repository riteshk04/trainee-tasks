const files = [
    {
        id: 1,
        name: "filename.csv",
        size: 3000000,
        dateUploaded: 1720096640,
        dateModified: 1720096640,
    },
    {
        id: 1,
        name: "filename.csv",
        size: 3000000,
        dateUploaded: 1720096640,
        dateModified: 1720096640,
    }
];

const fileUploadMarkup = (name, size) => {
    return `
    <div class="file">
        <img src="./assets/images/fileicon.png" alt="">
        <div class="content">
            <i class="fa fa-close"></i>
            <div class="title">${name}</div>
            <div class="size">${size/1000}KB</div>
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
        </div>
    </div>`
}

$(function () {
    const uploadingFiles = [];

    $(".upload-csv-btn").click(function () {
        $(".dialogue-wrapper").toggleClass("hidden");
    })
    $(".close-dialogue-btn").click(function () {
        $(".dialogue-wrapper").toggleClass("hidden");
    })
    $(".file-uploads").html(files.map(f => fileUploadMarkup(f.name, f.size)))
})