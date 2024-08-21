let uploadedFiles = [];
const FILEUPLOAD_API_URL = "http://localhost:5165/api/Files";

const fileUploadMarkup = (id, name, size, progress) => {
  return `
    <div class="file" data-id="${id}">
        <img src="./images/fileicon.png" alt="">
        <div class="content">
            <i class="fa fa-close"></i>
            <div class="title">${name}</div>
            <div class="size">${size / 1000}KB</div>
            <div class="progress-bar">
                <div class="progress" style="width: ${progress}%"></div>
            </div>
        </div>
    </div>`;
};

const fileCardMarkup = ({ id, name, size, dateModified, dateUploaded }) => {
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
        <img src="./images/fileicon.png" alt="">
        <div class="card-content">
            <div class="card-title">${name}</div>
            <div class="text-muted">Size: ${size / 1000}KB</div>
            <div class="dates">
                <div class="date-uploaded">Uploaded: ${new Date(dateUploaded)
                  .toString()
                  .split(" ")
                  .filter((e, i) => i < 4)
                  .join(" ")}</div>
                <d4v class="date-modified">Modified: ${new Date(dateModified)
                  .toString()
                  .split(" ")
                  .filter((e, i) => i < 4)
                  .join(" ")}</div>
            </div>
        </div>
    </div>`;
};

function fileListRefresher() {
  if (uploadedFiles.length) {
    if ($(".files-wrapper").hasClass("hidden")) {
      $(".files-wrapper").toggleClass("hidden");
    }
    let markup = uploadedFiles.map((file, id) =>
      fileCardMarkup({ id, ...file })
    );
    $(".files-wrapper .files").html(markup);
    $(".files-empty").hide();
  } else {
    if (!$(".files-wrapper").hasClass("hidden")) {
      $(".files-wrapper").toggleClass("hidden");
    }
    $(".files-empty").show();
  }
  $(".file-uploads").html(
    uploadedFiles
      .filter((f) => f.progress < 100)
      .map((f, i) => fileUploadMarkup(i, f.name, f.size, 100))
  );

  $(".file-uploads .file .fa.fa-close").click(function () {
    uploadedFiles.splice($(this).attr("data-id"), 1);
    $(this).parent().parent().remove();
    fileListRefresher();
  });

  $(".file-card .delete-btn").click(function () {
    let id = parseInt($(this).attr("data-id"));
    fetch(FILEUPLOAD_API_URL + "/" + id, {
      method: "DELETE",
    }).then(() => {
      const index = uploadedFiles.findIndex((f) => f.id === id);
      uploadedFiles.splice(index, 1);
      fileListRefresher();
    });
  });
}

$(function () {
  $(".upload-csv-btn").click(function () {
    $(".dialogue-wrapper").toggleClass("hidden");
  });
  $(".close-dialogue-btn").click(function () {
    $(".dialogue-wrapper").toggleClass("hidden");
  });

  $("#fileuploader").change(function (event) {
    let files = event.target.files;
    if (!files.length) {
      alert("No files selected");
    } else {
      const reader = new FileReader();
      const file = files[0];

      reader.onload = function (event) {
        const data = event.target.result;

        fetch(FILEUPLOAD_API_URL, {
          method: "POST",
          body: JSON.stringify({
            name: file.name,
            extension: file.type.split("/")[1],
            progress: 0,
            size: file.size,
            data: data,
            file: -1,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }).then((response) => {
          response.json().then((data) => {
            uploadedFiles.push(data);
            fileListRefresher();
          });
        });
      };

      reader.onerror = function () {
        console.log("File could not be read! Code " + reader.error.code);
      };

      reader.readAsText(file);
    }
  });

  $(".file-upload-btn").click(function () {
    if (!uploadedFiles.length) {
      alert("No files uploaded");
      return;
    }
    $(".dialogue-wrapper").toggleClass("hidden");
  });

  fetch(FILEUPLOAD_API_URL).then((response) => {
    response.json().then((data) => {
      uploadedFiles = data;
      fileListRefresher();
    });
  });
});