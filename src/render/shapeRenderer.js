import { drawGoldEffect, drawGoldDetails } from '../powers/goldPower.js';
import { drawBombEffect, drawBombDetails, drawBombRange } from '../powers/bombPower.js';
import { drawDittoEffect, drawDittoDetails, drawDittoFace } from '../powers/dittoPower.js';
import { drawMagneticEffect, drawMagneticDetails, drawMagneticRangePulse } from '../powers/magneticPower.js';
import { drawSplitterEffect } from '../powers/splitterPower.js';

function drawFace(ctx, radius, face, alpha, isSleeping) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#2d3748';
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = Math.max(2, radius * 0.06);
    ctx.lineCap = 'round';
    const eyeOffset = radius * 0.3, eyeY = -radius * 0.15, eyeSize = Math.max(2.5, radius * 0.07);
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
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-eyeOffset - 1, eyeY - 1, eyeSize * 0.4, 0, Math.PI * 2); ctx.arc(eyeOffset - 1, eyeY - 1, eyeSize * 0.4, 0, Math.PI * 2); ctx.fill();
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
            ctx.fillStyle = '#ff8a80'; ctx.beginPath(); ctx.arc(2, mouthY + 3, radius * 0.1, 0, Math.PI * 2); ctx.fill();
        } else if (face.mouth === 'shy') {
            ctx.beginPath(); ctx.moveTo(-radius * 0.15, mouthY); ctx.lineTo(radius * 0.15, mouthY); ctx.stroke();
        }
    }
    ctx.restore();
}

function drawShapePath(ctx, vertices, radius) {
    ctx.beginPath();
    if (!vertices || vertices.length < 3) {
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
    } else {
        const pts = vertices.map(v => [v[0] * radius, v[1] * radius]);
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i][0], pts[i][1]);
        }
        ctx.closePath();
    }
}

export function drawShapeElement(ctx, gameTime, vertices, x, y, radius, color, angle, alpha = 1, squishX = 1, squishY = 1, face = null, isSleeping = false, isGold = false, isDitto = false, isBomb = false, isMagnetic = false, isSplitter = false, bombTimerLeft = null) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(squishX, squishY);

    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = radius * 0.3;
    ctx.shadowOffsetY = radius * 0.1;

    if (isDitto) {
        drawDittoEffect(ctx, radius, gameTime);
    } else if (isBomb) {
        drawBombEffect(ctx, radius, gameTime);
    } else if (isMagnetic) {
        drawMagneticEffect(ctx, radius, gameTime);
    } else if (isSplitter) {
        ctx.fillStyle = '#ef5350';
    } else if (isGold) {
        drawGoldEffect(ctx, radius, gameTime);
    } else {
        ctx.fillStyle = color;
    }

    drawShapePath(ctx, vertices, radius);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = Math.max(3, radius * 0.12);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    if (isGold) {
        ctx.lineWidth = Math.max(4, radius * 0.09);
        ctx.strokeStyle = '#e65100';
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 2 + gameTime * 0.8);
            ctx.beginPath();
            ctx.moveTo(0, -radius * 0.6);
            ctx.lineTo(radius * 0.08, -radius * 0.7);
            ctx.lineTo(0, -radius * 0.8);
            ctx.lineTo(-radius * 0.08, -radius * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    if (isDitto) {
        drawDittoDetails(ctx, radius);
        drawDittoFace(ctx, radius);
    } else if (isBomb) {
        drawBombDetails(ctx, radius, gameTime, bombTimerLeft);
    } else if (isMagnetic) {
        drawMagneticDetails(ctx, radius, gameTime);
    } else if (isSplitter) {
        drawSplitterEffect(ctx, radius, gameTime);
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(-radius * 0.2, -radius * 0.2, radius * 0.12, radius * 0.06, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        if (face) drawFace(ctx, radius, face, alpha, isSleeping);
    }

    ctx.restore();
}

export function drawBombRangeEffect(ctx, x, y, radius, gameTime, timerLeft) {
    ctx.save();
    ctx.translate(x, y);
    const cycle = (gameTime * 3) % 1;
    ctx.strokeStyle = `rgba(255, 87, 34, ${0.6 * (1 - cycle)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 140 * cycle, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}