// main.js
import './style.css';
import { SHAPE_HIERARCHY, SHAPE_TYPES, PHYSICS_CONSTANTS } from './config.js';
import { initAudio, playGoofySound, setMuteState } from './audio.js';
import { shapes, mergingAnimations, clearPhysicsState, addShape, checkCollisions, wakeUpShape } from './physics.js';
import { resetScoreDisplay, updateScoreDisplay } from './ui.js';
import { updateDittoTransformations } from './powers/dittoPower.js';
import { checkForBombExplosions } from './powers/bombPower.js';
import { updateMagneticFields, drawMagneticRangePulse } from './powers/magneticPower.js';
import { drawSplitterEffect } from './powers/splitterPower.js';
import { ComboManager } from './managers/comboManager.js';
import { drawShapeElement } from './render/shapeRenderer.js';

const wrapper = document.getElementById('gameContainer');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameActive = true;
let paused = false;
let muted = false;
let gameTime = 0;
let lastTime = 0;

let currentDropType = '';
let currentDropIsGold = false;
let currentDropIsDitto = false;
let currentDropIsBomb = false;
let currentDropIsMagnetic = false;
let currentDropIsSplitter = false;
let currentDropMagneticTarget = '';

let mouseX = 0;
let isReadyToDrop = true;

let currentComboMultiplier = 1;
let audioInitialized = false;

let shapeQueue = [];
let powerUpList = [];
let currentQueueIndex = 0;

let sizeMultiplier = 1;

const comboManager = new ComboManager((count, multiplier) => {
  currentComboMultiplier = multiplier;
});

let playArea = { x: 0, y: 0, width: 0, height: 0 };
let canvasWidth = 0;
let canvasHeight = 0;

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
  const referenceWidth = 375;
  const referenceHeight = 600;
  const widthRatio = rect.width / referenceWidth;
  const heightRatio = rect.height / referenceHeight;
  sizeMultiplier = Math.min(widthRatio, heightRatio, 1.2);
  return sizeMultiplier;
}

function getScaledSize(originalSize) {
  return Math.max(20, Math.min(80, originalSize * sizeMultiplier));
}

function generateRandomShapeOrPowerUp() {
  const random = Math.random();
  if (random < 0.2) {
    const powerUpRandom = Math.random();
    if (powerUpRandom < 0.2) {
      return { type: 'powerup', powerUpType: 'gold', gold: true, ditto: false, bomb: false, magnetic: false, splitter: false, magneticTarget: null };
    } else if (powerUpRandom < 0.4) {
      return { type: 'powerup', powerUpType: 'ditto', gold: false, ditto: true, bomb: false, magnetic: false, splitter: false, magneticTarget: null };
    } else if (powerUpRandom < 0.6) {
      return { type: 'powerup', powerUpType: 'bomb', gold: false, ditto: false, bomb: true, magnetic: false, splitter: false, magneticTarget: null };
    } else if (powerUpRandom < 0.8) {
      return { type: 'powerup', powerUpType: 'magnetic', gold: false, ditto: false, bomb: false, magnetic: true, splitter: false, magneticTarget: SHAPE_TYPES[Math.floor(Math.random() * 4)] };
    } else {
      return { type: 'powerup', powerUpType: 'splitter', gold: false, ditto: false, bomb: false, magnetic: false, splitter: true, magneticTarget: null };
    }
  } else {
    const shapeType = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
    const isGoldShape = Math.random() < 0.1;
    return { type: 'shape', shapeType: shapeType, isGold: isGoldShape };
  }
}

function initializeShapeQueue() {
  shapeQueue = [];
  for (let i = 0; i < 25; i++) {
    shapeQueue.push(generateRandomShapeOrPowerUp());
  }
  currentQueueIndex = 0;
  updatePowerUpList();
}

function addToShapeQueue() {
  shapeQueue.push(generateRandomShapeOrPowerUp());
  updatePowerUpList();
}

function updatePowerUpList() {
  powerUpList = [];
  let dropCounter = 0;
  for (let i = currentQueueIndex; i < shapeQueue.length && powerUpList.length < 6; i++) {
    const item = shapeQueue[i];
    powerUpList.push({
      item: item,
      dropsLeft: dropCounter,
      isCurrent: (i === currentQueueIndex)
    });
    dropCounter++;
  }
  updatePowerUpQueueUI();
}

