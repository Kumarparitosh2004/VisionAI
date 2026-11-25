const dropArea = document.querySelector(".upload-card");

["dragenter", "dragover"].forEach(eventName => {
    dropArea.addEventListener(eventName, event => {
        event.preventDefault();
        dropArea.style.background = "#eef0ff";
        dropArea.style.borderColor = "#4f63e8";
    });
});

["dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, event => {
        event.preventDefault();
        dropArea.style.background = "";
        dropArea.style.borderColor = "";
    });
});

dropArea.addEventListener("drop", event => {
    const file = event.dataTransfer.files[0];

    if (!file) return;

    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;

    fileInput.dispatchEvent(new Event("change"));
});