// bombPower.js
import { shapes, mergingAnimations, wakeUpShape } from '../physics.js';
import { updateScoreDisplay } from '../ui.js';
import { playGoofySound } from '../audio.js';

export function checkForBombExplosions(gameTime) {
    let bombExploded = false;

    for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (s.isBomb && !s.isExploding) {
            if (!s.bombSpawnTime) {
                s.bombSpawnTime = gameTime;
            }

            const elapsed = gameTime - s.bombSpawnTime;
            s.bombTimerLeft = Math.max(0, 4.0 - elapsed);

            let immediateTouchTrigger = false;
            for (let other of shapes) {
                if (other.id !== s.id) {
                    const dx = other.x - s.x;
                    const dy = other.y - s.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < s.radius + other.radius + 2) {
                        immediateTouchTrigger = true;
                        break;
                    }
                }
            }

            if (s.bombTimerLeft <= 0 || immediateTouchTrigger) {
                triggerExplosionChain(s, gameTime, new Set());
                bombExploded = true;
            }
        }
    }

    if (bombExploded) {
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (shapes[i].isExploding) {
                shapes.splice(i, 1);
            }
        }
    }
}

function triggerExplosionChain(bombShape, gameTime, processed) {
    if (processed.has(bombShape.id)) return;
    processed.add(bombShape.id);

    bombShape.isExploding = true;
    playGoofySound('gameover');

    const explosionRadius = 120;
    let pointsEarned = 10;

    for (let s of shapes) {
        if (!s.isExploding && s.id !== bombShape.id) {
            const dx = s.x - bombShape.x;
            const dy = s.y - bombShape.y;
            const dist = Math.hypot(dx, dy);

            if (dist < explosionRadius) {
                if (s.isBomb && !processed.has(s.id)) {
                    triggerExplosionChain(s, gameTime, processed);
                } else {
                    s.isExploding = true;
                    pointsEarned += 5;

                    mergingAnimations.push({
                        progress: 0,
                        duration: 0.25,
                        x1: s.x,
                        y1: s.y,
                        radius1: s.radius,
                        color1: s.color,
                        vertices1: s.vertices,
                        angle1: s.angle,
                        shape1Gold: s.isGold,
                        x2: bombShape.x,
                        y2: bombShape.y,
                        radius2: 0,
                        color2: '#000000',
                        vertices2: [],
                        angle2: 0,
                        shape2Gold: false,
                        targetX: s.x,
                        targetY: s.y,
                        targetRadius: s.radius * 1.4,
                        targetColor: '#ffeb3b',
                        targetVertices: s.vertices,
                        isBombFlash: true
                    });
                }
            } else {
                const force = (explosionRadius - dist) / explosionRadius;
                if (force > 0) {
                    wakeUpShape(s);
                    const angle = Math.atan2(dy, dx);
                    s.vx += Math.cos(angle) * force * 15;
                    s.vy += Math.sin(angle) * force * 15;

                    const speed = Math.hypot(s.vx, s.vy);
                    if (speed > 14) {
                        s.vx = (s.vx / speed) * 14;
                        s.vy = (s.vy / speed) * 14;
                    }
                }
            }
        }
    }

    updateScoreDisplay(pointsEarned);
}

export function drawBombEffect(ctx, radius, gameTime) {
    let pulse = 1 + Math.sin(gameTime * 12) * 0.05;
    ctx.scale(pulse, pulse);

    let gradient = ctx.createRadialGradient(0, -radius * 0.1, radius * 0.1, 0, 0, radius);
    gradient.addColorStop(0, '#424242');
    gradient.addColorStop(0.7, '#212121');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    return gradient;
}

export function drawBombDetails(ctx, radius, gameTime, timerLeft) {
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = Math.max(3, radius * 0.08);
    ctx.stroke();

    ctx.fillStyle = '#7d1b1b';
    ctx.fillRect(-radius * 0.15, -radius - (radius * 0.25), radius * 0.3, radius * 0.3);
    ctx.strokeStyle = '#111111';
    ctx.strokeRect(-radius * 0.15, -radius - (radius * 0.25), radius * 0.3, radius * 0.3);

    ctx.strokeStyle = '#d7ccc8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -radius - (radius * 0.2));
    ctx.quadraticCurveTo(radius * 0.2, -radius - (radius * 0.4), radius * 0.3, -radius - (radius * 0.5));
    ctx.stroke();

    let sparkPulse = 1 + Math.sin(gameTime * 30) * 0.3;
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(radius * 0.3, -radius - (radius * 0.5), 6 * sparkPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff5722';
    ctx.beginPath();
    ctx.arc(radius * 0.3, -radius - (radius * 0.5), 3 * sparkPulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.scale(1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(radius * 0.6)}px Quicksand`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayTime = typeof timerLeft === 'number' ? timerLeft.toFixed(1) : "4.0";
    ctx.fillText(displayTime, 0, 0);
    ctx.restore();
}