function loadCurrentDrop() {
  if (currentQueueIndex >= shapeQueue.length) {
    addToShapeQueue();
  }
  const currentItem = shapeQueue[currentQueueIndex];
  if (currentItem.type === 'shape') {
    currentDropType = currentItem.shapeType;
    currentDropIsGold = currentItem.isGold || false;
    currentDropIsDitto = false;
    currentDropIsBomb = false;
    currentDropIsMagnetic = false;
    currentDropIsSplitter = false;
    currentDropMagneticTarget = '';
  } else {
    currentDropType = SHAPE_TYPES[0];
    currentDropIsGold = currentItem.gold;
    currentDropIsDitto = currentItem.ditto;
    currentDropIsBomb = currentItem.bomb;
    currentDropIsMagnetic = currentItem.magnetic;
    currentDropIsSplitter = currentItem.splitter;
    currentDropMagneticTarget = currentItem.magneticTarget || '';
  }
}

function advanceQueue() {
  currentQueueIndex++;
  if (currentQueueIndex >= shapeQueue.length) {
    addToShapeQueue();
  }
  loadCurrentDrop();
  updatePowerUpList();
}

function updatePowerUpQueueUI() {
  if (!powerUpQueueDiv) return;
  powerUpQueueDiv.innerHTML = '';
  for (let i = 0; i < powerUpList.length; i++) {
    const entry = powerUpList[i];
    const item = entry.item;
    const dropsLeft = entry.dropsLeft;
    const isCurrent = entry.isCurrent;
    const powerDiv = document.createElement('div');
    powerDiv.className = `queue-item flex flex-col items-center justify-center rounded-xl border-2 flex-shrink-0 relative ${isCurrent ? 'border-[#58cc02] bg-[#58cc02]/5 shadow-lg' : 'border-[#e2e8f0] bg-white'}`;
    powerDiv.style.width = '75px';
    powerDiv.style.minWidth = '75px';
    let icon = '';
    let bgClass = '';
    let targetText = '';
    let displayType = '';
    if (item.type === 'powerup') {
      if (item.powerUpType === 'gold') {
        icon = '✨';
        bgClass = 'bg-gradient-to-br from-[#fff176] to-[#ffb300]';
        displayType = 'GOLD';
      } else if (item.powerUpType === 'ditto') {
        icon = '👥';
        bgClass = 'bg-gradient-to-br from-[#e1bee7] to-[#ba68c8]';
        displayType = 'DITTO';
      } else if (item.powerUpType === 'bomb') {
        icon = '💣';
        bgClass = 'bg-gradient-to-br from-[#616161] to-[#212121]';
        displayType = 'BOMB';
      } else if (item.powerUpType === 'magnetic') {
        icon = '🧲';
        bgClass = 'bg-gradient-to-br from-[#00e5ff] to-[#0091ea]';
        displayType = 'MAGNETIC';
        targetText = item.magneticTarget ? item.magneticTarget.substring(0, 3) : '';
      } else if (item.powerUpType === 'splitter') {
        icon = '✂️';
        bgClass = 'bg-gradient-to-br from-[#81c784] to-[#388e3c]';
        displayType = 'SPLITTER';
      }
    } else {
      if (item.isGold) {
        icon = '✨';
        bgClass = 'bg-gradient-to-br from-[#fff176] to-[#ffb300]';
        displayType = 'GOLD';
      } else {
        const config = SHAPE_HIERARCHY[item.shapeType];
        if (config) {
          bgClass = config.color;
          displayType = item.shapeType.toUpperCase();
          icon = '';
        }
      }
    }
    const counterDiv = document.createElement('div');
    counterDiv.className = 'absolute top-1 right-1 bg-[#1cb0f6] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md z-20';
    counterDiv.innerText = dropsLeft;
    const iconDiv = document.createElement('div');
    iconDiv.className = `w-14 h-14 rounded-lg flex items-center justify-center text-2xl shadow-md relative overflow-hidden`;
    iconDiv.style.background = bgClass;
    iconDiv.style.backgroundColor = bgClass;
    const iconSpan = document.createElement('span');
    iconSpan.className = 'relative z-10';
    iconSpan.innerText = icon || '🍒';
    iconDiv.appendChild(iconSpan);
    if (targetText) {
      const targetSpan = document.createElement('span');
      targetSpan.className = 'absolute -bottom-1 -right-1 text-[10px] font-black text-white bg-black/60 rounded-full px-1 z-20';
      targetSpan.innerText = targetText;
      iconDiv.appendChild(targetSpan);
    }
    const typeSpan = document.createElement('span');
    typeSpan.className = 'text-[10px] font-bold text-[#475569] text-center mt-1';
    typeSpan.innerText = displayType;
    powerDiv.appendChild(counterDiv);
    powerDiv.appendChild(iconDiv);
    powerDiv.appendChild(typeSpan);
    powerUpQueueDiv.appendChild(powerDiv);
  }
}

