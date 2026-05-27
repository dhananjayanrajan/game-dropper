// src/powers/bombPower.js
import { shapes, mergingAnimations, wakeUpShape } from '../physics.js';
import { playGoofySound } from '../audio.js';

export function checkForBombExplosions(gameTime) {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const bomb = shapes[i];
        if (!bomb.isBomb || bomb.isExploding) continue;
        if (!bomb.isSleeping) {
            bomb.bombTimerLeft = null;
            continue;
        }
        if (!bomb.bombSpawnTime) bomb.bombSpawnTime = gameTime;
        bomb.bombTimerLeft = Math.max(0, 4.0 - (gameTime - bomb.bombSpawnTime));
        if (bomb.bombTimerLeft <= 0) {
            bomb.isExploding = true;
            const explosionRadius = 140;
            for (let other of shapes) {
                if (other.id === bomb.id) continue;
                const dist = Math.hypot(other.x - bomb.x, other.y - bomb.y);
                if (dist < explosionRadius) {
                    other.isExploding = true;
                    mergingAnimations.push({
                        x1: other.x, y1: other.y, color1: other.color, radius1: other.radius, vertices1: other.vertices, angle1: other.angle,
                        shape1Gold: other.isGold,
                        x2: bomb.x, y2: bomb.y, color2: '#000', radius2: 0, vertices2: [], angle2: 0,
                        shape2Gold: false,
                        targetX: other.x, targetY: other.y, targetType: other.type, targetColor: '#ffeb3b', targetRadius: other.radius * 1.4, targetVertices: other.vertices,
                        progress: 0, duration: 0.25, isBombFlash: true
                    });
                }
            }
            playGoofySound('bomb');
        }
    }
}

export function drawBombEffect(ctx, radius, gameTime) {
    let pulse = 1 + Math.sin(gameTime * 12) * 0.05;
    ctx.scale(pulse, pulse);
    let grad = ctx.createRadialGradient(0, -radius * 0.1, radius * 0.1, 0, 0, radius);
    grad.addColorStop(0, '#424242');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
}

export function drawBombDetails(ctx, radius, gameTime, timerLeft) {
    ctx.strokeStyle = '#111';
    ctx.lineWidth = Math.max(3, radius * 0.08);
    ctx.stroke();

    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.arc(0, -radius * 0.15, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-radius * 0.15, -radius * 0.2, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.15, -radius * 0.2, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -radius * 0.05, radius * 0.12, 0, Math.PI, false);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(radius * 0.45)}px Quicksand`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timerLeft?.toFixed(1) || '4.0', 0, radius * 0.65);
}

export function drawBombRange(ctx, radius, gameTime, timerLeft) {
    const cycle = (gameTime * 3) % 1;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 87, 34, ${0.6 * (1 - cycle)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 140 * cycle, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}