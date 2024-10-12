const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 40; // Adjust for margins
canvas.height = window.innerHeight - 100; // Adjust for toolbar height

let drawing = false;
let erasing = false;
let currentTool = 'draw';
let currentColor = '#000000';
let currentSize = 2;

// Event listeners for mouse actions
canvas.addEventListener('mousedown', (e) => {
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
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
    ctx.closePath();
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
});

document.getElementById('highlighter').addEventListener('click', () => {
    erasing = false;
    currentTool = 'highlighter';
});

document.getElementById('erase').addEventListener('click', () => {
    erasing = true;
    currentTool = 'erase';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = currentSize;
});

document.getElementById('clear').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

// Fill tool
document.getElementById('fill').addEventListener('click', () => {
    const fillColor = currentColor;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple flood fill algorithm
    const stack = [];
    const x = Math.floor(canvas.width / 2);
    const y = Math.floor(canvas.height / 2);
    const targetColor = [data[(y * canvas.width + x) * 4], data[(y * canvas.width + x) * 4 + 1], data[(y * canvas.width + x) * 4 + 2]];
    
    if (JSON.stringify(targetColor) === JSON.stringify([0, 0, 0, 0])) return; // Do not fill if clicked on non-fillable area
    
    stack.push([x, y]);

    while (stack.length) {
        const [nx, ny] = stack.pop();
        const index = (ny * canvas.width + nx) * 4;

        // Check boundaries and color
        if (nx < 0 || nx >= canvas.width || ny < 0 || ny >= canvas.height || JSON.stringify(data.slice(index, index + 3)) !== JSON.stringify(targetColor)) {
            continue;
        }

        // Change color
        data[index] = parseInt(fillColor.slice(1, 3), 16);
        data[index + 1] = parseInt(fillColor.slice(3, 5), 16);
        data[index + 2] = parseInt(fillColor.slice(5, 7), 16);
        data[index + 3] = 255; // Alpha

        stack.push([nx + 1, ny]);
        stack.push([nx - 1, ny]);
        stack.push([nx, ny + 1]);
        stack.push([nx, ny - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
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
                    let imgWidth = img.width / 4;
                    let imgHeight = img.height / 4; // Default size
                    let startX = 50;
                    let startY = 50;

                    // Prompt for size adjustment
                    const newSize = prompt(`Enter size (width, height) for image: (${imgWidth}, ${imgHeight})`, `${imgWidth},${imgHeight}`);
                    if (newSize) {
                        const sizes = newSize.split(',');
                        imgWidth = parseInt(sizes[0]) || imgWidth;
                        imgHeight = parseInt(sizes[1]) || imgHeight;
                    }

                    ctx.drawImage(img, startX, startY, imgWidth, imgHeight);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
});
