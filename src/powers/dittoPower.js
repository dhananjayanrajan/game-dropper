// src/powers/dittoPower.js
import { SHAPE_HIERARCHY } from '../config.js';
import { playGoofySound } from '../audio.js';

export function updateDittoTransformations(shapes) {
    for (let s of shapes) {
        if (s.isDitto) {
            for (let other of shapes) {
                if (other.id !== s.id && !other.isDitto) {
                    const dx = other.x - s.x;
                    const dy = other.y - s.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < s.radius + other.radius + 2) {
                        const config = SHAPE_HIERARCHY[other.type];
                        s.isDitto = false;
                        s.type = other.type;
                        s.color = config.color;
                        s.radius = config.size;
                        s.vertices = config.vertices;
                        s.inertia = 0.5 * config.size * config.size;
                        s.isGold = other.isGold;
                        playGoofySound('merge');
                        break;
                    }
                }
            }
        }
    }
}

export function drawDittoEffect(ctx, radius, gameTime) {
    let wobbleX = 1 + Math.sin(gameTime * 5) * 0.05;
    let wobbleY = 1 + Math.cos(gameTime * 5) * 0.05;
    ctx.scale(wobbleX, wobbleY);

    let gradient = ctx.createLinearGradient(-radius, -radius, radius, radius);
    gradient.addColorStop(0, '#f3e5f5');
    gradient.addColorStop(0.4, '#e1bee7');
    gradient.addColorStop(0.8, '#ce93d8');
    gradient.addColorStop(1, '#ba68c8');
    ctx.fillStyle = gradient;
    return gradient;
}

export function drawDittoFace(ctx, radius) {
    const eyeOffset = radius * 0.3;
    const eyeY = -radius * 0.15;
    const eyeSize = Math.max(2.5, radius * 0.07);

    ctx.fillStyle = '#4a148c';
    ctx.beginPath();
    ctx.arc(-eyeOffset, eyeY, eyeSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeOffset, eyeY, eyeSize * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4a148c';
    ctx.lineWidth = Math.max(2.5, radius * 0.07);
    ctx.beginPath();
    ctx.arc(0, radius * 0.1, radius * 0.2, 0, Math.PI, false);
    ctx.stroke();
}

export function drawDittoDetails(ctx, radius) {
    ctx.strokeStyle = '#8e24aa';
    ctx.lineWidth = Math.max(4, radius * 0.08);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(-radius * 0.2, -radius * 0.2, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
}