const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const workspace = document.getElementById("workspace");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const histogram = document.getElementById("histogram");
const hctx = histogram.getContext("2d");

let originalImageData = null;
let currentFile = null;

// 1. Open file browser
browseBtn.addEventListener("click", () => {
    fileInput.click();
});

// 2. Upload and validate image
fileInput.addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!validTypes.includes(file.type)) {
        alert("Please select JPG, PNG or WEBP image.");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert("Image must be smaller than 10 MB.");
        return;
    }

    currentFile = file;

    const image = new Image();
    const imageURL = URL.createObjectURL(file);

    image.onload = () => {
        const maxDimension = 1600;
        const scale = Math.min(
            1,
            maxDimension / Math.max(image.width, image.height)
        );

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        originalImageData = ctx.getImageData(
            0, 0, canvas.width, canvas.height
        );

        showInformation(file, image);
        analyzeImage();
        workspace.hidden = false;

        URL.revokeObjectURL(imageURL);
    };

    image.onerror = () => {
        alert("Unable to load this image.");
        URL.revokeObjectURL(imageURL);
    };

    image.src = imageURL;
    fileInput.value = "";
});

// 3. Display image information
function showInformation(file, image) {
    document.getElementById("width").textContent =
        image.width + " px";

    document.getElementById("height").textContent =
        image.height + " px";

    document.getElementById("size").textContent =
        (file.size / 1024).toFixed(2) + " KB";

    document.getElementById("format").textContent =
        file.type.split("/")[1].toUpperCase();

    document.getElementById("pixels").textContent =
        (canvas.width * canvas.height).toLocaleString();
}

// 4. Analyze image properties
function analyzeImage() {
    const data = originalImageData.data;

    let brightness = 0;
    let total = 0;
    let histogramR = new Array(256).fill(0);
    let histogramG = new Array(256).fill(0);
    let histogramB = new Array(256).fill(0);

    const colors = {};

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const light = 0.299 * r + 0.587 * g + 0.114 * b;

        brightness += light;
        total++;

        histogramR[r]++;
        histogramG[g]++;
        histogramB[b]++;

        // Approximate color grouping
        const key = [
            Math.round(r / 32) * 32,
            Math.round(g / 32) * 32,
            Math.round(b / 32) * 32
        ].map(v => Math.min(255, v)).join(",");

        colors[key] = (colors[key] || 0) + 1;
    }

    const average = brightness / total;

    let variance = 0;

    for (let i = 0; i < data.length; i += 4) {
        const light =
            0.299 * data[i] +
            0.587 * data[i + 1] +
            0.114 * data[i + 2];

        variance += Math.pow(light - average, 2);
    }

    const contrast = Math.sqrt(variance / total);

    document.getElementById("brightness").textContent =
        average.toFixed(1) + " / 255";

    document.getElementById("contrast").textContent =
        contrast.toFixed(1) + " / 255";

    showPalette(colors);
    drawHistogram(histogramR, histogramG, histogramB);
}

// 5. Display dominant colors
function showPalette(colors) {
    const sorted = Object.entries(colors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    const palette = document.getElementById("palette");
    palette.innerHTML = "";

    sorted.forEach(([color]) => {
        const rgb = color.split(",").map(Number);
        const hex = "#" + rgb.map(v =>
            v.toString(16).padStart(2, "0")
        ).join("");

        const item = document.createElement("div");
        item.className = "color-item";

        const swatch = document.createElement("div");
        swatch.className = "swatch";
        swatch.style.backgroundColor = `rgb(${color})`;

        const label = document.createElement("span");
        label.textContent = hex;

        item.append(swatch, label);
        palette.appendChild(item);
    });
}

// 6. Draw RGB histogram
function drawHistogram(r, g, b) {
    hctx.clearRect(0, 0, histogram.width, histogram.height);

    const max = Math.max(...r, ...g, ...b, 1);
    const width = histogram.width;
    const height = histogram.height;

    const channels = [
        { values: r, color: "rgba(239,68,68,0.65)" },
        { values: g, color: "rgba(34,197,94,0.65)" },
        { values: b, color: "rgba(59,130,246,0.65)" }
    ];

    channels.forEach(channel => {
        hctx.beginPath();
        hctx.strokeStyle = channel.color;
        hctx.lineWidth = 1.5;

        channel.values.forEach((value, i) => {
            const x = (i / 255) * width;
            const y = height - (value / max) * (height - 5);

            if (i === 0) hctx.moveTo(x, y);
            else hctx.lineTo(x, y);
        });

        hctx.stroke();
    });
}

// 7. Image filters
function applyFilter(type) {
    if (!originalImageData) return;

    const output = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        canvas.width,
        canvas.height
    );

    const data = output.data;
    const width = canvas.width;
    const height = canvas.height;

    if (type === "grayscale") {
        for (let i = 0; i < data.length; i += 4) {
            const gray =
                0.299 * data[i] +
                0.587 * data[i + 1] +
                0.114 * data[i + 2];

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
    }

    else if (type === "invert") {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
    }

    else if (type === "edge") {
        const source = originalImageData.data;

        function grayAt(x, y) {
            const i = (y * width + x) * 4;
            return (
                0.299 * source[i] +
                0.587 * source[i + 1] +
                0.114 * source[i + 2]
            );
        }

        // Sobel edge detection
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const gx =
                    -grayAt(x - 1, y - 1) + grayAt(x + 1, y - 1) +
                    -2 * grayAt(x - 1, y) + 2 * grayAt(x + 1, y) +
                    -grayAt(x - 1, y + 1) + grayAt(x + 1, y + 1);

                const gy =
                    -grayAt(x - 1, y - 1) - 2 * grayAt(x, y - 1) -
                    grayAt(x + 1, y - 1) +
                    grayAt(x - 1, y + 1) +
                    2 * grayAt(x, y + 1) +
                    grayAt(x + 1, y + 1);

                const edge = Math.min(255, Math.hypot(gx, gy));
                const i = (y * width + x) * 4;

                data[i] = edge;
                data[i + 1] = edge;
                data[i + 2] = edge;
                data[i + 3] = 255;
            }
        }
    }

    ctx.putImageData(output, 0, 0);
}

// 8. Filter buttons
document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
        const type = button.dataset.filter;

        if (!originalImageData) return;

        if (type === "original") {
            ctx.putImageData(originalImageData, 0, 0);
        } else {
            applyFilter(type);
        }
    });
});

// 9. Download processed image
document.getElementById("downloadBtn").addEventListener("click", () => {
    if (!originalImageData) return;

    canvas.toBlob(blob => {
        if (!blob) {
            alert("Unable to export image.");
            return;
        }

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = "VisionAI-processed.png";
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
});

// 10. Reset application
document.getElementById("resetBtn").addEventListener("click", () => {
    originalImageData = null;
    currentFile = null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hctx.clearRect(0, 0, histogram.width, histogram.height);

    workspace.hidden = true;
    document.getElementById("palette").textContent =
        "Upload an image to analyze colors.";
});