// main.js
import './style.css';
import { SHAPE_HIERARCHY, SHAPE_TYPES, PHYSICS_CONSTANTS } from './config.js';
import { initAudio, playGoofySound, setMuteState } from './audio.js';
import { shapes, mergingAnimations, clearPhysicsState, addShape, checkCollisions, wakeUpShape } from './physics.js';
import { resetScoreDisplay, renderNextShapePreview } from './ui.js';

const wrapper = document.getElementById('mobileWrapper');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameActive = true;
let paused = false;
let muted = false;
let gameTime = 0;
let lastTime = 0;

let currentDropType = '';
let nextDropType = '';
let mouseX = 0;
let isReadyToDrop = true;

let playArea = { x: 0, y: 0, width: 0, height: 0 };
let canvasWidth = 0;
let canvasHeight = 0;

const timerDisplay = document.getElementById('timerDisplay');
const muteBtn = document.getElementById('muteBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const gameOverlay = document.getElementById('gameLostOverlay');
const restartBtn = document.getElementById('restartGameBtn');

function resizeCanvas() {
  const container = document.getElementById('canvasContainer');
  const rect = container.getBoundingClientRect();
  canvasWidth = rect.width;
  canvasHeight = rect.height;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  playArea.width = canvasWidth;
  playArea.height = canvasHeight;
  playArea.x = 0;
  playArea.y = 0;

  if (mouseX === 0) {
    mouseX = canvasWidth / 2;
  }
}

function generateNextShapes() {
  if (!currentDropType) {
    currentDropType = SHAPE_TYPES[Math.floor(Math.random() * 5)];
  } else {
    currentDropType = nextDropType;
  }
  nextDropType = SHAPE_TYPES[Math.floor(Math.random() * 5)];
  renderNextShapePreview(nextDropType, SHAPE_HIERARCHY[nextDropType]);
}

function checkGameOver() {
  for (let s of shapes) {
    if (gameTime - s.spawnTime > 0.5) {
      if (s.y - s.radius <= 5) {
        gameActive = false;
        gameOverlay.classList.remove('hidden');
        playGoofySound('gameover');
        break;
      }
    }
  }
}

function dropCurrentShape() {
  if (!gameActive || paused || !isReadyToDrop) return;
  isReadyToDrop = false;

  const config = SHAPE_HIERARCHY[currentDropType];
  const size = config.size;

  const minX = size;
  const maxX = canvasWidth - size;
  const dropX = Math.max(minX, Math.min(maxX, mouseX));
  const dropY = -size - 5;

  const dropped = addShape(currentDropType, dropX, dropY, 0, 0, gameTime);
  if (dropped) dropped.vy = 1.2;

  playGoofySound('drop');
  generateNextShapes();
  setTimeout(() => { isReadyToDrop = true; }, 250);
}

function update(dt) {
  if (!gameActive || paused) return;

  gameTime += dt;
  timerDisplay.innerText = gameTime.toFixed(1);

  const { SUB_STEPS, GRAVITY, ANGULAR_DRAG, BOUNCE } = PHYSICS_CONSTANTS;
  const substepDt = 1 / SUB_STEPS;

  for (let step = 0; step < SUB_STEPS; step++) {
    for (let s of shapes) {
      if (s.isSleeping) continue;
      s.vy += GRAVITY * substepDt;
      s.x += s.vx * substepDt;
      s.y += s.vy * substepDt;
      s.angle += s.angularVelocity * substepDt;
      s.angularVelocity *= Math.pow(ANGULAR_DRAG, substepDt);

      if (s.y + s.radius > canvasHeight) {
        s.y = canvasHeight - s.radius;
        if (s.vy > 0) s.vy = -s.vy * BOUNCE;
        s.vx *= 0.98;
      }
      if (s.y - s.radius < 0) {
        s.y = s.radius;
        if (s.vy < 0) s.vy = -s.vy * BOUNCE;
      }
      if (s.x - s.radius < 0) {
        s.x = s.radius;
        if (s.vx < 0) s.vx = -s.vx * BOUNCE;
      }
      if (s.x + s.radius > canvasWidth) {
        s.x = canvasWidth - s.radius;
        if (s.vx > 0) s.vx = -s.vx * BOUNCE;
      }
    }
    checkCollisions(playArea);
  }

  for (let s of shapes) {
    s.currentSquishX += (s.targetSquishX - s.currentSquishX) * 0.12;
    s.currentSquishY += (s.targetSquishY - s.currentSquishY) * 0.12;
    s.targetSquishX += (1.0 - s.targetSquishX) * 0.1;
    s.targetSquishY += (1.0 - s.targetSquishY) * 0.1;
  }

  for (let i = mergingAnimations.length - 1; i >= 0; i--) {
    const anim = mergingAnimations[i];
    anim.progress += dt / anim.duration;
    if (anim.progress >= 1) {
      const spawned = addShape(anim.targetType, anim.targetX, anim.targetY, 0, 0, gameTime);
      for (let s of shapes) {
        if (s.id !== spawned.id) {
          const dx = s.x - spawned.x;
          const dy = s.y - spawned.y;
          if (Math.hypot(dx, dy) < s.radius + spawned.radius + 15) {
            wakeUpShape(s);
          }
        }
      }
      mergingAnimations.splice(i, 1);
    }
  }
  checkGameOver();
}

function drawFace(radius, face, alpha, isSleeping) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#2d3748';
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = Math.max(2, radius * 0.06);
  ctx.lineCap = 'round';

  const eyeOffset = radius * 0.3;
  const eyeY = -radius * 0.15;
  const eyeSize = Math.max(2.5, radius * 0.07);

  if (isSleeping) {
    ctx.beginPath(); ctx.moveTo(-eyeOffset - eyeSize, eyeY); ctx.lineTo(-eyeOffset + eyeSize, eyeY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeOffset - eyeSize, eyeY); ctx.lineTo(eyeOffset + eyeSize, eyeY); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, radius * 0.25, radius * 0.1, 0, Math.PI * 2); ctx.stroke();
  } else {
    if (face.eyes === 'happy') {
      ctx.beginPath(); ctx.arc(-eyeOffset, eyeY, eyeSize, Math.PI, 0, false); ctx.stroke();
      ctx.beginPath(); ctx.arc(eyeOffset, eyeY, eyeSize, Math.PI, 0, false); ctx.stroke();
    } else if (face.eyes === 'cute') {
      ctx.beginPath(); ctx.arc(-eyeOffset, eyeY, eyeSize * 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeOffset, eyeY, eyeSize * 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(-eyeOffset - 1, eyeY - 1, eyeSize * 0.4, 0, Math.PI * 2);
      ctx.arc(eyeOffset - 1, eyeY - 1, eyeSize * 0.4, 0, Math.PI * 2); ctx.fill();
    } else if (face.eyes === 'blink') {
      ctx.beginPath(); ctx.moveTo(-eyeOffset - eyeSize, eyeY); ctx.lineTo(-eyeOffset + eyeSize, eyeY); ctx.stroke();
      ctx.beginPath(); ctx.arc(eyeOffset, eyeY, eyeSize, Math.PI, 0, false); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(-eyeOffset, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeOffset, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
    }

    const mouthY = radius * 0.2;
    if (face.mouth === 'smile') {
      ctx.beginPath(); ctx.arc(0, mouthY, radius * 0.2, 0, Math.PI, false); ctx.stroke();
    } else if (face.mouth === 'smile_wide') {
      ctx.beginPath(); ctx.arc(0, mouthY, radius * 0.25, 0, Math.PI, false); ctx.closePath(); ctx.fill();
    } else if (face.mouth === 'open') {
      ctx.beginPath(); ctx.arc(0, mouthY + 2, radius * 0.15, 0, Math.PI * 2); ctx.fill();
    } else if (face.mouth === 'tongue') {
      ctx.beginPath(); ctx.arc(0, mouthY, radius * 0.2, 0, Math.PI, false); ctx.stroke();
      ctx.fillStyle = '#ff8a80';
      ctx.beginPath(); ctx.arc(2, mouthY + 3, radius * 0.1, 0, Math.PI * 2); ctx.fill();
    } else if (face.mouth === 'shy') {
      ctx.beginPath(); ctx.moveTo(-radius * 0.15, mouthY); ctx.lineTo(radius * 0.15, mouthY); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawShapeElement(vertices, x, y, radius, color, angle, alpha = 1.0, squishX = 1.0, squishY = 1.0, face = null, isSleeping = false) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(squishX, squishY);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = color;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  if (vertices && vertices.length > 0) {
    ctx.moveTo(vertices[0][0] * radius, vertices[0][1] * radius);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i][0] * radius, vertices[i][1] * radius);
    }
  } else {
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  }
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  if (vertices && vertices.length > 0) {
    ctx.moveTo(vertices[0][0] * radius, vertices[0][1] * radius);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i][0] * radius, vertices[i][1] * radius);
    }
  } else {
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  }
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = Math.max(2.5, radius * 0.05);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  if (face) {
    drawFace(radius, face, alpha, isSleeping);
  }
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(canvasWidth, 5);
  ctx.stroke();
  ctx.setLineDash([]);

  if (gameActive && !paused && currentDropType && isReadyToDrop) {
    const config = SHAPE_HIERARCHY[currentDropType];
    const size = config.size;
    const minX = size;
    const maxX = canvasWidth - size;
    const targetX = Math.max(minX, Math.min(maxX, mouseX));
    const targetY = -size - 5;

    ctx.strokeStyle = 'rgba(190, 204, 218, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(targetX, 0);
    ctx.lineTo(targetX, canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    drawShapeElement(config.vertices, targetX, targetY, size, config.color, 0, 0.45);
  }

  for (let s of shapes) {
    drawShapeElement(s.vertices, s.x, s.y, s.radius, s.color, s.angle, 1.0, s.currentSquishX, s.currentSquishY, s.face, s.isSleeping);
  }

  for (let anim of mergingAnimations) {
    const t = Math.min(1, anim.progress);
    const curX1 = anim.x1 + (anim.targetX - anim.x1) * t;
    const curY1 = anim.y1 + (anim.targetY - anim.y1) * t;
    const curR1 = anim.radius1 * (1 - t);
    const curX2 = anim.x2 + (anim.targetX - anim.x2) * t;
    const curY2 = anim.y2 + (anim.targetY - anim.y2) * t;
    const curR2 = anim.radius2 * (1 - t);

    if (curR1 > 1) drawShapeElement(anim.vertices1, curX1, curY1, curR1, anim.color1, anim.angle1, 1 - t);
    if (curR2 > 1) drawShapeElement(anim.vertices2, curX2, curY2, curR2, anim.color2, anim.angle2, 1 - t);

    const spawnR = anim.targetRadius * t;
    if (spawnR > 1) {
      drawShapeElement(anim.targetVertices, anim.targetX, anim.targetY, spawnR, anim.targetColor, 0, t);
    }
  }
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  if (dt > 0.033) dt = 0.033;
  if (dt > 0.001) {
    update(dt);
    lastTime = timestamp;
  }
  draw();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  clearPhysicsState();
  gameTime = 0;
  gameActive = true;
  paused = false;
  isReadyToDrop = true;
  currentDropType = '';
  nextDropType = '';
  resetScoreDisplay();
  timerDisplay.innerText = '0.0';
  pauseBtn.innerText = "⏸️";
  gameOverlay.classList.add('hidden');
  generateNextShapes();
}

function handlePointerMove(clientX) {
  const rect = canvas.getBoundingClientRect();
  let newX = clientX - rect.left;
  mouseX = Math.max(0, Math.min(canvasWidth, newX));
}

function bindUI() {
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX));
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX);
  }, { passive: false });

  const dropHandler = (e) => {
    if (e.target.closest('button')) return;
    if (!gameActive || paused) return;
    initAudio();
    dropCurrentShape();
  };

  wrapper.addEventListener('click', dropHandler);
  wrapper.addEventListener('touchstart', (e) => {
    if (e.target.closest('button')) return;
    if (!gameActive || paused) return;
    e.preventDefault();
    initAudio();
    dropCurrentShape();
  });

  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    muted = !muted;
    setMuteState(muted);
    muteBtn.innerText = muted ? "🔇" : "🔊";
    playGoofySound('click');
  });

  pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!gameActive) return;
    paused = !paused;
    pauseBtn.innerText = paused ? "▶️" : "⏸️";
    playGoofySound('click');
  });

  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playGoofySound('click');
    resetGame();
  });

  restartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playGoofySound('click');
    resetGame();
  });
}

resizeCanvas();
bindUI();
resetGame();
requestAnimationFrame(gameLoop);