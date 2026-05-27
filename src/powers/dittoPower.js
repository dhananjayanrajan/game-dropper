// src/powers/dittoPower.js
import { SHAPE_HIERARCHY } from '../config.js';
import { playGoofySound } from '../audio.js';

export function updateDittoTransformations(shapesArray, gameTime) {
    for (let ditto of shapesArray) {
        if (!ditto.isDitto) continue;
        if (!ditto.isSleeping) continue;
        for (let other of shapesArray) {
            if (other.id === ditto.id || other.isDitto || other.isGold || other.isBomb || other.isMagnetic || other.isSplitter) continue;
            const dx = other.x - ditto.x, dy = other.y - ditto.y, dist = Math.hypot(dx, dy);
            if (dist < ditto.radius + other.radius + 5) {
                const config = SHAPE_HIERARCHY[other.type];
                ditto.isDitto = false;
                ditto.type = other.type;
                ditto.color = config.color;
                ditto.radius = config.size;
                ditto.vertices = config.vertices;
                ditto.isGold = other.isGold;
                playGoofySound('merge');
                break;
            }
        }
    }
}

export function drawDittoEffect(ctx, radius, gameTime) {
    let wobble = 1 + Math.sin(gameTime * 5) * 0.05;
    ctx.scale(wobble, wobble);
    let grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    grad.addColorStop(0, '#f3e5f5');
    grad.addColorStop(1, '#ba68c8');
    ctx.fillStyle = grad;
}

export function drawDittoDetails(ctx, radius) {
    ctx.strokeStyle = '#8e24aa';
    ctx.lineWidth = Math.max(4, radius * 0.08);
    ctx.stroke();
}

export function drawDittoFace(ctx, radius) {
    ctx.fillStyle = '#4a148c';
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.15, radius * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.3, -radius * 0.15, radius * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, radius * 0.1, radius * 0.12, 0, Math.PI, false);
    ctx.strokeStyle = '#4a148c';
    ctx.stroke();
}