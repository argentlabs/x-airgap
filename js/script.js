const cameraPermissionButton = document.getElementById(
  "cameraPermissionbutton"
);

cameraPermissionButton.addEventListener("click", async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    alert("Camera permission granted");
  } catch (error) {
    alert("Camera permission denied");
  }
});
