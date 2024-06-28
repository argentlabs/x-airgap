const cameraPermissionButton = document.getElementById(
  "cameraPermissionbutton"
);

window.onload = async () => {
  try {
    const permission = await navigator.permissions.query({ name: "camera" });

    if (permission.state === "granted") {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      onCameraPermissionGranted(stream);
    } else {
      const template = document.getElementById("cameraPermissionTemplate");
      const clone = document.importNode(template.content, true);
      document.getElementById("mainContainer").appendChild(clone);

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
};

function onCameraPermissionGranted(stream) {
  const template = document.getElementById("scanQRTemplate");
  const clone = document.importNode(template.content, true);
  document.getElementById("mainContainer").appendChild(clone);

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
      processData(code.data);
      // Stop the video stream after finding a QR code
      video.srcObject.getTracks().forEach(track => track.stop());
    }
  }
  requestAnimationFrame(() => tick(video, canvasElement, canvas));
}

async function processData(data) {
  const decodedData = Base64.toUint8Array(data);
  console.log("🚀 ~ processData ~ decodedData:", decodedData);
  const inflatedData = fflate.inflateSync(decodedData);
  console.log("🚀 ~ processData ~ inflatedData:", inflatedData);
  const textDecoder = new TextDecoder();
  const tx = textDecoder.decode(inflatedData);
  console.log("🚀 ~ processData ~ unparsed tx:", tx);

  const parsedTx = json.parse(tx);
  console.log("🚀 ~ processData ~ parsed tx:", parsedTx);

  const txHash = calculateInvokeTransactionHash(parsedTx);
  console.log("🚀 ~ processData ~ txHash:", txHash);
}
