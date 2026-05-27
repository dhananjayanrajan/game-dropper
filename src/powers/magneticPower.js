// magneticPower.js
import { shapes, mergingAnimations, wakeUpShape } from '../physics.js';
import { playGoofySound } from '../audio.js';

export function updateMagneticFields(gameTime) {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (s.isMagnetic) {
            if (!s.magneticStartTime) {
                s.magneticStartTime = gameTime;
            }

            const elapsed = gameTime - s.magneticStartTime;
            const duration = 5.0;

            if (elapsed >= duration) {
                s.isExploding = true;
                mergingAnimations.push({
                    progress: 0,
                    duration: 0.3,
                    x1: s.x,
                    y1: s.y,
                    radius1: s.radius,
                    color1: s.color,
                    vertices1: s.vertices,
                    angle1: s.angle,
                    shape1Gold: false,
                    x2: s.x,
                    y2: s.y,
                    radius2: 0,
                    color2: '#000000',
                    vertices2: [],
                    angle2: 0,
                    shape2Gold: false,
                    targetX: s.x,
                    targetY: s.y,
                    targetRadius: s.radius * 1.5,
                    targetColor: 'rgba(0, 229, 255, 0.4)',
                    targetVertices: s.vertices,
                    isBombFlash: true
                });
                shapes.splice(i, 1);
                playGoofySound('drop');
                continue;
            }

            const pullRadius = 240;

            for (let other of shapes) {
                if (other.id === s.id || other.isExploding || other.isBomb || other.isGold) continue;

                const dx = other.x - s.x;
                const dy = other.y - s.y;
                const dist = Math.hypot(dx, dy);

                if (dist < pullRadius && dist > 1) {
                    wakeUpShape(other);
                    const angle = Math.atan2(dy, dx);
                    const intensity = (pullRadius - dist) / pullRadius;

                    let force = intensity * other.radius * 0.4;
                    if (other.type === s.magneticTargetType && !other.isDitto && !other.isMagnetic) {
                        force = intensity * other.radius * 1.2;
                    }

                    other.vx -= Math.cos(angle) * force;
                    other.vy -= Math.sin(angle) * force;

                    const speed = Math.hypot(other.vx, other.vy);
                    if (speed > 14) {
                        other.vx = (other.vx / speed) * 14;
                        other.vy = (other.vy / speed) * 14;
                    }
                }
            }
        }
    }
}

export function drawMagneticEffect(ctx, radius, gameTime, elapsed) {
    let pulse = 1 + Math.sin(gameTime * 8) * 0.03;
    ctx.scale(pulse, pulse);

    let gradient = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    gradient.addColorStop(0, '#e0f7fa');
    gradient.addColorStop(0.5, '#00e5ff');
    gradient.addColorStop(1, '#00b0ff');
    ctx.fillStyle = gradient;
    return gradient;
}

export function drawMagneticDetails(ctx, radius, gameTime) {
    ctx.strokeStyle = '#0091ea';
    ctx.lineWidth = Math.max(3, radius * 0.08);
    ctx.stroke();

    ctx.save();
    ctx.rotate(gameTime * 2);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const thickness = radius * 0.25;
    const length = radius * 0.6;

    ctx.save();
    ctx.translate(0, -radius * 0.1);

    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(0, 0, length, Math.PI, 0, false);
    ctx.lineTo(length - thickness, 0);
    ctx.arc(0, 0, length - thickness, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2979ff';
    ctx.beginPath();
    ctx.arc(0, 0, length, 0, Math.PI, false);
    ctx.lineTo(-length + thickness, 0);
    ctx.arc(0, 0, length - thickness, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-length, -2, thickness, 4);
    ctx.fillRect(length - thickness, -2, thickness, 4);

    ctx.restore();
}

export function drawMagneticRangePulse(ctx, x, y, gameTime) {
    ctx.save();
    ctx.translate(x, y);
    const maxRange = 240;
    const pulseSpeed = 1.5;
    const cycle = (gameTime * pulseSpeed) % 1.0;

    ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 * (1 - cycle)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, maxRange * cycle, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}