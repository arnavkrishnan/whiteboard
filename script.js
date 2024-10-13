const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 40; // Adjust for margins
canvas.height = window.innerHeight - 100; // Adjust for toolbar height

let drawing = false;
let erasing = false;
let currentTool = 'draw';
let currentColor = '#000000';
let currentSize = 2;
let images = [];
let selectedImage = null;

// Event listeners for mouse actions
canvas.addEventListener('mousedown', (e) => {
    if (selectedImage) {
        // Check if clicked on image
        const { x, y, width, height } = selectedImage;
        if (e.offsetX >= x && e.offsetX <= x + width && e.offsetY >= y && e.offsetY <= y + height) {
            selectedImage.isDragging = true;
            return;
        }
    }

    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
    if (drawing) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = currentTool === 'highlighter' ? currentColor : currentColor;
        ctx.lineWidth = currentTool === 'highlighter' ? currentSize * 2 : currentSize;
        ctx.globalAlpha = currentTool === 'highlighter' ? 0.5 : 1; // Set transparency for highlighter
        ctx.stroke();
    }

    // If an image is selected and dragging, update its position
    if (selectedImage && selectedImage.isDragging) {
        selectedImage.x = e.offsetX - selectedImage.width / 2;
        selectedImage.y = e.offsetY - selectedImage.height / 2;
        redrawCanvas();
    }
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
    ctx.closePath();
    if (selectedImage) {
        selectedImage.isDragging = false;
    }
});

canvas.addEventListener('mouseout', () => {
    drawing = false;
    ctx.closePath();
});

// Toolbar button actions
document.getElementById('draw').addEventListener('click', () => {
    erasing = false;
    currentTool = 'draw';
    ctx.globalAlpha = 1; // Reset alpha for marker
    canvas.style.cursor = 'crosshair';
});

document.getElementById('highlighter').addEventListener('click', () => {
    erasing = false;
    currentTool = 'highlighter';
    ctx.globalAlpha = 0.5; // Set transparency for highlighter
    canvas.style.cursor = 'url("highlighter_cursor.png"), auto'; // Change cursor to highlighter cursor
});

document.getElementById('erase').addEventListener('click', () => {
    erasing = true;
    currentTool = 'erase';
    ctx.strokeStyle = 'white'; // Set eraser color to white
    ctx.lineWidth = currentSize; // Set line width for eraser
    canvas.style.cursor = 'url("eraser_cursor.png"), auto'; // Change cursor to eraser cursor
});

document.getElementById('clear').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    images = []; // Clear images
});

document.getElementById('colorPicker').addEventListener('input', (e) => {
    currentColor = e.target.value;
    if (!erasing) {
        ctx.strokeStyle = currentColor;
    }
});

document.getElementById('sizePicker').addEventListener('input', (e) => {
    currentSize = e.target.value;
});

// Fill tool implementation
document.getElementById('fill').addEventListener('click', () => {
    const fillColor = currentColor;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Get fill click position
    canvas.addEventListener('click', (e) => {
        const x = e.offsetX;
        const y = e.offsetY;
        const targetColor = [
            data[(y * canvas.width + x) * 4],
            data[(y * canvas.width + x) * 4 + 1],
            data[(y * canvas.width + x) * 4 + 2],
        ];

        if (JSON.stringify(targetColor) === JSON.stringify([255, 255, 255, 255])) return; // Prevent fill on empty areas

        const stack = [[x, y]];

        while (stack.length) {
            const [nx, ny] = stack.pop();
            const index = (ny * canvas.width + nx) * 4;

            // Check boundaries and if it matches target color
            if (nx < 0 || nx >= canvas.width || ny < 0 || ny >= canvas.height ||
                data[index] !== targetColor[0] || data[index + 1] !== targetColor[1] || data[index + 2] !== targetColor[2]) {
                continue;
            }

            // Change the pixel color
            data[index] = parseInt(fillColor.slice(1, 3), 16);
            data[index + 1] = parseInt(fillColor.slice(3, 5), 16);
            data[index + 2] = parseInt(fillColor.slice(5, 7), 16);
            data[index + 3] = 255; // Set full opacity

            stack.push([nx + 1, ny]);
            stack.push([nx - 1, ny]);
            stack.push([nx, ny + 1]);
            stack.push([nx, ny - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
    });

    canvas.style.cursor = 'url("fill_bucket_cursor.png"), auto'; // Change cursor to fill bucket cursor
});

// Allow image pasting
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const imgObject = {
                        image: img,
                        x: 50,
                        y: 50,
                        width: img.width / 4,
                        height: img.height / 4,
                        isDragging: false,
                    };
                    images.push(imgObject);
                    redrawCanvas();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
});

// Redraw all images on the canvas
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    images.forEach(img => {
        ctx.drawImage(img.image, img.x, img.y, img.width, img.height);
    });
}

// Resize event to adjust canvas
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth - 40;
    canvas.height = window.innerHeight - 100;
    redrawCanvas(); // Redraw images after resizing
});
