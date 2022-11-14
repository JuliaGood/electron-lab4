const videoSelectBtn = document.getElementById("videoSelectBtn");
const videoElement = document.querySelector("video");
const { desktopCapturer, remote } = require("electron");
const { writeFile } = require("fs");
const { Menu } = remote;
const { dialog } = remote;

videoSelectBtn.onclick = getVideoSourses;

// Get the available video sources
async function getVideoSourses() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"]
  });
  console.log(inputSources);

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionsMenu.popup();



  let mediaRecorder;
  const recordedChunks = [];

  // Change the videoSource window to record
  async function selectSource(source) {
    videoSelectBtn.innerText = source.name;

    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: source.id
        }
      }
    };

    // Create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Preview the source in a video element
    videoElement.srcObject = stream;
    videoElement.play();
    
    // Create the Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;

    const startBtn = document.getElementById("startBtn");
    startBtn.onclick = e => {
      mediaRecorder.start();
      startBtn.classList.add("is-danger");
      startBtn.innerText = "Запись";
    };

    const stopBtn = document.getElementById("stopBtn");
    stopBtn.onclick = e => {
      mediaRecorder.stop();
      startBtn.classList.remove("is-danger");
      startBtn.innerText = "Старт";
    };


    // Captures all recorded chunks
    function handleDataAvailable(e) {
      console.log("Видео записано!");
      recordedChunks.push(e.data);
    }

    // Saves the video file on stop
    async function handleStop(e) {
      videoElement.srcObject = null;
      
      const blob = new Blob(recordedChunks, {
        type: "video/webm; codecs=vp9"
      });

      const buffer = Buffer.from(await blob.arrayBuffer());

      const fileName = `vid-${Date.now()}.webm`;
      const { filePath } = await dialog.showSaveDialog({
        buttonLabel: "Save video",
        defaultPath: fileName
      });

      console.log(filePath);

      writeFile(filePath, buffer, () => console.log("video saved successfully!"));
    }

  }
}

// Создать кнопку открытия сохраненных видеофайлов и проигрывания их в приложении 
const openBtn = document.getElementById("openBtn");
openBtn.innerText = "Открыть";

openBtn.onclick = (e) => {
  if (e.target.innerText === "Открыть") {
    dialog.showOpenDialog({
      properties: ['openFile']
    }).then((result) => {
      console.log("result", result);
      const filePath = result.filePaths[0];

      if (filePath) {
        videoElement.src = filePath;
        videoElement.play();
        openBtn.innerText = "Закрыть";
        openBtn.classList.add("is-danger");
      }
    });
  } else {
    videoElement.src = null;
    openBtn.innerText = "Открыть";
    openBtn.classList.remove("is-danger");
  }
};
