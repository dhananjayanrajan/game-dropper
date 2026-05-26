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
const TOP_MARGIN = 110;
const BOTTOM_MARGIN = 0;

const timerDisplay = document.getElementById('timerDisplay');
const muteBtn = document.getElementById('muteBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const gameOverlay = document.getElementById('gameLostOverlay');
const restartBtn = document.getElementById('restartGameBtn');

function resizeCanvas() {
  const rect = wrapper.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  playArea.width = canvas.width;
  playArea.height = canvas.height - TOP_MARGIN - BOTTOM_MARGIN;
  playArea.x = 0;
  playArea.y = TOP_MARGIN;

  if (mouseX === 0) {
    mouseX = canvas.width / 2;
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
    if (gameTime - s.spawnTime > 1.0) {
      const topY = s.y - s.radius;
      if (topY <= playArea.y) {
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

  const minX = playArea.x + size;
  const maxX = playArea.x + playArea.width - size;
  const dropX = Math.max(minX, Math.min(maxX, mouseX));
  const dropY = playArea.y - size;

  const dropped = addShape(currentDropType, dropX, dropY, 0, 0, gameTime);
  if (dropped) dropped.vy = 1.5;

  playGoofySound('drop');
  generateNextShapes();
}

function update(dt) {
  if (!gameActive || paused) return;

  gameTime += dt;
  timerDisplay.innerText = gameTime.toFixed(1);

  const { SUB_STEPS, GRAVITY, ANGULAR_DRAG } = PHYSICS_CONSTANTS;
  const substepDt = 1 / SUB_STEPS;

  for (let step = 0; step < SUB_STEPS; step++) {
    for (let s of shapes) {
      if (s.isSleeping) continue;
      s.vy += GRAVITY * substepDt;
      s.x += s.vx * substepDt;
      s.y += s.vy * substepDt;
      s.angle += s.angularVelocity * substepDt;
      s.angularVelocity *= Math.pow(ANGULAR_DRAG, substepDt);
    }
    checkCollisions(playArea);
  }

  for (let s of shapes) {
    s.currentSquishX += (s.targetSquishX - s.currentSquishX) * 0.12;
    s.currentSquishY += (s.targetSquishY - s.currentSquishY) * 0.12;
    s.targetSquishX += (1.0 - s.targetSquishX) * 0.1;
    s.targetSquishY += (1.0 - s.targetSquishY) * 0.1;
  }

  if (mergingAnimations.length === 0 && !isReadyToDrop) {
    isReadyToDrop = true;
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
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  const eyeOffset = radius * 0.3;
  const eyeY = -radius * 0.15;
  const eyeSize = Math.max(3, radius * 0.08);

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
      ctx.beginPath(); ctx.arc(-eyeOffset, eyeY, eyeSize, 0, Math.PI * 2); ctx.arc(eyeOffset, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
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

  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 8;
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
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
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

  ctx.lineWidth = Math.max(3, radius * 0.06);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  if (face) {
    drawFace(radius, face, alpha, isSleeping);
  }
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(playArea.x, playArea.y); ctx.lineTo(playArea.x + playArea.width, playArea.y); ctx.stroke();
  ctx.setLineDash([]);

  if (gameActive && !paused && currentDropType && isReadyToDrop) {
    const config = SHAPE_HIERARCHY[currentDropType];
    const size = config.size;
    const minX = playArea.x + size;
    const maxX = playArea.x + playArea.width - size;
    const targetX = Math.max(minX, Math.min(maxX, mouseX));
    const targetY = playArea.y - size;

    ctx.strokeStyle = 'rgba(190, 204, 218, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(targetX, playArea.y); ctx.lineTo(targetX, playArea.y + playArea.height); ctx.stroke();
    ctx.setLineDash([]);

    drawShapeElement(config.vertices, targetX, targetY, size, config.color, 0, 0.5);
  }

  for (let s of shapes) {
    drawShapeElement(s.vertices, s.x, s.y, s.radius, s.color, s.angle, 1.0, s.currentSquishX, s.currentSquishY, s.face, s.isSleeping);
  }

  for (let anim of mergingAnimations) {
    const t = anim.progress;
    const curX1 = anim.x1 + (anim.targetX - anim.x1) * t;
    const curY1 = anim.y1 + (anim.targetY - anim.y1) * t;
    const curR1 = anim.radius1 * (1 - t);
    const curX2 = anim.x2 + (anim.targetX - anim.x2) * t;
    const curY2 = anim.y2 + (anim.targetY - anim.y2) * t;
    const curR2 = anim.radius2 * (1 - t);

    if (curR1 > 1) drawShapeElement(anim.vertices1, curX1, curY1, curR1, anim.color1, anim.angle1, 1 - t, 1, 1, anim.face1, false);
    if (curR2 > 1) drawShapeElement(anim.vertices2, curX2, curY2, curR2, anim.color2, anim.angle2, 1 - t, 1, 1, anim.face2, false);

    const spawnR = anim.targetRadius * t;
    drawShapeElement(anim.targetVertices, anim.targetX, anim.targetY, spawnR, anim.targetColor, 0, t, 1, 1, anim.targetFace, false);
  }
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  if (dt > 0.1) dt = 0.1;
  lastTime = timestamp;

  update(dt);
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
  mouseX = clientX - rect.left;
}

function bindUI() {
  window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX));
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX);
  }, { passive: true });

  wrapper.addEventListener('click', (e) => {
    if (e.target.closest('button') || !gameActive || paused) return;
    initAudio();
    dropCurrentShape();
  });
  wrapper.addEventListener('touchend', (e) => {
    if (e.target.closest('button') || !gameActive || paused) return;
    initAudio();
    dropCurrentShape();
  });

  muteBtn.addEventListener('click', () => {
    muted = !muted;
    setMuteState(muted);
    muteBtn.innerText = muted ? "🔇" : "🔊";
    playGoofySound('click');
    for (let s of shapes) wakeUpShape(s);
  });

  pauseBtn.addEventListener('click', () => {
    if (!gameActive) return;
    paused = !paused;
    pauseBtn.innerText = paused ? "▶️" : "⏸️";
    playGoofySound('click');
    for (let s of shapes) wakeUpShape(s);
  });

  resetBtn.addEventListener('click', () => { playGoofySound('click'); resetGame(); });
  restartBtn.addEventListener('click', () => { playGoofySound('click'); resetGame(); });
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
bindUI();
resetGame();
requestAnimationFrame(gameLoop);