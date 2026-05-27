import { SHAPE_HIERARCHY, SHAPE_TYPES, FACES, PHYSICS_CONSTANTS } from './config.js';
import { playGoofySound } from './audio.js';

export let shapes = [];
export let mergingAnimations = [];
let nextId = 1;

export function clearPhysicsState() {
    shapes = [];
    mergingAnimations = [];
    nextId = 1;
}

export function addShape(type, x, y, vx = 0, vy = 0, gameTime) {
    const config = SHAPE_HIERARCHY[type];
    const newShape = {
        id: nextId++,
        type,
        color: config.color,
        radius: config.size,
        vertices: config.vertices,
        x, y,
        vx, vy,
        angle: 0,
        angularVelocity: 0,
        inertia: 0.5 * config.size * config.size,
        spawnTime: gameTime,
        targetSquishX: 1, targetSquishY: 1,
        currentSquishX: 1, currentSquishY: 1,
        face: FACES[Math.floor(Math.random() * FACES.length)],
        isSleeping: false,
        sleepTimer: 0,
        soundCooldown: 0,
        isGold: false,
        isDitto: false,
        isBomb: false,
        isMagnetic: false,
        isSplitter: false,
        isExploding: false,
        bombTimerLeft: null,
        magneticStartTime: null,
        magneticTargetType: null
    };
    shapes.push(newShape);
    return newShape;
}

export function wakeUpShape(shape) {
    if (shape.isSleeping) {
        shape.isSleeping = false;
        shape.sleepTimer = 0;
    }
}

function triggerMergeAnimation(shapeA, shapeB, nextType) {
    const midX = (shapeA.x + shapeB.x) / 2, midY = (shapeA.y + shapeB.y) / 2;
    const targetConfig = SHAPE_HIERARCHY[nextType];
    mergingAnimations.push({
        x1: shapeA.x, y1: shapeA.y, color1: shapeA.color, radius1: shapeA.radius, vertices1: shapeA.vertices, angle1: shapeA.angle,
        shape1Gold: shapeA.isGold,
        x2: shapeB.x, y2: shapeB.y, color2: shapeB.color, radius2: shapeB.radius, vertices2: shapeB.vertices, angle2: shapeB.angle,
        shape2Gold: shapeB.isGold,
        targetX: midX, targetY: midY, targetType: nextType, targetColor: targetConfig.color, targetRadius: targetConfig.size, targetVertices: targetConfig.vertices,
        progress: 0, duration: 0.12, isBombFlash: false
    });
    playGoofySound('merge');
}

function mergeShapes(shapeA, shapeB) {
    const nextType = SHAPE_HIERARCHY[shapeA.type].next;
    if (!nextType) return;
    triggerMergeAnimation(shapeA, shapeB, nextType);
    shapes = shapes.filter(s => s.id !== shapeA.id && s.id !== shapeB.id);
    for (let s of shapes) {
        if (Math.hypot(s.x - (shapeA.x + shapeB.x) / 2, s.y - (shapeA.y + shapeB.y) / 2) < s.radius + SHAPE_HIERARCHY[nextType].size + 60) {
            wakeUpShape(s);
        }
    }
}

