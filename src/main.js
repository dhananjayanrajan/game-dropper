// main.js
import './style.css';
import { SHAPE_HIERARCHY, SHAPE_TYPES, PHYSICS_CONSTANTS } from './config.js';
import { initAudio, playGoofySound, setMuteState } from './audio.js';
import { shapes, mergingAnimations, clearPhysicsState, addShape, checkCollisions, wakeUpShape } from './physics.js';
import { resetScoreDisplay, renderNextShapePreview, updateScoreDisplay } from './ui.js';
import { updateDittoTransformations } from './powers/dittoPower.js';
import { checkForBombExplosions } from './powers/bombPower.js';
import { updateMagneticFields, drawMagneticRangePulse } from './powers/magneticPower.js';
import { drawSplitterEffect } from './powers/splitterPower.js';
import { ComboManager } from './managers/comboManager.js';
import { drawShapeElement } from './render/shapeRenderer.js';

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

let dropCounter = 0;
let isCurrentGold = false;
let isNextGold = false;
let isCurrentDitto = false;
let isNextDitto = false;
let isCurrentBomb = false;
let isNextBomb = false;
let isCurrentMagnetic = false;
let isNextMagnetic = false;
let isCurrentSplitter = false;
let isNextSplitter = false;
let currentMagneticTarget = '';
let nextMagneticTarget = '';

let currentComboMultiplier = 1;
let audioInitialized = false;

let powerUpQueue = [];
let activePowerUp = null;
let powerUpDropCounter = 0;

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

function generateRandomPowerUp() {
  const random = Math.random();

  if (random < 0.25) {
    return {
      type: 'gold',
      gold: true,
      ditto: false,
      bomb: false,
      magnetic: false,
      splitter: false,
      magneticTarget: null
    };
  } else if (random < 0.45) {
    return {
      type: 'ditto',
      gold: false,
      ditto: true,
      bomb: false,
      magnetic: false,
      splitter: false,
      magneticTarget: null
    };
  } else if (random < 0.65) {
    return {
      type: 'bomb',
      gold: false,
      ditto: false,
      bomb: true,
      magnetic: false,
      splitter: false,
      magneticTarget: null
    };
  } else if (random < 0.85) {
    return {
      type: 'magnetic',
      gold: false,
      ditto: false,
      bomb: false,
      magnetic: true,
      splitter: false,
      magneticTarget: SHAPE_TYPES[Math.floor(Math.random() * 4)]
    };
  } else {
    return {
      type: 'splitter',
      gold: false,
      ditto: false,
      bomb: false,
      magnetic: false,
      splitter: true,
      magneticTarget: null
    };
  }
}

function addPowerUpToQueue() {
  const powerUp = generateRandomPowerUp();
  powerUpQueue.push(powerUp);
  if (powerUpQueue.length > 5) {
    powerUpQueue.shift();
  }
  updatePowerUpQueueUI();
}

function updatePowerUpQueueUI() {
  if (!powerUpQueueDiv) return;

  powerUpQueueDiv.innerHTML = '';

  powerUpQueue.forEach((powerUp, index) => {
    const isActive = (activePowerUp === powerUp);
    const powerDiv = document.createElement('div');
    powerDiv.className = `flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${isActive ? 'border-[#58cc02] bg-[#58cc02]/10 shadow-lg scale-105' : 'border-[#e2e8f0] bg-white'}`;

    let icon = '';
    let bgClass = '';

    if (powerUp.type === 'gold') {
      icon = '✨';
      bgClass = 'bg-gradient-to-br from-[#fff176] to-[#ffb300]';
    } else if (powerUp.type === 'ditto') {
      icon = '👥';
      bgClass = 'bg-gradient-to-br from-[#e1bee7] to-[#ba68c8]';
    } else if (powerUp.type === 'bomb') {
      icon = '💣';
      bgClass = 'bg-gradient-to-br from-[#616161] to-[#212121]';
    } else if (powerUp.type === 'magnetic') {
      icon = '🧲';
      bgClass = 'bg-gradient-to-br from-[#00e5ff] to-[#0091ea]';
    } else if (powerUp.type === 'splitter') {
      icon = '✂️';
      bgClass = 'bg-gradient-to-br from-[#81c784] to-[#388e3c]';
    }

    powerDiv.innerHTML = `
      <div class="w-10 h-10 rounded-lg ${bgClass} flex items-center justify-center text-xl shadow-md">
        ${icon}
      </div>
      <span class="text-xs font-bold text-[#475569]">${powerUp.type.toUpperCase()}</span>
      ${isActive ? '<span class="text-[10px] font-black text-[#58cc02]">ACTIVE</span>' : ''}
    `;

    powerUpQueueDiv.appendChild(powerDiv);
  });

  if (powerUpQueue.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'text-xs text-[#475569] font-bold p-2';
    emptyDiv.innerText = 'No power ups in queue';
    powerUpQueueDiv.appendChild(emptyDiv);
  }
}

