const mainContainer = document.getElementById("mainContainer");

const templates = {};
let cameraPermission = null;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("template").forEach(template => {
    templates[template.id] = template;
  });
});

window.onload = onLoad;

async function onLoad() {
  try {
    cameraPermission =
      cameraPermission ??
      (await navigator.permissions.query({ name: "camera" }));

    if (cameraPermission.state === "granted") {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      onCameraPermissionGranted(stream);
    } else {
      const template = templates["cameraPermissionTemplate"];
      const clone = document.importNode(template.content, true);
      mainContainer.appendChild(clone);

      const cameraPermissionButton = document.getElementById(
        "cameraPermissionbutton"
      );

      cameraPermissionButton.addEventListener("click", async () => {
        try {
          if (
            "mediaDevices" in navigator &&
            "getUserMedia" in navigator.mediaDevices
          ) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true
            });
            onCameraPermissionGranted(stream);
          }
        } catch (error) {
          alert("Camera permission denied");
        }
      });
    }
  } catch (error) {
    console.log("🚀 ~ window.onload= ~ error:", error);
    alert("Error getting camera permission status");
  }
}

function onCameraPermissionGranted(stream) {
  const template = templates["scanQRTemplate"];
  const clone = document.importNode(template.content, true);
  mainContainer.innerHTML = "";
  mainContainer.appendChild(clone);

  const video = document.getElementById("cameraView");
  const canvasElement = document.getElementById("canvas");
  const canvas = canvasElement.getContext("2d");

  video.srcObject = stream;
  video.play();
  requestAnimationFrame(() => tick(video, canvasElement, canvas));
}

function tick(video, canvasElement, canvas) {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
    const imageData = canvas.getImageData(
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      const txData = processData(code.data);
      // Stop the video stream after finding a QR code
      video.srcObject.getTracks().forEach(track => track.stop());

      showTxInfo(txData);
    }
  }
  requestAnimationFrame(() => tick(video, canvasElement, canvas));
}

function processData(data) {
  // decode the base64 data
  const decodedData = Base64.toUint8Array(data);
  // inflate the data
  const inflatedData = fflate.inflateSync(decodedData);
  // decode the inflated data
  const tx = new TextDecoder().decode(inflatedData);
  // parse the tx and calculate the hash
  const parsedTx = json.parse(tx);
  const txHash = calculateInvokeTransactionHash(parsedTx);
  return { tx, txHash };
}

function showTxInfo(txData) {
  const { tx, txHash } = txData;
  const prettifiedTx = jsonFormatter.format(tx, "\t");
  const prettifiedTxHash = addHexPrefix(removeHexPrefix(txHash).toUpperCase());

  const template = templates["airGappedData"];
  const clone = document.importNode(template.content, true);

  // Tx Hash
  clone.querySelector("#tx-hash-content").textContent = prettifiedTxHash;

  // Raw Data
  const pre = document.createElement("pre");
  pre.textContent = prettifiedTx;
  pre.className = "tx-data";
  clone.querySelector("#raw-data-content").appendChild(pre);

  mainContainer.innerHTML = "";
  mainContainer.appendChild(clone);

  const copyTxHashButton = document.getElementById("copyTxHash");
  copyTxHashButton.addEventListener("click", () => {
    copyToClipboard(txHash);
  });

  const copyRawDataButton = document.getElementById("copyRawData");
  copyRawDataButton.addEventListener("click", () => {
    copyToClipboard(tx);
  });

  const restoreButton = document.getElementById("restoreButton");
  restoreButton.addEventListener("click", onRestore);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error("Copy failed", error);
  }
}

function onRestore() {
  mainContainer.innerHTML = "";
  return onLoad();
}
