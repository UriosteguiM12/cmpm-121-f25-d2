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
document.body.appendChild(canvas);