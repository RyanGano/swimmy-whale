const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startScreen = document.querySelector("#start-screen");
const gameOverScreen = document.querySelector("#game-over-screen");
const hud = document.querySelector("#hud");
const scoreNode = document.querySelector("#score");
const finalScoreNode = document.querySelector("#final-score");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const shareButton = document.querySelector("#share-button");
const soundButton = document.querySelector("#sound-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const state = { running: false, score: 0, muted: false, lastTime: 0, spawnTimer: 0, columns: [], bubbles: [] };
const whale = { x: 200, y: 290, velocity: 0, radius: 30, rotation: 0 };
let audioContext;

function initializeScene() {
  state.columns = [];
  state.bubbles = Array.from({ length: 28 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    r: 2 + Math.random() * 5,
    speed: 10 + Math.random() * 24,
  }));
}

function startGame() {
  initializeScene();
  whale.y = HEIGHT / 2;
  whale.velocity = 0;
  whale.rotation = 0;
  state.score = 0;
  state.spawnTimer = 0;
  state.running = true;
  scoreNode.textContent = "0";
  startScreen.hidden = true;
  gameOverScreen.hidden = true;
  hud.hidden = false;
  state.lastTime = performance.now();
  requestAnimationFrame(loop);
  swim();
}

function swim() {
  if (!state.running) return;
  whale.velocity = -390;
  playTone(460, 0.06, "sine");
}

function endGame() {
  if (!state.running) return;
  state.running = false;
  finalScoreNode.textContent = state.score;
  gameOverScreen.hidden = false;
  hud.hidden = true;
  playTone(120, 0.22, "sawtooth");
}

function addColumn() {
  const gap = Math.max(170, 215 - state.score * 2);
  const top = 90 + Math.random() * (HEIGHT - gap - 180);
  state.columns.push({
    x: WIDTH + 40,
    gapTop: top,
    gapBottom: top + gap,
    style: Math.floor(Math.random() * 3),
    counted: false,
  });
}

function update(delta) {
  state.bubbles.forEach((bubble) => {
    bubble.y -= bubble.speed * delta;
    if (bubble.y < -bubble.r) {
      bubble.y = HEIGHT + bubble.r;
      bubble.x = Math.random() * WIDTH;
    }
  });
  if (!state.running) return;

  whale.velocity += 970 * delta;
  whale.y += whale.velocity * delta;
  whale.rotation = Math.max(-0.45, Math.min(0.8, whale.velocity / 750));
  state.spawnTimer += delta;
  if (state.spawnTimer > 1.7) {
    addColumn();
    state.spawnTimer = 0;
  }
  state.columns.forEach((column) => (column.x -= 205 * delta));
  state.columns = state.columns.filter((column) => column.x > -100);

  for (const column of state.columns) {
    if (!column.counted && column.x + 74 < whale.x) {
      column.counted = true;
      state.score += 1;
      scoreNode.textContent = state.score;
      playTone(700, 0.09, "triangle");
    }
    const withinColumn = whale.x + whale.radius > column.x && whale.x - whale.radius < column.x + 74;
    if (withinColumn && (whale.y - whale.radius < column.gapTop || whale.y + whale.radius > column.gapBottom)) endGame();
  }
  if (whale.y + whale.radius > HEIGHT - 25 || whale.y - whale.radius < 0) endGame();
}

function drawBackground() {
  const water = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  water.addColorStop(0, "#2389b7");
  water.addColorStop(0.55, "#0d587c");
  water.addColorStop(1, "#06304d");
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#b7ebed16";
  for (let x = -100; x < WIDTH; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + 55, 0); ctx.lineTo(x + 230, HEIGHT); ctx.lineTo(x + 165, HEIGHT);
    ctx.fill();
  }
  state.bubbles.forEach((b) => {
    ctx.strokeStyle = "#d7ffff8c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.fillStyle = "#08405b";
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT); ctx.quadraticCurveTo(130, HEIGHT - 38, 270, HEIGHT - 13);
  ctx.quadraticCurveTo(480, HEIGHT - 55, 700, HEIGHT - 15); ctx.quadraticCurveTo(810, HEIGHT - 50, WIDTH, HEIGHT - 24);
  ctx.lineTo(WIDTH, HEIGHT); ctx.fill();
}

function drawColumn(column) {
  if (column.style === 0) drawCoral(column);
  else if (column.style === 1) drawKelp(column);
  else drawRuins(column);
}

