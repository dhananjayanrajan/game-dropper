import './style.css';
import { SHAPE_HIERARCHY, SHAPE_TYPES, PHYSICS_CONSTANTS } from './config.js';
import { initAudio, playGoofySound, setMuteState } from './audio.js';
import { shapes, mergingAnimations, clearPhysicsState, addShape, checkCollisions, wakeUpShape } from './physics.js';
import { resetScoreDisplay, updateScoreDisplay, addDropScorePenalty } from './ui.js';
import { ComboManager } from './managers/comboManager.js';
import { drawShapeElement, drawBombRangeEffect } from './render/shapeRenderer.js';
import { checkForBombExplosions } from './powers/bombPower.js';
import { updateDittoTransformations } from './powers/dittoPower.js';
import { updateMagneticFields, drawMagneticRangePulse } from './powers/magneticPower.js';
import { handleSplitterActivation } from './powers/splitterPower.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameActive = true, paused = false, muted = false, gameTime = 0, lastTime = 0;
let currentDropType = '', currentDropIsGold = false, currentDropPower = null;
let mouseX = 0, isReadyToDrop = true, currentComboMultiplier = 1, audioInitialized = false;
let shapeQueue = [], powerUpList = [], currentQueueIndex = 0, sizeMultiplier = 1;
const comboManager = new ComboManager((count, mult) => { currentComboMultiplier = mult; });
let playArea = { x: 0, y: 0, width: 0, height: 0 }, canvasWidth = 0, canvasHeight = 0;