function resizeCanvas() {
  const container = document.getElementById('canvasContainer');
  const rect = container.getBoundingClientRect();
  canvasWidth = rect.width;
  canvasHeight = rect.height;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  playArea.width = canvasWidth;
  playArea.height = canvasHeight;
  playArea.x = 0;
  playArea.y = 0;
  if (mouseX === 0) {
    mouseX = canvasWidth / 2;
  }
  calculateSizeMultiplier();
  for (let key in SHAPE_HIERARCHY) {
    if (!SHAPE_HIERARCHY[key].originalSize) {
      SHAPE_HIERARCHY[key].originalSize = SHAPE_HIERARCHY[key].size;
    }
    SHAPE_HIERARCHY[key].size = getScaledSize(SHAPE_HIERARCHY[key].originalSize);
  }
}

function checkGameOver() {
  for (let s of shapes) {
    if (s.isMagnetic) continue;
    if (gameTime - s.spawnTime > 1.5) {
      if (s.y - s.radius <= 80 && Math.abs(s.vx) < 0.2 && Math.abs(s.vy) < 0.2) {
        gameActive = false;
        gameOverlay.classList.remove('hidden');
        playGoofySound('gameover');
        break;
      }
    }
  }
}

function performDrop() {
  if (!gameActive || paused || !isReadyToDrop) return;
  isReadyToDrop = false;
  comboManager.triggerCombo(false);
  if (!currentDropType || !SHAPE_HIERARCHY[currentDropType]) {
    currentDropType = SHAPE_TYPES[0];
  }
  const config = SHAPE_HIERARCHY[currentDropType];
  const size = config.size;
  const minX = size;
  const maxX = canvasWidth - size;
  const dropX = Math.max(minX, Math.min(maxX, mouseX));
  const dropY = 90;
  const dropped = addShape(currentDropType, dropX, dropY, 0, 1.5, gameTime, currentDropIsSplitter);
  if (dropped) {
    if (currentDropIsGold) dropped.isGold = true;
    if (currentDropIsDitto) {
      dropped.isDitto = true;
      dropped.radius = size;
      dropped.vertices = config.vertices;
    }
    if (currentDropIsBomb) {
      dropped.isBomb = true;
      dropped.radius = size;
      dropped.bombSpawnTime = gameTime;
      dropped.bombTimerLeft = 4.0;
      dropped.vertices = config.vertices;
    }
    if (currentDropIsMagnetic) {
      dropped.isMagnetic = true;
      dropped.magneticTargetType = currentDropMagneticTarget;
      dropped.radius = size;
      dropped.vertices = config.vertices;
      dropped.vx = 0;
      dropped.vy = 1.5;
      dropped.angularVelocity = 0;
    }
    if (currentDropIsSplitter) {
      dropped.isSplitter = true;
      dropped.radius = size;
      dropped.vertices = config.vertices;
    }
  }
  playGoofySound('drop');
  advanceQueue();
  setTimeout(() => { isReadyToDrop = true; }, 300);
}

