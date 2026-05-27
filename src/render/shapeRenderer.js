// shapeRenderer.js
import { drawGoldEffect, drawGoldDetails } from '../powers/goldPower.js';
import { drawDittoEffect, drawDittoDetails, drawDittoFace } from '../powers/dittoPower.js';
import { drawBombEffect, drawBombDetails } from '../powers/bombPower.js';
import { drawMagneticEffect, drawMagneticDetails } from '../powers/magneticPower.js';
export function drawFace(ctx, radius, face, alpha, isSleeping) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#2d3748';
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = Math.max(2, radius * 0.06);
    ctx.lineCap = 'round';
    const eyeOffset = radius * 0.3;
    const eyeY = -radius * 0.15;
    const eyeSize = Math.max(2.5, radius * 0.07);
    if (isSleeping) {
        ctx.beginPath(); ctx.moveTo(-eyeOffset - eyeSize, eyeY); ctx.lineTo(-eyeOffset + eyeSize, eyeY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(eyeOffset - eyeSize, eyeY); ctx.lineTo(eyeOffset + eyeSize, eyeY); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, radius * 0.25, radius * 0.1, 0, Math.PI * 2); ctx.stroke();
    } else {
        if (face.eyes === 'happy') {
            ctx.beginPath(); ctx.arc(-eyeOffset, eyeY, eyeSize, Math.PI, 0, false); ctx.stroke();
            ctx.beginPath(); ctx.arc(eyeOffset, eyeY, eyeSize, Math.PI, 0, false); ctx.stroke();
        } else if (face.eyes === 'cute') {
            ctx.beginPath(); ctx.arc(-eyeOffset, eyeY, eyeSize * 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(eyeOffset, eyeY, eyeSize * 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(-eyeOffset - 1, eyeY - 1, eyeSize * 0.4, 0, Math.PI * 2);
            ctx.arc(eyeOffset - 1, eyeY - 1, eyeSize * 0.4, 0, Math.PI * 2); ctx.fill();
        } else if (face.eyes === 'blink') {
            ctx.beginPath(); ctx.moveTo(-eyeOffset - eyeSize, eyeY); ctx.lineTo(-eyeOffset + eyeSize, eyeY); ctx.stroke();
            ctx.beginPath(); ctx.arc(eyeOffset, eyeY, eyeSize, Math.PI, 0, false); ctx.stroke();
        } else {
            ctx.beginPath(); ctx.arc(-eyeOffset, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(eyeOffset, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
        }
        const mouthY = radius * 0.2;
        if (face.mouth === 'smile') {
            ctx.beginPath(); ctx.arc(0, mouthY, radius * 0.2, 0, Math.PI, false); ctx.stroke();
        } else if (face.mouth === 'smile_wide') {
            ctx.beginPath(); ctx.arc(0, mouthY, radius * 0.25, 0, Math.PI, false); ctx.closePath(); ctx.fill();
        } else if (face.mouth === 'open') {
            ctx.beginPath(); ctx.arc(0, mouthY + 2, radius * 0.15, 0, Math.PI * 2); ctx.fill();
        } else if (face.mouth === 'tongue') {
            ctx.beginPath(); ctx.arc(0, mouthY, radius * 0.2, 0, Math.PI, false); ctx.stroke();
            ctx.fillStyle = '#ff8a80';
            ctx.beginPath(); ctx.arc(2, mouthY + 3, radius * 0.1, 0, Math.PI * 2); ctx.fill();
        } else if (face.mouth === 'shy') {
            ctx.beginPath(); ctx.moveTo(-radius * 0.15, mouthY); ctx.lineTo(radius * 0.15, mouthY); ctx.stroke();
        }
    }
    ctx.restore();
}
export function drawShapeElement(ctx, gameTime, vertices, x, y, radius, color, angle, alpha = 1.0, squishX = 1.0, squishY = 1.0, face = null, isSleeping = false, isGold = false, isDitto = false, isBomb = false, isMagnetic = false, bombTimerLeft = null) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(squishX, squishY);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.lineJoin = 'round';
    if (isGold) {
        drawGoldEffect(ctx, radius, gameTime);
    } else if (isDitto) {
        drawDittoEffect(ctx, radius, gameTime);
    } else if (isBomb) {
        drawBombEffect(ctx, radius, gameTime);
    } else if (isMagnetic) {
        drawMagneticEffect(ctx, radius, gameTime);
    } else {
        ctx.fillStyle = color;
    }
    ctx.beginPath();
    if (vertices && vertices.length > 0) {
        ctx.moveTo(vertices[0][0] * radius, vertices[0][1] * radius);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i][0] * radius, vertices[i][1] * radius);
        }
    } else {
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    if (isGold) {
        drawGoldDetails(ctx, radius, gameTime, vertices);
    } else if (isDitto) {
        drawDittoDetails(ctx, radius);
    } else if (isBomb) {
        drawBombDetails(ctx, radius, gameTime, bombTimerLeft);
    } else if (isMagnetic) {
        drawMagneticDetails(ctx, radius, gameTime);
    } else {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = Math.max(3, radius * 0.06);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(-radius * 0.25, -radius * 0.25, radius * 0.12, radius * 0.06, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    }
    if (isDitto) {
        drawDittoFace(ctx, radius);
    } else if (!isBomb && !isMagnetic && face) {
        drawFace(ctx, radius, face, alpha, isSleeping);
    }
    ctx.restore();
}