export function checkCollisions(playArea, gameTime) {
    const { BOUNCE, ROLLING_GRIP, SOUND_VELOCITY_GATE, GLOBAL_SOUND_COOLDOWN, POSITION_CORRECTION_PERCENT, MAX_ANGULAR_SPEED, SLEEP_VELOCITY_THRESHOLD, SLEEP_ANGULAR_THRESHOLD, SLEEP_TIME_REQUIRED } = PHYSICS_CONSTANTS;

    for (let s of shapes) {
        if (Math.abs(s.angularVelocity) > MAX_ANGULAR_SPEED) s.angularVelocity = Math.sign(s.angularVelocity) * MAX_ANGULAR_SPEED;
        if (s.isSleeping || s.isExploding) continue;

        let boundaryHit = false, hitMagnitude = 0;
        if (s.x - s.radius < playArea.x) {
            s.x = playArea.x + s.radius;
            hitMagnitude = Math.abs(s.vx);
            s.vx = -s.vx * BOUNCE;
            let slide = s.vy + s.angularVelocity * s.radius;
            s.vy -= slide * ROLLING_GRIP;
            s.angularVelocity -= (slide * ROLLING_GRIP) / s.radius;
            boundaryHit = true;
        }
        if (s.x + s.radius > playArea.x + playArea.width) {
            s.x = playArea.x + playArea.width - s.radius;
            hitMagnitude = Math.abs(s.vx);
            s.vx = -s.vx * BOUNCE;
            let slide = s.vy - s.angularVelocity * s.radius;
            s.vy -= slide * ROLLING_GRIP;
            s.angularVelocity += (slide * ROLLING_GRIP) / s.radius;
            boundaryHit = true;
        }
        if (s.y + s.radius > playArea.y + playArea.height) {
            s.y = playArea.y + playArea.height - s.radius;
            hitMagnitude = Math.abs(s.vy);
            s.vy = -s.vy * BOUNCE;
            let slide = s.vx - s.angularVelocity * s.radius;
            s.vx -= slide * ROLLING_GRIP;
            s.angularVelocity += (slide * ROLLING_GRIP) / s.radius;
            boundaryHit = true;
        }
        if (boundaryHit && hitMagnitude > SOUND_VELOCITY_GATE && s.soundCooldown <= 0) {
            playGoofySound('bounce', Math.min(1.5, hitMagnitude / 3));
            s.soundCooldown = GLOBAL_SOUND_COOLDOWN;
        }
    }

    for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
            let a = shapes[i], b = shapes[j];
            if (a.isExploding || b.isExploding) continue;
            if (a.isSleeping && b.isSleeping) continue;

            const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), minDist = a.radius + b.radius;
            if (dist < minDist) {
                if (a.type === b.type && !a.isBomb && !b.isBomb && !a.isMagnetic && !b.isMagnetic && !a.isSplitter && !b.isSplitter && !a.isDitto && !b.isDitto) {
                    mergeShapes(a, b);
                    return;
                }

                const nx = dx / (dist || 1), ny = dy / (dist || 1);
                const relVx = b.vx - a.vx, relVy = b.vy - a.vy;
                const velAlongNormal = relVx * nx + relVy * ny;
                if (velAlongNormal > 0) continue;

                const overlap = minDist - dist;
                const corrX = nx * overlap * POSITION_CORRECTION_PERCENT;
                const corrY = ny * overlap * POSITION_CORRECTION_PERCENT;
                if (!a.isSleeping) { a.x -= corrX * 0.5; a.y -= corrY * 0.5; }
                if (!b.isSleeping) { b.x += corrX * 0.5; b.y += corrY * 0.5; }

                const jNormal = -(1 + BOUNCE) * velAlongNormal / 2;
                if (!a.isSleeping) { a.vx -= jNormal * nx; a.vy -= jNormal * ny; }
                if (!b.isSleeping) { b.vx += jNormal * nx; b.vy += jNormal * ny; }

                wakeUpShape(a); wakeUpShape(b);
            }
        }
    }

    for (let s of shapes) {
        if (s.soundCooldown > 0) s.soundCooldown--;
        const linearEnergy = s.vx * s.vx + s.vy * s.vy, angularEnergy = s.angularVelocity * s.angularVelocity;
        if (linearEnergy < SLEEP_VELOCITY_THRESHOLD && angularEnergy < SLEEP_ANGULAR_THRESHOLD) {
            s.sleepTimer++;
            if (s.sleepTimer >= SLEEP_TIME_REQUIRED) {
                s.isSleeping = true;
                s.vx = 0; s.vy = 0; s.angularVelocity = 0;
            }
        } else {
            s.sleepTimer = 0;
            s.isSleeping = false;
        }
    }

    shapes = shapes.filter(s => !s.isExploding);
}