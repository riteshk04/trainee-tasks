let uploadedFiles = [];
const FILEUPLOAD_API_URL = "http://localhost:5165/api/Files";

const fileUploadMarkup = (id, name, size, progress) => {
  return `
    <div class="file" data-id="${id}">
        <img src="./images/fileicon.png" alt="">
        <div class="content">
            <i class="fa fa-close"></i>
            <div class="title">${name}</div>
            <div class="size">${Math.round((size * 10) / 1024) / 10}KB</div>
            <div class="progress-bar">
                <div class="progress" style="width: ${progress}%"></div>
            </div>
        </div>
    </div>`;
};

const fileCardMarkup = ({ id, name, size, modified, uploaded }) => {
  return `
    <div class="file-card" data-id="${id}">
        <div class="menus">
            <i class="fas fa-ellipsis-v"></i>
            <div class="menu-content">
                <button class="menu-item"><i class="fa fa-circle-info"></i> Info</button>
                <button class="menu-item open-btn" data-id="${id}"><i class="fa-solid fa-arrow-up-right-from-square"></i>
                    Open</button>
                <button class="menu-item delete-btn" data-id="${id}"><i class="fa fa-trash"></i> Delete</button>
            </div>
        </div>
        <img src="./images/fileicon.png" alt="">
        <div class="card-content open-btn" data-id="${id}">
            <div class="card-title">${name}</div>
            <div class="text-muted">Size: ${
              Math.floor((size * 10) / 1024) / 10
            }KB</div>
            <div class="dates">
                <div class="date-uploaded">Uploaded: ${new Date(uploaded)
                  .toString()
                  .split(" ")
                  .filter((e, i) => i < 4)
                  .join(" ")}</div>
                <d4v class="date-modified">Modified: ${new Date(modified)
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

  const filesMarkup = [];
  const updateFileProgress = async (f) => {
    const response = await fetch(FILEUPLOAD_API_URL + "/" + f.id + "/status");
    response.json().then((chunkCount) => {
      uploadedFiles[uploadedFiles.indexOf(f)].progress =
        (chunkCount * 100) / f.chunkCount;
      filesMarkup.push(fileUploadMarkup(f.id, f.name, f.size, f.progress));
      if(f.progress < 100){
        updateFileProgress(f);
      }
    });
  };

  Promise.all(uploadedFiles.map(updateFileProgress)).then(() => {
    $(".file-uploads").html(filesMarkup.join(""));
  });
  console.log(uploadedFiles);

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

  $(".file-card .open-btn").click(function () {
    let id = parseInt($(this).attr("data-id"));
    window.open(
      window.location.origin + "/Task5/frontend/canva.html?id=" + id,
      "_blank"
    );
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
        const payload = {
          name: file.name,
          extension: file.type.split("/")[1],
          progress: 0,
          size: file.size,
          data: data,
          file: -1,
        };

        fetch(FILEUPLOAD_API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
        }).then((response) => {
          response.json().then((data) => {
            uploadedFiles.push(data);
            fileListRefresher();
            console.log(uploadedFiles);
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

  $(".new-file-btn").click(function () {
    fetch(FILEUPLOAD_API_URL, {
      method: "POST",
      body: JSON.stringify({
        name: "untitled.csv",
        extension: "csv",
        progress: 0,
        size: 1024,
        data: "",
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
  });

  function getAllFiles() {
    fetch(FILEUPLOAD_API_URL).then((response) => {
      response.json().then((data) => {
        uploadedFiles = data;
        fileListRefresher();
        // if (fileRefresherInterval) clearInterval(fileRefresherInterval);
        // fileRefresherInterval = setInterval(() => {
        //   uploadedFiles.some((f) => f.progress < 100) && getAllFiles();
        // }, 4000);
      });
    });
  }
  getAllFiles();
});
