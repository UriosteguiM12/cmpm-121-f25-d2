import "./style.css";

// Creating the title
const title = document.createElement("h1");
title.textContent = "D2 Canvas";
document.body.appendChild(title);

// Create a canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "game-canvas";
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

// Creating the buttons
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";

// Centering
const buttonContainer = document.createElement("div");
buttonContainer.className = "button-container";
buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);

document.body.appendChild(buttonContainer);

// create a custom type for the arrays
interface Point {
  x: number;
  y: number;
}

// Arrays to store points
const drawingPoints: Point[][] = [];
let currentDisplay: Point[] = [];
//let redoPoints: Point[][] = [];

// Draw
const cursor = { active: false, x: 0, y: 0 };

// Create a new path
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  currentDisplay = [{ x: e.offsetX, y: e.offsetY }];
  drawingPoints.push(currentDisplay);
  //redoPoints.length = 0; // clear redo stack when starting a new path
});

// Add points to the current display
canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active) return;
  currentDisplay.push({ x: e.offsetX, y: e.offsetY });
  canvas.dispatchEvent(new Event("dirty"));
});

// Drawing has stopped
canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

// Redraw the canvas if made dirty
canvas.addEventListener("dirty", () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  for (const path of drawingPoints) {
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
    }
  }
  ctx.stroke();
});

// Click Logic
clearButton.addEventListener("click", () => {
  drawingPoints.length = 0;
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
});