function update(dt) {
  if (!gameActive || paused) return;
  gameTime += dt;
  timerDisplay.innerText = gameTime.toFixed(1);
  updateDittoTransformations(shapes);
  checkForBombExplosions(gameTime, shapes, mergingAnimations, updateScoreDisplay);
  updateMagneticFields(gameTime, shapes, mergingAnimations, playGoofySound, wakeUpShape);
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
      const speed = Math.hypot(s.vx, s.vy);
      if (speed > MAX_LINEAR_SPEED) {
        s.vx = (s.vx / speed) * MAX_LINEAR_SPEED;
        s.vy = (s.vy / speed) * MAX_LINEAR_SPEED;
      }
      if (s.y + s.radius > canvasHeight) {
        s.y = canvasHeight - s.radius;
        if (s.vy > 0) s.vy = -s.vy * BOUNCE;
        s.vx *= 0.95;
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
    checkCollisions(playArea, gameTime, shapes, mergingAnimations, updateScoreDisplay, currentComboMultiplier, comboManager, wakeUpShape);
  }
  for (let s of shapes) {
    s.currentSquishX += (s.targetSquishX - s.currentSquishX) * 0.2;
    s.currentSquishY += (s.targetSquishY - s.currentSquishY) * 0.2;
    s.targetSquishX = s.targetSquishX * 0.9 + 0.1;
    s.targetSquishY = s.targetSquishY * 0.9 + 0.1;
    if (Math.abs(s.targetSquishX - 1) < 0.01) s.targetSquishX = 1;
    if (Math.abs(s.targetSquishY - 1) < 0.01) s.targetSquishY = 1;
  }
  for (let i = mergingAnimations.length - 1; i >= 0; i--) {
    const anim = mergingAnimations[i];
    anim.progress += dt / anim.duration;
    if (anim.progress >= 1) {
      if (anim.isBombFlash) {
        mergingAnimations.splice(i, 1);
        continue;
      }
      comboManager.triggerCombo(true);
      let mult = currentComboMultiplier;
      let scoreToAdd = 0;
      const baseReward = SHAPE_TYPES.indexOf(anim.targetType) + 1;
      if (anim.shape1Gold && anim.shape2Gold) {
        scoreToAdd = baseReward * 50 * mult;
      } else if (anim.shape1Gold || anim.shape2Gold) {
        scoreToAdd = baseReward * 10 * mult;
      } else {
        scoreToAdd = baseReward * mult;
      }
      if (scoreToAdd > 0) {
        updateScoreDisplay(scoreToAdd);
      }
      const spawned = addShape(anim.targetType, anim.targetX, anim.targetY, 0, 0, gameTime);
      if (spawned) {
        for (let s of shapes) {
          if (s.id !== spawned.id) {
            const dx = s.x - spawned.x;
            const dy = s.y - spawned.y;
            if (Math.hypot(dx, dy) < s.radius + spawned.radius + 20) {
              wakeUpShape(s);
            }
          }
        }
      }
      mergingAnimations.splice(i, 1);
    }
  }
  checkGameOver();
}

