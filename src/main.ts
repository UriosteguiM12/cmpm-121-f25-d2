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

// Centering
const buttonContainer = document.createElement("div");
buttonContainer.className = "button-container";
buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);
buttonContainer.appendChild(thinButton);
buttonContainer.appendChild(thickButton);

document.body.appendChild(buttonContainer);

let currentThickness = 2;

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

// display list stores all current lines
const displayList: Drawable[] = [];
// redo list stores lines that were undone
const redoList: Drawable[] = [];
// currentLine is the line being actively drawn (null if not drawing)
let currentLine: LineCommand | null = null;

const cursor = { active: false, x: 0, y: 0 };

// start a new line on mouse down
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  const start: Point = { x: e.offsetX, y: e.offsetY };
  currentLine = new LineCommand(start, currentThickness);
  displayList.push(currentLine); // add to display list
  redoList.length = 0; // clear redo history
});

// extend the current line as the mouse moves
canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentLine) return;
  currentLine.drag(e.offsetX, e.offsetY);
  canvas.dispatchEvent(new Event("dirty")); // trigger redraw
});

// stop drawing when mouse is released
canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
});

// redraw all lines whenever the canvas is marked "dirty"
canvas.addEventListener("dirty", () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of displayList) {
    cmd.display(ctx); // each command draws itself
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
  if (cmd) redoList.push(cmd); // add to redo stack
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
thinButton.addEventListener("click", () => {
  currentThickness = 2;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});

thickButton.addEventListener("click", () => {
  currentThickness = 6;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});