function activateNextPowerUp() {
  if (activePowerUp) {
    return;
  }

  if (powerUpQueue.length > 0) {
    activePowerUp = powerUpQueue.shift();
    powerUpDropCounter = 0;
    updatePowerUpQueueUI();
  }
}

function useActivePowerUp() {
  if (!activePowerUp) return false;

  isCurrentGold = activePowerUp.gold;
  isCurrentDitto = activePowerUp.ditto;
  isCurrentBomb = activePowerUp.bomb;
  isCurrentMagnetic = activePowerUp.magnetic;
  isCurrentSplitter = activePowerUp.splitter;
  if (activePowerUp.magnetic) {
    currentMagneticTarget = activePowerUp.magneticTarget;
  }

  activePowerUp = null;
  updatePowerUpQueueUI();

  return true;
}

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
    isCurrentGold = false;
    isCurrentDitto = false;
    isCurrentBomb = false;
    isCurrentMagnetic = false;
    isCurrentSplitter = false;
    currentMagneticTarget = '';
  } else {
    currentDropType = nextDropType;
    isCurrentGold = isNextGold;
    isCurrentDitto = isNextDitto;
    isCurrentBomb = isNextBomb;
    isCurrentMagnetic = isNextMagnetic;
    isCurrentSplitter = isNextSplitter;
    currentMagneticTarget = nextMagneticTarget;
  }

  dropCounter++;

  if (dropCounter % 20 === 0) {
    nextDropType = SHAPE_TYPES[Math.floor(Math.random() * 5)];
    isNextGold = true;
    isNextDitto = false;
    isNextBomb = false;
    isNextMagnetic = false;
    isNextSplitter = false;
    nextMagneticTarget = '';
  } else if (dropCounter % 25 === 0) {
    nextDropType = 'Cherry';
    isNextGold = false;
    isNextDitto = false;
    isNextBomb = false;
    isNextMagnetic = false;
    isNextSplitter = true;
    nextMagneticTarget = '';
  } else if (dropCounter % 15 === 0) {
    nextDropType = 'Cherry';
    isNextGold = false;
    isNextDitto = true;
    isNextBomb = false;
    isNextMagnetic = false;
    isNextSplitter = false;
    nextMagneticTarget = '';
  } else if (dropCounter % 12 === 0) {
    nextDropType = 'Cherry';
    isNextGold = false;
    isNextDitto = false;
    isNextBomb = true;
    isNextMagnetic = false;
    isNextSplitter = false;
    nextMagneticTarget = '';
  } else if (dropCounter % 9 === 0) {
    nextDropType = 'Cherry';
    isNextGold = false;
    isNextDitto = false;
    isNextBomb = false;
    isNextMagnetic = true;
    isNextSplitter = false;
    nextMagneticTarget = SHAPE_TYPES[Math.floor(Math.random() * 4)];
  } else {
    nextDropType = SHAPE_TYPES[Math.floor(Math.random() * 5)];
    isNextGold = false;
    isNextDitto = false;
    isNextBomb = false;
    isNextMagnetic = false;
    isNextSplitter = false;
    nextMagneticTarget = '';
  }

  if (isNextDitto) {
    renderNextShapePreview("👥 DITTO BLOCK", { color: '#e1bee7' });
  } else if (isNextBomb) {
    renderNextShapePreview("💣 BOMB FRUIT", { color: '#424242' });
  } else if (isNextMagnetic) {
    renderNextShapePreview(`🧲 MAG: ${nextMagneticTarget.toUpperCase()}`, { color: '#00e5ff' });
  } else if (isNextSplitter) {
    renderNextShapePreview("✂️ SPLITTER", { color: '#4caf50' });
  } else {
    renderNextShapePreview(isNextGold ? "✨ SHINY GOLD" : nextDropType, SHAPE_HIERARCHY[nextDropType]);
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

function dropCurrentShape() {
  if (!gameActive || paused || !isReadyToDrop) return;
  isReadyToDrop = false;

  comboManager.triggerCombo(false);

  if (!activePowerUp) {
    powerUpDropCounter++;
    if (powerUpDropCounter >= 5) {
      activateNextPowerUp();
    }
  }

  const powerUpUsed = useActivePowerUp();

  if (!currentDropType || !SHAPE_HIERARCHY[currentDropType]) {
    currentDropType = SHAPE_TYPES[0];
  }

  const config = SHAPE_HIERARCHY[currentDropType];
  const size = (isCurrentDitto || isCurrentBomb || isCurrentMagnetic || isCurrentSplitter) ? 34 : config.size;

  const minX = size;
  const maxX = canvasWidth - size;
  const dropX = Math.max(minX, Math.min(maxX, mouseX));
  const dropY = 90;

  const dropped = addShape(currentDropType, dropX, dropY, 0, 1.5, gameTime, isCurrentSplitter);
  if (dropped) {
    if (isCurrentGold) {
      dropped.isGold = true;
    }
    if (isCurrentDitto) {
      dropped.isDitto = true;
      dropped.radius = 34;
      dropped.vertices = [[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7]];
    }
    if (isCurrentBomb) {
      dropped.isBomb = true;
      dropped.radius = 34;
      dropped.bombSpawnTime = gameTime;
      dropped.bombTimerLeft = 4.0;
      dropped.vertices = [[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7]];
    }
    if (isCurrentMagnetic) {
      dropped.isMagnetic = true;
      dropped.magneticTargetType = currentMagneticTarget;
      dropped.radius = 34;
      dropped.vertices = [[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7]];
      dropped.vx = 0;
      dropped.vy = 1.5;
      dropped.angularVelocity = 0;
    }
    if (isCurrentSplitter) {
      dropped.isSplitter = true;
      dropped.radius = 34;
      dropped.vertices = [[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7]];
    }
  }

  playGoofySound('drop');

  if (!powerUpUsed) {
    generateNextShapes();
  } else {
    isCurrentGold = false;
    isCurrentDitto = false;
    isCurrentBomb = false;
    isCurrentMagnetic = false;
    isCurrentSplitter = false;
    currentMagneticTarget = '';
    generateNextShapes();
  }

  setTimeout(() => { isReadyToDrop = true; }, 300);
}

function update(dt) {
  if (!gameActive || paused) return;

  gameTime += dt;
  timerDisplay.innerText = gameTime.toFixed(1);

  updateDittoTransformations(shapes);
  checkForBombExplosions(gameTime);
  updateMagneticFields(gameTime);

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
    checkCollisions(playArea, gameTime);
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
      if (anim.isBombFlash) {
        mergingAnimations.splice(i, 1);
        continue;
      }

      comboManager.triggerCombo(true);

      let mult = currentComboMultiplier;
      if (anim.shape1Gold && anim.shape2Gold) {
        mult *= 25;
      }

      if (mult > 1) {
        const baseReward = SHAPE_TYPES.indexOf(anim.targetType) + 1;
        updateScoreDisplay(baseReward * (mult - 1));
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
    const size = (isCurrentDitto || isCurrentBomb || isCurrentMagnetic || isCurrentSplitter) ? 34 : config.size;
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

    if (isCurrentMagnetic) {
      drawMagneticRangePulse(ctx, targetX, 90, gameTime);
    }

    drawShapeElement(ctx, gameTime, config.vertices, targetX, targetY, size, config.color, 0, 0.55, 1.0, 1.0, null, false, isCurrentGold, isCurrentDitto, isCurrentBomb, isCurrentMagnetic, 4.0);
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
  dropCounter = 0;
  gameActive = true;
  paused = false;
  isReadyToDrop = true;
  currentDropType = '';
  nextDropType = '';
  isCurrentGold = false;
  isNextGold = false;
  isCurrentDitto = false;
  isNextDitto = false;
  isCurrentBomb = false;
  isNextBomb = false;
  isCurrentMagnetic = false;
  isNextMagnetic = false;
  isCurrentSplitter = false;
  isNextSplitter = false;
  currentMagneticTarget = '';
  nextMagneticTarget = '';
  resetScoreDisplay();
  timerDisplay.innerText = '0.0';
  pauseBtn.innerText = "⏸️";
  gameOverlay.classList.add('hidden');

  powerUpQueue = [];
  activePowerUp = null;
  powerUpDropCounter = 0;

  for (let i = 0; i < 3; i++) {
    addPowerUpToQueue();
  }

  updatePowerUpQueueUI();

  generateNextShapes();
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

  window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX));
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX);
  }, { passive: false });

  const dropHandler = (e) => {
    if (e.target.closest('button')) return;
    if (!gameActive || paused) return;
    handleFirstInteraction();
    dropCurrentShape();
  };

  wrapper.addEventListener('click', dropHandler);
  wrapper.addEventListener('touchstart', (e) => {
    if (e.target.closest('button')) return;
    if (!gameActive || paused) return;
    e.preventDefault();
    handleFirstInteraction();
    dropCurrentShape();
  });

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