const timerDisplay = document.getElementById('timerDisplay');
const muteBtn = document.getElementById('muteBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const gameOverlay = document.getElementById('gameLostOverlay');
const restartBtn = document.getElementById('restartGameBtn');
const powerUpQueueDiv = document.getElementById('powerUpQueue');
const activePowerBadge = document.getElementById('activePowerBadge');

function calculateSizeMultiplier() {
  const container = document.getElementById('canvasContainer');
  const rect = container.getBoundingClientRect();
  sizeMultiplier = Math.min(rect.width / 375, rect.height / 600, 1.0);
  return sizeMultiplier;
}
function getScaledSize(originalSize) { return Math.max(20, Math.min(80, originalSize * sizeMultiplier)); }

function generateRandomShape() {
  const r = Math.random();
  if (r < 0.01) return { type: 'power', power: 'bomb' };
  if (r < 0.02) return { type: 'power', power: 'magnetic' };
  if (r < 0.03) return { type: 'power', power: 'ditto' };
  if (r < 0.04) return { type: 'power', power: 'splitter' };
  if (r < 0.05) return { type: 'power', power: 'gold' };
  const shapeType = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
  return { type: 'shape', shapeType: shapeType, isGold: Math.random() < 0.15 };
}

function initializeShapeQueue() {
  shapeQueue = [];
  for (let i = 0; i < 25; i++) shapeQueue.push(generateRandomShape());
  currentQueueIndex = 0;
  updatePowerUpList();
}
function addToShapeQueue() {
  shapeQueue.push(generateRandomShape());
  updatePowerUpList();
}
function updatePowerUpList() {
  powerUpList = [];
  for (let i = currentQueueIndex; i < shapeQueue.length && powerUpList.length < 6; i++) {
    powerUpList.push({ item: shapeQueue[i], dropsLeft: i - currentQueueIndex, isCurrent: i === currentQueueIndex });
  }
  updatePowerUpQueueUI();
}
function loadCurrentDrop() {
  if (currentQueueIndex >= shapeQueue.length) addToShapeQueue();
  const item = shapeQueue[currentQueueIndex];
  if (item.type === 'power') {
    currentDropPower = item.power;
    currentDropType = null;
    currentDropIsGold = false;
  } else {
    currentDropPower = null;
    currentDropType = item.shapeType;
    currentDropIsGold = item.isGold || false;
  }
}
function advanceQueue() {
  currentQueueIndex++;
  if (currentQueueIndex >= shapeQueue.length) addToShapeQueue();
  loadCurrentDrop();
  updatePowerUpList();
}

function updatePowerUpQueueUI() {
  if (!powerUpQueueDiv) return;
  powerUpQueueDiv.innerHTML = '';
  for (let entry of powerUpList) {
    const item = entry.item, dropsLeft = entry.dropsLeft, isCurrent = entry.isCurrent;
    const div = document.createElement('div');
    div.className = `queue-item flex flex-col items-center justify-center rounded-xl border-2 flex-shrink-0 relative ${isCurrent ? 'border-[#58cc02] bg-[#58cc02]/5 shadow-lg' : 'border-[#e2e8f0] bg-white'}`;
    div.style.width = '75px'; div.style.minWidth = '75px';
    let bgClass, icon, displayText;
    if (item.type === 'power') {
      switch (item.power) {
        case 'gold': bgClass = '#ffc107'; icon = '⭐'; displayText = 'GOLD'; break;
        case 'ditto': bgClass = '#ce93d8'; icon = '🟣'; displayText = 'DITTO'; break;
        case 'bomb': bgClass = '#212121'; icon = '💣'; displayText = 'BOMB'; break;
        case 'magnetic': bgClass = '#29b6f6'; icon = '🧲'; displayText = 'MAG'; break;
        case 'splitter': bgClass = '#ef5350'; icon = '🔪'; displayText = 'SPLIT'; break;
      }
    } else {
      const level = SHAPE_TYPES.indexOf(item.shapeType) + 1;
      icon = level <= 3 ? '🔘' : (level <= 6 ? '🔲' : '⬛');
      bgClass = SHAPE_HIERARCHY[item.shapeType].color;
      displayText = item.isGold ? 'GOLD' : `L${level}`;
    }
    const counter = document.createElement('div');
    counter.className = 'absolute top-1 right-1 bg-[#1cb0f6] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md z-20';
    counter.innerText = dropsLeft;
    const iconDiv = document.createElement('div');
    iconDiv.className = `w-14 h-14 rounded-lg flex items-center justify-center text-2xl shadow-md relative overflow-hidden`;
    iconDiv.style.background = bgClass;
    const iconSpan = document.createElement('span');
    iconSpan.innerText = icon;
    iconDiv.appendChild(iconSpan);
    const typeSpan = document.createElement('span');
    typeSpan.className = 'text-[10px] font-bold text-[#475569] text-center mt-1';
    typeSpan.innerText = displayText;
    div.appendChild(counter);
    div.appendChild(iconDiv);
    div.appendChild(typeSpan);
    powerUpQueueDiv.appendChild(div);
  }
}

function resizeCanvas() {
  const container = document.getElementById('canvasContainer');
  const rect = container.getBoundingClientRect();
  canvasWidth = rect.width; canvasHeight = rect.height;
  canvas.width = canvasWidth; canvas.height = canvasHeight;
  playArea = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  if (mouseX === 0) mouseX = canvasWidth / 2;
  calculateSizeMultiplier();
  for (let key in SHAPE_HIERARCHY) {
    if (!SHAPE_HIERARCHY[key].originalSize) SHAPE_HIERARCHY[key].originalSize = SHAPE_HIERARCHY[key].size;
    SHAPE_HIERARCHY[key].size = getScaledSize(SHAPE_HIERARCHY[key].originalSize);
  }
}

function checkGameOver() {
  for (let s of shapes) {
    if (gameTime - s.spawnTime > 1.5 && s.y - s.radius <= 80 && Math.abs(s.vx) < 0.2 && Math.abs(s.vy) < 0.2) {
      gameActive = false;
      gameOverlay.classList.remove('hidden');
      playGoofySound('gameover');
      break;
    }
  }
}

function performDrop() {
  if (!gameActive || paused || !isReadyToDrop) return;
  isReadyToDrop = false;
  comboManager.triggerCombo(false);
  if (currentDropPower) {
    let shapeType, size, color, flags = { isGold: false, isDitto: false, isBomb: false, isMagnetic: false, isSplitter: false };
    switch (currentDropPower) {
      case 'gold':
        shapeType = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
        flags.isGold = true;
        break;
      case 'ditto':
        shapeType = 'Circle';
        flags.isDitto = true;
        size = 42;
        break;
      case 'bomb':
        shapeType = 'Circle';
        flags.isBomb = true;
        size = 48;
        color = '#212121';
        break;
      case 'magnetic':
        shapeType = 'Circle';
        flags.isMagnetic = true;
        size = 48;
        color = '#29b6f6';
        break;
      case 'splitter':
        shapeType = 'Circle';
        flags.isSplitter = true;
        size = 48;
        color = '#ef5350';
        break;
    }
    const config = SHAPE_HIERARCHY[shapeType];
    const effectiveRadius = size || config.size;
    const dropX = Math.max(effectiveRadius, Math.min(canvasWidth - effectiveRadius, mouseX));
    const dropY = 90;
    const dropped = addShape(shapeType, dropX, dropY, 0, 1.5, gameTime);
    if (dropped) {
      Object.assign(dropped, flags);
      if (size) dropped.radius = size;
      if (color) dropped.color = color;
      if (flags.isGold) addDropScorePenalty(SHAPE_HIERARCHY[shapeType].dropScore);
      else addDropScorePenalty(0);
    }
    playGoofySound('drop');
    advanceQueue();
    setTimeout(() => { isReadyToDrop = true; }, 300);
    return;
  }
  if (!currentDropType || !SHAPE_HIERARCHY[currentDropType]) currentDropType = SHAPE_TYPES[0];
  const config = SHAPE_HIERARCHY[currentDropType];
  const dropX = Math.max(config.size, Math.min(canvasWidth - config.size, mouseX));
  const dropY = 90;
  const dropped = addShape(currentDropType, dropX, dropY, 0, 1.5, gameTime);
  if (dropped && currentDropIsGold) dropped.isGold = true;
  addDropScorePenalty(config.dropScore);
  playGoofySound('drop');
  advanceQueue();
  setTimeout(() => { isReadyToDrop = true; }, 300);
}

function updatePowerActiveBadge() {
  const hasActive = shapes.some(s => s.isBomb || s.isMagnetic || s.isDitto || s.isSplitter);
  if (hasActive) activePowerBadge.classList.remove('hidden');
  else activePowerBadge.classList.add('hidden');
}

function update(dt) {
  if (!gameActive || paused) return;
  gameTime += dt;
  timerDisplay.innerText = gameTime.toFixed(1);
  const { SUB_STEPS, GRAVITY, ANGULAR_DRAG, BOUNCE, MAX_LINEAR_SPEED } = PHYSICS_CONSTANTS;
  const substepDt = 1 / SUB_STEPS;
  for (let step = 0; step < SUB_STEPS; step++) {
    for (let s of shapes) {
      if (s.isSleeping || s.isExploding) continue;
      s.vy += GRAVITY * substepDt;
      s.x += s.vx * substepDt;
      s.y += s.vy * substepDt;
      s.angle += s.angularVelocity * substepDt;
      s.angularVelocity *= Math.pow(ANGULAR_DRAG, substepDt);
      let speed = Math.hypot(s.vx, s.vy);
      if (speed > MAX_LINEAR_SPEED) {
        s.vx = (s.vx / speed) * MAX_LINEAR_SPEED;
        s.vy = (s.vy / speed) * MAX_LINEAR_SPEED;
      }
      if (s.y + s.radius > canvasHeight) { s.y = canvasHeight - s.radius; if (s.vy > 0) s.vy = -s.vy * BOUNCE; s.vx *= 0.95; }
      if (s.y - s.radius < 0) { s.y = s.radius; if (s.vy < 0) s.vy = -s.vy * BOUNCE; }
      if (s.x - s.radius < 0) { s.x = s.radius; if (s.vx < 0) s.vx = -s.vx * BOUNCE; }
      if (s.x + s.radius > canvasWidth) { s.x = canvasWidth - s.radius; if (s.vx > 0) s.vx = -s.vx * BOUNCE; }
    }
    checkCollisions(playArea, gameTime);
  }
  checkForBombExplosions(gameTime);
  updateDittoTransformations(shapes, gameTime);
  updateMagneticFields(gameTime, currentComboMultiplier, comboManager);
  handleSplitterActivation(shapes, gameTime);
  for (let s of shapes) {
    s.currentSquishX += (s.targetSquishX - s.currentSquishX) * 0.2;
    s.currentSquishY += (s.targetSquishY - s.currentSquishY) * 0.2;
    s.targetSquishX = s.targetSquishX * 0.9 + 0.1;
    s.targetSquishY = s.targetSquishY * 0.9 + 0.1;
  }
  for (let i = mergingAnimations.length - 1; i >= 0; i--) {
    const anim = mergingAnimations[i];
    anim.progress += dt / anim.duration;
    if (anim.progress >= 1) {
      if (anim.isBombFlash) {
        mergingAnimations.splice(i, 1);
        continue;
      }
      comboManager.triggerCombo(true, anim.shape1Gold || anim.shape2Gold, anim.shape1Gold && anim.shape2Gold);
      let mult = currentComboMultiplier;
      let scoreToAdd = 0;
      const baseMergeScore = SHAPE_HIERARCHY[anim.targetType]?.mergeScore || 20;
      if (anim.shape1Gold || anim.shape2Gold) {
        const oneGold = !(anim.shape1Gold && anim.shape2Gold);
        const goldMult = comboManager.getGoldMultiplier(oneGold);
        scoreToAdd = baseMergeScore * goldMult * mult;
      } else {
        scoreToAdd = baseMergeScore * mult;
      }
      updateScoreDisplay(scoreToAdd);
      const spawned = addShape(anim.targetType, anim.targetX, anim.targetY, 0, 0, gameTime);
      if (spawned) {
        for (let s of shapes) {
          if (s.id !== spawned.id && Math.hypot(s.x - spawned.x, s.y - spawned.y) < s.radius + spawned.radius + 20) wakeUpShape(s);
        }
      }
      mergingAnimations.splice(i, 1);
    }
  }
  updatePowerActiveBadge();
  checkGameOver();
}

function draw() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.strokeStyle = 'rgba(239,68,68,0.4)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, 80);
  ctx.lineTo(canvasWidth, 80);
  ctx.stroke();
  ctx.setLineDash([]);
  if (gameActive && !paused && isReadyToDrop) {
    if (currentDropPower) {
      let previewRadius = 42, previewColor = '#aaa';
      let flags = { isGold: false, isDitto: false, isBomb: false, isMagnetic: false, isSplitter: false };
      if (currentDropPower === 'gold') {
        flags.isGold = true;
        previewRadius = SHAPE_HIERARCHY[SHAPE_TYPES[0]].size;
        previewColor = '#ffc107';
      } else if (currentDropPower === 'ditto') {
        flags.isDitto = true;
        previewColor = '#ce93d8';
      } else if (currentDropPower === 'bomb') {
        flags.isBomb = true;
        previewColor = '#212121';
        previewRadius = 48;
      } else if (currentDropPower === 'magnetic') {
        flags.isMagnetic = true;
        previewColor = '#29b6f6';
        previewRadius = 48;
      } else if (currentDropPower === 'splitter') {
        flags.isSplitter = true;
        previewColor = '#ef5350';
        previewRadius = 48;
      }
      const targetX = Math.max(previewRadius, Math.min(canvasWidth - previewRadius, mouseX));
      ctx.strokeStyle = 'rgba(190,204,218,0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(targetX, 80);
      ctx.lineTo(targetX, canvasHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      drawShapeElement(ctx, gameTime, [], targetX, 40, previewRadius, previewColor, 0, 0.55, 1, 1, null, false, flags.isGold, flags.isDitto, flags.isBomb, flags.isMagnetic, flags.isSplitter, null);
    } else if (currentDropType && SHAPE_HIERARCHY[currentDropType]) {
      const config = SHAPE_HIERARCHY[currentDropType];
      const targetX = Math.max(config.size, Math.min(canvasWidth - config.size, mouseX));
      ctx.strokeStyle = 'rgba(190,204,218,0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(targetX, 80);
      ctx.lineTo(targetX, canvasHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      drawShapeElement(ctx, gameTime, config.vertices, targetX, 40, config.size, config.color, 0, 0.55, 1, 1, null, false, currentDropIsGold, false, false, false, false, null);
    }
  }
  for (let s of shapes) {
    drawShapeElement(ctx, gameTime, s.vertices, s.x, s.y, s.radius, s.color, s.angle, 1.0, s.currentSquishX, s.currentSquishY, s.face, s.isSleeping, s.isGold, s.isDitto, s.isBomb, s.isMagnetic, s.isSplitter, s.bombTimerLeft);
    if (s.isBomb && s.bombTimerLeft !== null && s.bombTimerLeft > 0) {
      drawBombRangeEffect(ctx, s.x, s.y, s.radius, gameTime, s.bombTimerLeft);
    }
    if (s.isMagnetic) {
      drawMagneticRangePulse(ctx, s.x, s.y, gameTime);
    }
  }
  for (let anim of mergingAnimations) {
    const t = Math.min(1, anim.progress);
    if (anim.isBombFlash) {
      const curX1 = anim.x1 + (anim.targetX - anim.x1) * t, curY1 = anim.y1 + (anim.targetY - anim.y1) * t;
      drawShapeElement(ctx, gameTime, anim.vertices1, curX1, curY1, anim.radius1 * (1 + t * 0.4), '#ffeb3b', anim.angle1, 1 - t, 1, 1, null, false, false, false, false, false, false, null);
      continue;
    }
    const curX1 = anim.x1 + (anim.targetX - anim.x1) * t, curY1 = anim.y1 + (anim.targetY - anim.y1) * t, curR1 = anim.radius1 * (1 - t);
    const curX2 = anim.x2 + (anim.targetX - anim.x2) * t, curY2 = anim.y2 + (anim.targetY - anim.y2) * t, curR2 = anim.radius2 * (1 - t);
    if (curR1 > 1) drawShapeElement(ctx, gameTime, anim.vertices1, curX1, curY1, curR1, anim.color1, anim.angle1, 1 - t, 1, 1, null, false, anim.shape1Gold, false, false, false, false, null);
    if (curR2 > 1) drawShapeElement(ctx, gameTime, anim.vertices2, curX2, curY2, curR2, anim.color2, anim.angle2, 1 - t, 1, 1, null, false, anim.shape2Gold, false, false, false, false, null);
    const spawnR = anim.targetRadius * t;
    if (spawnR > 1) drawShapeElement(ctx, gameTime, anim.targetVertices, anim.targetX, anim.targetY, spawnR, anim.targetColor, 0, t, 1, 1, null, false, false, false, false, false, false, null);
  }
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Quicksand';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvasWidth / 2, canvasHeight / 2);
  }
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  if (dt > 0.033) dt = 0.033;
  if (dt > 0.001) { update(dt); lastTime = timestamp; }
  draw();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  clearPhysicsState();
  comboManager.resetCombo();
  gameTime = 0; gameActive = true; paused = false; isReadyToDrop = true;
  resetScoreDisplay();
  timerDisplay.innerText = '0.0';
  pauseBtn.innerText = "⏸️";
  gameOverlay.classList.add('hidden');
  activePowerBadge.classList.add('hidden');
  initializeShapeQueue();
  loadCurrentDrop();
  updatePowerUpList();
}

function handlePointerMove(clientX) {
  const rect = canvas.getBoundingClientRect();
  mouseX = Math.max(0, Math.min(canvasWidth, clientX - rect.left));
}
function handleFirstInteraction() {
  if (!audioInitialized) { initAudio(); audioInitialized = true; }
}

function bindUI() {
  window.addEventListener('resize', () => resizeCanvas());
  let isDragging = false;
  canvas.addEventListener('mousemove', (e) => { if (gameActive && !paused) handlePointerMove(e.clientX); });
  canvas.addEventListener('touchmove', (e) => { if (gameActive && !paused) { e.preventDefault(); if (e.touches.length) handlePointerMove(e.touches[0].clientX); } }, { passive: false });
  canvas.addEventListener('mousedown', (e) => { if (!e.target.closest('button') && gameActive && !paused) { isDragging = true; handlePointerMove(e.clientX); } });
  canvas.addEventListener('touchstart', (e) => { if (!e.target.closest('button') && gameActive && !paused) { e.preventDefault(); isDragging = true; if (e.touches.length) handlePointerMove(e.touches[0].clientX); } }, { passive: false });
  const releaseDrop = () => { if (isDragging) { isDragging = false; if (gameActive && !paused) { handleFirstInteraction(); performDrop(); } } };
  window.addEventListener('mouseup', releaseDrop);
  window.addEventListener('touchend', releaseDrop);
  window.addEventListener('touchcancel', releaseDrop);
  muteBtn.addEventListener('click', () => { handleFirstInteraction(); muted = !muted; setMuteState(muted); muteBtn.innerText = muted ? "🔇" : "🔊"; playGoofySound('click'); });
  pauseBtn.addEventListener('click', () => { if (!gameActive) return; handleFirstInteraction(); paused = !paused; pauseBtn.innerText = paused ? "▶️" : "⏸️"; playGoofySound('click'); });
  resetBtn.addEventListener('click', () => { handleFirstInteraction(); playGoofySound('click'); resetGame(); });
  restartBtn.addEventListener('click', () => { handleFirstInteraction(); playGoofySound('click'); resetGame(); });
}

resizeCanvas();
bindUI();
resetGame();
requestAnimationFrame(gameLoop);