function draw() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, 80);
  ctx.lineTo(canvasWidth, 80);
  ctx.stroke();
  ctx.setLineDash([]);
  if (gameActive && !paused && currentDropType && isReadyToDrop && SHAPE_HIERARCHY[currentDropType]) {
    const config = SHAPE_HIERARCHY[currentDropType];
    const size = config.size;
    const minX = size;
    const maxX = canvasWidth - size;
    const targetX = Math.max(minX, Math.min(maxX, mouseX));
    const targetY = 40;
    ctx.strokeStyle = 'rgba(190, 204, 218, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(targetX, 80);
    ctx.lineTo(targetX, canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    if (currentDropIsMagnetic) {
      drawMagneticRangePulse(ctx, targetX, 90, gameTime);
    }
    drawShapeElement(ctx, gameTime, config.vertices, targetX, targetY, size, config.color, 0, 0.55, 1.0, 1.0, null, false, currentDropIsGold, currentDropIsDitto, currentDropIsBomb, currentDropIsMagnetic, 4.0);
  }
  for (let s of shapes) {
    if (s.isMagnetic && !s.isExploding) {
      drawMagneticRangePulse(ctx, s.x, s.y, gameTime);
    }
    if (s.isSplitter && !s.isExploding) {
      drawSplitterEffect(ctx, s.radius, gameTime);
    }
    drawShapeElement(ctx, gameTime, s.vertices, s.x, s.y, s.radius, s.color, s.angle, 1.0, s.currentSquishX, s.currentSquishY, s.face, s.isSleeping, s.isGold, s.isDitto, s.isBomb, s.isMagnetic, s.bombTimerLeft);
  }
  for (let anim of mergingAnimations) {
    const t = Math.min(1, anim.progress);
    if (anim.isBombFlash) {
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = anim.targetColor;
      ctx.beginPath();
      if (anim.targetVertices && anim.targetVertices.length > 0) {
        ctx.translate(anim.targetX, anim.targetY);
        ctx.scale(anim.targetRadius / anim.radius1, anim.targetRadius / anim.radius1);
        ctx.moveTo(anim.targetVertices[0][0] * anim.radius1, anim.targetVertices[0][1] * anim.radius1);
        for (let i = 1; i < anim.targetVertices.length; i++) {
          ctx.lineTo(anim.targetVertices[i][0] * anim.radius1, anim.targetVertices[i][1] * anim.radius1);
        }
      } else {
        ctx.arc(anim.targetX, anim.targetY, anim.targetRadius, 0, Math.PI * 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      continue;
    }
    const curX1 = anim.x1 + (anim.targetX - anim.x1) * t;
    const curY1 = anim.y1 + (anim.targetY - anim.y1) * t;
    const curR1 = anim.radius1 * (1 - t);
    const curX2 = anim.x2 + (anim.targetX - anim.x2) * t;
    const curY2 = anim.y2 + (anim.targetY - anim.y2) * t;
    const curR2 = anim.radius2 * (1 - t);
    if (curR1 > 1) drawShapeElement(ctx, gameTime, anim.vertices1, curX1, curY1, curR1, anim.color1, anim.angle1, 1 - t, 1.0, 1.0, null, false, anim.shape1Gold, false, false, false, null);
    if (curR2 > 1) drawShapeElement(ctx, gameTime, anim.vertices2, curX2, curY2, curR2, anim.color2, anim.angle2, 1 - t, 1.0, 1.0, null, false, anim.shape2Gold, false, false, false, null);
    const spawnR = anim.targetRadius * t;
    if (spawnR > 1) {
      drawShapeElement(ctx, gameTime, anim.targetVertices, anim.targetX, anim.targetY, spawnR, anim.targetColor, 0, t, 1.0, 1.0, null, false, false, false, false, false, null);
    }
  }
  if (paused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
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
  if (dt > 0.001) {
    update(dt);
    lastTime = timestamp;
  }
  draw();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  clearPhysicsState();
  comboManager.resetCombo();
  gameTime = 0;
  gameActive = true;
  paused = false;
  isReadyToDrop = true;
  resetScoreDisplay();
  timerDisplay.innerText = '0.0';
  pauseBtn.innerText = "⏸️";
  gameOverlay.classList.add('hidden');
  initializeShapeQueue();
  loadCurrentDrop();
  updatePowerUpList();
  if (activePowerBadge) {
    activePowerBadge.classList.add('hidden');
  }
}

function handlePointerMove(clientX) {
  const rect = canvas.getBoundingClientRect();
  let newX = clientX - rect.left;
  mouseX = Math.max(0, Math.min(canvasWidth, newX));
}

function handleFirstInteraction() {
  if (!audioInitialized) {
    initAudio();
    audioInitialized = true;
  }
}

function bindUI() {
  window.addEventListener('resize', () => {
    resizeCanvas();
  });
  let isDragging = false;
  canvas.addEventListener('mousemove', (e) => {
    if (!gameActive || paused) return;
    handlePointerMove(e.clientX);
  });
  canvas.addEventListener('touchmove', (e) => {
    if (!gameActive || paused) return;
    e.preventDefault();
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX);
    }
  }, { passive: false });
  canvas.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    if (!gameActive || paused) return;
    isDragging = true;
    handlePointerMove(e.clientX);
  });
  canvas.addEventListener('touchstart', (e) => {
    if (e.target.closest('button')) return;
    if (!gameActive || paused) return;
    e.preventDefault();
    isDragging = true;
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX);
    }
  }, { passive: false });
  const releaseDrop = () => {
    if (!isDragging) return;
    isDragging = false;
    if (!gameActive || paused) return;
    handleFirstInteraction();
    performDrop();
  };
  window.addEventListener('mouseup', releaseDrop);
  window.addEventListener('touchend', releaseDrop);
  window.addEventListener('touchcancel', releaseDrop);
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleFirstInteraction();
    muted = !muted;
    setMuteState(muted);
    muteBtn.innerText = muted ? "🔇" : "🔊";
    playGoofySound('click');
  });
  pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!gameActive) return;
    handleFirstInteraction();
    paused = !paused;
    pauseBtn.innerText = paused ? "▶️" : "⏸️";
    playGoofySound('click');
  });
  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleFirstInteraction();
    playGoofySound('click');
    resetGame();
  });
  restartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleFirstInteraction();
    playGoofySound('click');
    resetGame();
  });
}

resizeCanvas();
bindUI();
resetGame();
requestAnimationFrame(gameLoop);