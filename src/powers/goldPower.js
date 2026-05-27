// src/powers/goldPower.js
import { SHAPE_TYPES, SHAPE_HIERARCHY } from '../config.js';
import { updateScoreDisplay } from '../ui.js';
import { playGoofySound } from '../audio.js';

export function handleGoldCollision(shapeA, shapeB, comboMultiplier) {
    if (shapeA.isGold && shapeB.isGold && shapeA.type === shapeB.type) {
        playGoofySound('merge');
        const baseReward = SHAPE_TYPES.indexOf(shapeA.type) + 1;
        const points = baseReward * 25 * comboMultiplier;
        updateScoreDisplay(points);
        return {
            shouldMerge: true,
            scoreAdded: points
        };
    }
    return { shouldMerge: false };
}

export function drawGoldEffect(ctx, radius, gameTime) {
    let pulse = 1 + Math.sin(gameTime * 6) * 0.04;
    ctx.scale(pulse, pulse);

    let gradient = ctx.createRadialGradient(0, -radius * 0.2, radius * 0.05, 0, 0, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, '#fff176');
    gradient.addColorStop(0.5, '#ffd54f');
    gradient.addColorStop(0.8, '#ffb300');
    gradient.addColorStop(1, '#ff6f00');
    ctx.fillStyle = gradient;
    return gradient;
}

export function drawGoldDetails(ctx, radius, gameTime, vertices) {
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = Math.max(4, radius * 0.09);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, radius * 0.03);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    let count = 4;
    for (let i = 0; i < count; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI / 2) + (gameTime * 0.8));
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.6);
        ctx.lineTo(radius * 0.08, -radius * 0.7);
        ctx.lineTo(0, -radius * 0.8);
        ctx.lineTo(-radius * 0.08, -radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-radius * 0.25, -radius * 0.25, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();
}