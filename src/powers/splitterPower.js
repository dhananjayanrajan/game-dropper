import { SHAPE_HIERARCHY, SHAPE_TYPES } from '../config.js';
import { playGoofySound } from '../audio.js';
import { shapes } from '../physics.js';

export function handleSplitterActivation(shapesArray, gameTime) {
    for (let i = shapesArray.length - 1; i >= 0; i--) {
        const splitter = shapesArray[i];
        if (!splitter.isSplitter) continue;
        for (let other of shapesArray) {
            if (other.id === splitter.id || other.isSplitter || other.isBomb || other.isGold || other.isMagnetic || other.isDitto) continue;
            const dx = other.x - splitter.x, dy = other.y - splitter.y, dist = Math.hypot(dx, dy);
            if (dist < splitter.radius + other.radius + 2) {
                const currentIndex = SHAPE_TYPES.indexOf(other.type);
                if (currentIndex <= 0) {
                    other.isExploding = true;
                    splitter.isExploding = true;
                    playGoofySound('merge');
                    return;
                }
                const prevType = SHAPE_TYPES[currentIndex - 1];
                const config = SHAPE_HIERARCHY[prevType];
                const angle = Math.atan2(dy, dx);
                const pushForce = 3;
                const block1 = {
                    type: prevType, color: config.color, radius: config.size, vertices: config.vertices,
                    x: other.x - Math.cos(angle) * other.radius * 0.8,
                    y: other.y - Math.sin(angle) * other.radius * 0.8,
                    vx: -Math.cos(angle) * pushForce,
                    vy: -Math.sin(angle) * pushForce,
                    angle: 0, angularVelocity: 0, inertia: 0.5 * config.size * config.size,
                    spawnTime: gameTime, face: other.face, isSleeping: false, sleepTimer: 0, soundCooldown: 0,
                    isGold: false, isDitto: false, isBomb: false, isMagnetic: false, isSplitter: false, isExploding: false
                };
                const block2 = {
                    type: prevType, color: config.color, radius: config.size, vertices: config.vertices,
                    x: other.x + Math.cos(angle) * other.radius * 0.8,
                    y: other.y + Math.sin(angle) * other.radius * 0.8,
                    vx: Math.cos(angle) * pushForce,
                    vy: Math.sin(angle) * pushForce,
                    angle: 0, angularVelocity: 0, inertia: 0.5 * config.size * config.size,
                    spawnTime: gameTime, face: other.face, isSleeping: false, sleepTimer: 0, soundCooldown: 0,
                    isGold: false, isDitto: false, isBomb: false, isMagnetic: false, isSplitter: false, isExploding: false
                };
                import('../physics.js').then(({ addShape }) => {
                    addShape(prevType, block1.x, block1.y, block1.vx, block1.vy, gameTime);
                    addShape(prevType, block2.x, block2.y, block2.vx, block2.vy, gameTime);
                });
                other.isExploding = true;
                splitter.isExploding = true;
                playGoofySound('merge');
                return;
            }
        }
    }
}

export function drawSplitterEffect(ctx, radius, gameTime) {
    const vibration = Math.sin(gameTime * 30) * 0.05;
    ctx.rotate(vibration);
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffcdd2';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.6);
    ctx.lineTo(radius * 0.15, -radius * 0.2);
    ctx.lineTo(-radius * 0.15, -radius * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(0, radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
}