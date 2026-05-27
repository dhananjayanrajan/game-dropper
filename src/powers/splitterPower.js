// splitterPower.js
import { SHAPE_HIERARCHY, SHAPE_TYPES } from '../config.js';
import { playGoofySound } from '../audio.js';

export function handleSplitterActivation(shape, shapes) {
    if (!shape.isSplitter) return false;

    const currentIndex = SHAPE_TYPES.indexOf(shape.type);
    if (currentIndex <= 0) return false;

    const previousType = SHAPE_TYPES[currentIndex - 1];
    const config = SHAPE_HIERARCHY[previousType];

    playGoofySound('merge');

    const splitOne = {
        type: previousType,
        color: config.color,
        size: config.size,
        vertices: config.vertices,
        x: shape.x - 20,
        y: shape.y,
        vx: -2,
        vy: -2
    };

    const splitTwo = {
        type: previousType,
        color: config.color,
        size: config.size,
        vertices: config.vertices,
        x: shape.x + 20,
        y: shape.y,
        vx: 2,
        vy: -2
    };

    return [splitOne, splitTwo];
}

export function drawSplitterEffect(ctx, radius, gameTime) {
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
}