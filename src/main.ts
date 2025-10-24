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

const thinButton = document.createElement("button");
thinButton.textContent = "thin";

const thickButton = document.createElement("button");
thickButton.textContent = "thick";

const pizzaButton = document.createElement("button");
pizzaButton.textContent = "🍕";

const catButton = document.createElement("button");
catButton.textContent = "🐱";

const cactusButton = document.createElement("button");
cactusButton.textContent = "🌵";

// Centering
const buttonContainer = document.createElement("div");
buttonContainer.className = "button-container";
buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);
buttonContainer.appendChild(thinButton);
buttonContainer.appendChild(thickButton);
buttonContainer.appendChild(pizzaButton);
buttonContainer.appendChild(catButton);
buttonContainer.appendChild(cactusButton);

document.body.appendChild(buttonContainer);

let currentThickness = 2;
const _currentSticker: string | null = null;

// create a custom type for the arrays
interface Point {
  x: number;
  y: number;
}

// add an interface for drawable objects
interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

// create a command class

// LineCommand stores all points in a single line and can draw itself
class LineCommand implements Drawable {
  private points: Point[] = [];
  private thickness: number;

  // start a new line at the given point
  constructor(start: Point, thickness: number) {
    this.points.push(start);
    this.thickness = thickness;
  }

  // add a new point to the line as the user drags
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  // draw the line on the canvas
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return; // nothing exists to draw
    ctx.beginPath();
    ctx.lineWidth = this.thickness;
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (const pt of this.points.slice(1)) {
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  }
}

class ToolPreview implements Drawable {
  x: number;
  y: number;
  thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "gray";
    ctx.stroke();
  }

  display(ctx: CanvasRenderingContext2D) {
    this.draw(ctx);
  }
}

// display list stores all current lines
const displayList: Drawable[] = [];
// redo list stores lines that were undone
const redoList: Drawable[] = [];
// currentLine is the line being actively drawn (null if not drawing)
let currentLine: LineCommand | null = null;

let currentPreview: ToolPreview | null = null;

const cursor = { active: false, x: 0, y: 0 };

// start a new line on mouse down
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  currentPreview = null; // hide preview while drawing

  const start: Point = { x: e.offsetX, y: e.offsetY };
  currentLine = new LineCommand(start, currentThickness);
  displayList.push(currentLine);
  redoList.length = 0;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && currentLine) {
    currentLine.drag(e.offsetX, e.offsetY);
  } else {
    // update preview
    currentPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness);

    // fire tool-moved event
    const toolMovedEvent = new CustomEvent("tool-moved", {
      detail: { x: e.offsetX, y: e.offsetY, thickness: currentThickness },
    });
    canvas.dispatchEvent(toolMovedEvent);
  }

  canvas.dispatchEvent(new Event("dirty")); // redraw
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
});

canvas.addEventListener("dirty", () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const cmd of displayList) {
    cmd.display(ctx);
  }

  if (currentPreview) {
    currentPreview.display(ctx);
  }
});

// redraw all lines whenever the canvas is marked "dirty"
canvas.addEventListener("dirty", () => {
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw all lines
  for (const cmd of displayList) {
    cmd.display(ctx);
  }

  // draw the preview if it exists
  if (currentPreview) {
    currentPreview.display(ctx);
  }
});

// click logic

// CLEAR
clearButton.addEventListener("click", () => {
  displayList.length = 0;
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
});

// UNDO
undoButton.addEventListener("click", () => {
  if (displayList.length === 0) return;
  const cmd = displayList.pop();
  if (cmd) redoList.push(cmd);
  canvas.dispatchEvent(new Event("dirty"));
});

// REDO
redoButton.addEventListener("click", () => {
  if (redoList.length === 0) return;
  const cmd = redoList.pop();
  if (cmd) displayList.push(cmd);
  canvas.dispatchEvent(new Event("dirty"));
});

// thickness
function selectTool(
  thickness: number,
  selectedButton: HTMLButtonElement,
  otherButton: HTMLButtonElement,
) {
  currentThickness = thickness;
  selectedButton.classList.add("selectedTool");
  otherButton.classList.remove("selectedTool");

  // update preview immediately if it exists
  if (currentPreview) {
    currentPreview.thickness = currentThickness;
    canvas.dispatchEvent(new Event("dirty"));
  }
}

thinButton.addEventListener(
  "click",
  () => selectTool(2, thinButton, thickButton),
);
thickButton.addEventListener(
  "click",
  () => selectTool(6, thickButton, thinButton),
);
