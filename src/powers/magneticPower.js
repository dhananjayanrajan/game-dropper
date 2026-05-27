import { shapes, mergingAnimations, wakeUpShape } from '../physics.js';
import { SHAPE_HIERARCHY } from '../config.js';
import { playGoofySound } from '../audio.js';
import { updateScoreDisplay } from '../ui.js';

export function updateMagneticFields(gameTime, comboMultiplier, comboManager) {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const magnet = shapes[i];
        if (!magnet.isMagnetic || magnet.isExploding) continue;
        if (!magnet.magneticStartTime) magnet.magneticStartTime = gameTime;
        const elapsed = gameTime - magnet.magneticStartTime;
        if (elapsed >= 6.0) {
            magnet.isExploding = true;
            continue;
        }
        const pullRadius = 200;
        for (let other of shapes) {
            if (other.id === magnet.id || other.isMagnetic || other.isBomb || other.isGold || other.isDitto || other.isSplitter || other.isExploding) continue;
            const dx = other.x - magnet.x, dy = other.y - magnet.y, dist = Math.hypot(dx, dy);
            if (dist < pullRadius && dist > 2) {
                wakeUpShape(other);
                const angle = Math.atan2(dy, dx);
                const intensity = (pullRadius - dist) / pullRadius;
                let force = intensity * 1.2;
                other.vx -= Math.cos(angle) * force;
                other.vy -= Math.sin(angle) * force;
                if (Math.abs(other.vx) < 0.5 && Math.abs(other.vy) < 0.5 && dist < other.radius + magnet.radius + 30) {
                    other.vx += (Math.random() - 0.5) * 0.8;
                    other.vy += (Math.random() - 0.5) * 0.8;
                }
            }
        }

        const mergeCheckRadius = magnet.radius + 30;
        let mergedThisFrame = false;
        for (let j = shapes.length - 1; j >= 0; j--) {
            const a = shapes[j];
            if (!a || a.id === magnet.id || a.isMagnetic || a.isBomb || a.isGold || a.isDitto || a.isSplitter || a.isExploding) continue;
            const distA = Math.hypot(a.x - magnet.x, a.y - magnet.y);
            if (distA > mergeCheckRadius) continue;
            for (let k = shapes.length - 1; k >= 0; k--) {
                const b = shapes[k];
                if (!b || b.id === magnet.id || b.id === a.id || b.isMagnetic || b.isBomb || b.isGold || b.isDitto || b.isSplitter || b.isExploding) continue;
                if (b.type !== a.type) continue;
                const distB = Math.hypot(b.x - magnet.x, b.y - magnet.y);
                if (distB > mergeCheckRadius) continue;

                const nextType = SHAPE_HIERARCHY[a.type].next;
                if (!nextType) continue;
                const targetConfig = SHAPE_HIERARCHY[nextType];
                mergingAnimations.push({
                    x1: a.x, y1: a.y, color1: a.color, radius1: a.radius, vertices1: a.vertices, angle1: a.angle,
                    shape1Gold: a.isGold,
                    x2: b.x, y2: b.y, color2: b.color, radius2: b.radius, vertices2: b.vertices, angle2: b.angle,
                    shape2Gold: b.isGold,
                    targetX: (a.x + b.x) / 2, targetY: (a.y + b.y) / 2, targetType: nextType, targetColor: targetConfig.color,
                    targetRadius: targetConfig.size, targetVertices: targetConfig.vertices,
                    progress: 0, duration: 0.12, isBombFlash: false
                });
                const points = targetConfig.mergeScore * 2 * comboMultiplier;
                updateScoreDisplay(points);
                playGoofySound('merge');
                a.isExploding = true;
                b.isExploding = true;
                mergedThisFrame = true;
                break;
            }
            if (mergedThisFrame) break;
        }
    }
}

export function drawMagneticEffect(ctx, radius, gameTime) {
    let pulse = 1 + Math.sin(gameTime * 8) * 0.05;
    ctx.scale(pulse, pulse);
    let grad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    grad.addColorStop(0, '#e0f7fa');
    grad.addColorStop(1, '#00b0ff');
    ctx.fillStyle = grad;
}

export function drawMagneticDetails(ctx, radius, gameTime) {
    ctx.strokeStyle = '#0091ea';
    ctx.lineWidth = Math.max(3, radius * 0.08);
    ctx.stroke();
    ctx.save();
    ctx.rotate(gameTime * 2);
    ctx.strokeStyle = 'rgba(0,229,255,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(-radius * 0.5, 0, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0000ff';
    ctx.beginPath();
    ctx.arc(radius * 0.5, 0, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
}

export function drawMagneticRangePulse(ctx, x, y, gameTime) {
    ctx.save();
    ctx.translate(x, y);
    const maxRange = 200;
    const cycle = (gameTime * 1.5) % 1;
    ctx.strokeStyle = `rgba(0,229,255,${0.4 * (1 - cycle)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, maxRange * cycle, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}