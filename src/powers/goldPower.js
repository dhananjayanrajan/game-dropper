// src/powers/goldPower.js
export function drawGoldEffect(ctx, radius, gameTime) {
    let pulse = 1 + Math.sin(gameTime * 8) * 0.1;
    ctx.scale(pulse, pulse);
    let gradient = ctx.createRadialGradient(0, -radius * 0.2, radius * 0.1, 0, 0, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#fff176');
    gradient.addColorStop(0.7, '#ffb300');
    gradient.addColorStop(1, '#ff6f00');
    ctx.fillStyle = gradient;
}

export function drawGoldDetails(ctx, radius, gameTime, vertices) {
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = Math.max(4, radius * 0.09);
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