function drawCoral(column) {
  const drawPart = (y, height, upsideDown) => {
    ctx.fillStyle = "#ce5f79";
    ctx.fillRect(column.x, y, 74, height);
    ctx.fillStyle = "#f28b9e";
    for (let i = 8; i < height; i += 25) {
      ctx.beginPath(); ctx.arc(column.x + 18 + (i % 3) * 16, y + i, 9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#7d385f";
    ctx.fillRect(column.x - 6, upsideDown ? y + height - 13 : y, 86, 13);
  };
  drawPart(0, column.gapTop, true);
  drawPart(column.gapBottom, HEIGHT - column.gapBottom, false);
}

function drawKelp(column) {
  const drawPart = (y, height, upsideDown) => {
    ctx.fillStyle = "#315f44";
    ctx.fillRect(column.x + 12, y, 50, height);
    ctx.strokeStyle = "#79a856"; ctx.lineWidth = 9;
    for (let i = 0; i < 5; i++) {
      const x = column.x + 12 + i * 12;
      ctx.beginPath();
      ctx.moveTo(x, upsideDown ? y : y + height);
      ctx.quadraticCurveTo(x + (i % 2 ? -18 : 18), y + height / 2, x + (i % 2 ? 10 : -10), upsideDown ? y + height : y);
      ctx.stroke();
    }
    ctx.fillStyle = "#244a3b";
    ctx.fillRect(column.x - 4, upsideDown ? y + height - 12 : y, 82, 12);
  };
  drawPart(0, column.gapTop, true);
  drawPart(column.gapBottom, HEIGHT - column.gapBottom, false);
}

function drawRuins(column) {
  const drawPart = (y, height, upsideDown) => {
    ctx.fillStyle = "#6b9092";
    ctx.fillRect(column.x + 6, y, 62, height);
    ctx.fillStyle = "#a1c4ba";
    for (let i = 8; i < height - 10; i += 26) ctx.fillRect(column.x + 10, y + i, 54, 4);
    ctx.fillStyle = "#435f6c";
    ctx.fillRect(column.x - 8, upsideDown ? y + height - 15 : y, 90, 15);
    ctx.fillRect(column.x, upsideDown ? y + height - 25 : y + 10, 74, 8);
  };
  drawPart(0, column.gapTop, true);
  drawPart(column.gapBottom, HEIGHT - column.gapBottom, false);
}

function drawWhale() {
  ctx.save();
  ctx.translate(whale.x, whale.y);
  ctx.rotate(whale.rotation);
  ctx.fillStyle = "#29465d";
  ctx.beginPath(); ctx.moveTo(-26, 6); ctx.lineTo(-57, -14); ctx.lineTo(-48, 8); ctx.lineTo(-62, 25); ctx.lineTo(-24, 21); ctx.fill();
  ctx.fillStyle = "#6da4b9";
  ctx.beginPath(); ctx.ellipse(0, 0, 43, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#d7edf0";
  ctx.beginPath(); ctx.ellipse(8, 12, 25, 10, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = "#365d76";
  ctx.beginPath(); ctx.moveTo(-3, -21); ctx.quadraticCurveTo(-1, -48, 17, -49); ctx.quadraticCurveTo(13, -31, 27, -22); ctx.fill();
  ctx.fillStyle = "#193243";
  ctx.beginPath(); ctx.arc(24, -8, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(25, -9, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#234154"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(27, 5, 8, 0.2, 1.55); ctx.stroke();
  ctx.restore();
}

function draw() {
  drawBackground();
  state.columns.forEach(drawColumn);
  drawWhale();
}

function loop(now) {
  const delta = Math.min((now - state.lastTime) / 1000, 0.035);
  state.lastTime = now;
  update(delta);
  draw();
  if (state.running) requestAnimationFrame(loop);
}

function playTone(frequency, duration, type) {
  if (state.muted) return;
  audioContext ??= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.05, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

async function shareScore() {
  const text = `I swam through ${state.score} passages in Swimmy Jail! Can you guide the great fish farther?`;
  const shareData = { title: "Swimmy Jail", text };
  try {
    if (navigator.share) await navigator.share(shareData);
    else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      shareButton.textContent = "Score Copied!";
      setTimeout(() => (shareButton.textContent = "Share Score"), 1800);
    }
  } catch (error) {
    if (error.name !== "AbortError") console.error("Could not share score:", error);
  }
}

canvas.addEventListener("pointerdown", swim);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") { event.preventDefault(); swim(); }
});
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
shareButton.addEventListener("click", shareScore);
soundButton.addEventListener("click", () => {
  state.muted = !state.muted;
  soundButton.textContent = state.muted ? "×" : "♪";
  soundButton.setAttribute("aria-label", state.muted ? "Unmute sound" : "Mute sound");
});

initializeScene();
draw();
