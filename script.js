const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 40; // Adjust for margins
canvas.height = window.innerHeight - 100; // Adjust for toolbar height

let drawing = false;
let erasing = false;

// Event listeners for mouse actions
canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
    if (drawing) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = erasing ? 'white' : 'black';
        ctx.lineWidth = erasing ? 20 : 2;
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
    ctx.strokeStyle = 'black';
});

document.getElementById('erase').addEventListener('click', () => {
    erasing = true;
    ctx.strokeStyle = 'white';
});

document.getElementById('clear').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
                    ctx.drawImage(img, 50, 50, img.width / 4, img.height / 4); // Adjust size as needed
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
});
