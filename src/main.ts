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

//Sticker set
const stickers = [
  { emoji: "🍕" },
  { emoji: "🐱" },
  { emoji: "🌵" },
];

// Creating the buttons
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";

const exportButton = document.createElement("button");
exportButton.textContent = "export";

const thinButton = document.createElement("button");
thinButton.textContent = "thin";

const thickButton = document.createElement("button");
thickButton.textContent = "thick";

// Creating the sticker buttons dynamically instead of hard coding them
const stickerButtons: HTMLButtonElement[] = [];
for (const sticker of stickers) {
  const btn = document.createElement("button");
  btn.textContent = sticker.emoji;
  btn.addEventListener("click", () => selectSticker(sticker.emoji, btn));
  stickerButtons.push(btn);
}

// Allow the user to add a custom sticker
const customStickerButton = document.createElement("button");
customStickerButton.textContent = "➕ Custom";

customStickerButton.addEventListener("click", () => {
  const newEmoji = prompt("Custom sticker text", "🧽");
  if (newEmoji && newEmoji.trim() !== "") {
    const newSticker = { emoji: newEmoji.trim() };
    stickers.push(newSticker);

    // Create a new button for this sticker
    const btn = document.createElement("button");
    btn.textContent = newSticker.emoji;
    btn.addEventListener("click", () => selectSticker(newSticker.emoji, btn));

    // Add to DOM
    buttonContainer.appendChild(btn);
    stickerButtons.push(btn);
  }
});

// Centering
const buttonContainer = document.createElement("div");
buttonContainer.className = "button-container";
buttonContainer.append(
  clearButton,
  undoButton,
  redoButton,
  thinButton,
  thickButton,
  ...stickerButtons,
  customStickerButton,
  exportButton
);
document.body.appendChild(buttonContainer);

let currentTool: "marker" | "sticker" = "marker";
let currentThickness = 2;
let currentSticker: string | null = null;

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

class StickerCommand implements Drawable {
  x: number;
  y: number;
  emoji: string | undefined;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px sans-serif";
    ctx.fillText(this.emoji ?? "", this.x, this.y);
  }
}

class ToolPreview implements Drawable {
  x: number;
  y: number;
  thickness: number;
  emoji?: string | undefined;

  constructor(x: number, y: number, thickness: number, emoji?: string) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
    this.emoji = emoji;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.emoji) {
      ctx.font = "24px sans-serif";
      ctx.fillText(this.emoji, this.x, this.y);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "gray";
      ctx.stroke();
    }
    ctx.restore();
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
  currentPreview = null;

  const x = e.offsetX;
  const y = e.offsetY;

  if (currentTool === "marker") {
    currentLine = new LineCommand({ x, y }, currentThickness);
    displayList.push(currentLine);
  } else if (currentTool === "sticker" && currentSticker) {
    const sticker = new StickerCommand(x, y, currentSticker);
    displayList.push(sticker);
  }

  redoList.length = 0;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && currentTool === "marker" && currentLine) {
    currentLine.drag(e.offsetX, e.offsetY);
  } else {
    currentPreview = new ToolPreview(
      e.offsetX,
      e.offsetY,
      currentThickness,
      currentTool === "sticker" ? currentSticker ?? undefined : undefined,
    );

    const toolMovedEvent = new CustomEvent("tool-moved", {
      detail: {
        x: e.offsetX,
        y: e.offsetY,
        tool: currentTool,
        emoji: currentSticker,
      },
    });
    canvas.dispatchEvent(toolMovedEvent);
  }

  canvas.dispatchEvent(new Event("dirty"));
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
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

thinButton.addEventListener(
  "click",
  () => selectTool(2, thinButton, thickButton),
);
thickButton.addEventListener(
  "click",
  () => selectTool(6, thickButton, thinButton),
);

// thickness
function selectTool(
  thickness: number,
  selectedButton: HTMLButtonElement,
  otherButton: HTMLButtonElement,
) {
  currentTool = "marker";
  currentSticker = null;
  currentThickness = thickness;
  selectedButton.classList.add("selectedTool");
  otherButton.classList.remove("selectedTool");

  // update preview immediately if it exists
  if (currentPreview) {
    currentPreview.thickness = currentThickness;
    canvas.dispatchEvent(new Event("dirty"));
  }
}

function selectSticker(emoji: string, button: HTMLButtonElement) {
  currentTool = "sticker";
  currentSticker = emoji;

  // update button styles
  document.querySelectorAll("button").forEach((btn) =>
    btn.classList.remove("selectedTool")
  );
  button.classList.add("selectedTool");

  // fire tool-moved immediately on button click
  const toolMovedEvent = new CustomEvent("tool-moved", {
    detail: { tool: "sticker", emoji },
  });
  canvas.dispatchEvent(toolMovedEvent);
}
