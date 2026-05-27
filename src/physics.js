// physics.js
import { SHAPE_HIERARCHY, SHAPE_TYPES, FACES, PHYSICS_CONSTANTS } from './config.js';
import { playGoofySound } from './audio.js';
import { updateScoreDisplay } from './ui.js';
import { handleSplitterActivation } from './powers/splitterPower.js';

export let shapes = [];
export let mergingAnimations = [];
let nextId = 1;

export function clearPhysicsState() {
    shapes = [];
    mergingAnimations = [];
    nextId = 1;
}

export function addShape(type, x, y, vx = 0, vy = 0, gameTime, isSplitter = false) {
    const config = SHAPE_HIERARCHY[type];
    let momentOfInertia = 0.5 * config.size * config.size;

    const newShape = {
        id: nextId++,
        type: type,
        color: config.color,
        radius: config.size,
        vertices: config.vertices,
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        angle: 0,
        angularVelocity: 0,
        inertia: momentOfInertia,
        spawnTime: gameTime,
        targetSquishX: 1.0,
        targetSquishY: 1.0,
        currentSquishX: 1.0,
        currentSquishY: 1.0,
        face: FACES[Math.floor(Math.random() * FACES.length)],
        isSleeping: false,
        sleepTimer: 0,
        soundCooldown: 0,
        isGold: false,
        isDitto: false,
        isBomb: false,
        isMagnetic: false,
        isSplitter: isSplitter,
        isExploding: false,
        bombSpawnTime: null,
        bombTimerLeft: null,
        magneticStartTime: null,
        magneticTargetType: ''
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
    const midX = (shapeA.x + shapeB.x) / 2;
    const midY = (shapeA.y + shapeB.y) / 2;
    const targetConfig = SHAPE_HIERARCHY[nextType];

    mergingAnimations.push({
        x1: shapeA.x,
        y1: shapeA.y,
        color1: shapeA.color,
        radius1: shapeA.radius,
        vertices1: shapeA.vertices,
        angle1: shapeA.angle,
        face1: shapeA.face,
        shape1Gold: shapeA.isGold,
        x2: shapeB.x,
        y2: shapeB.y,
        color2: shapeB.color,
        radius2: shapeB.radius,
        vertices2: shapeB.vertices,
        angle2: shapeB.angle,
        face2: shapeB.face,
        shape2Gold: shapeB.isGold,
        targetX: midX,
        targetY: midY,
        targetType: nextType,
        targetColor: targetConfig.color,
        targetRadius: targetConfig.size,
        targetVertices: targetConfig.vertices,
        targetFace: FACES[Math.floor(Math.random() * FACES.length)],
        progress: 0,
        duration: 0.12,
        isBombFlash: false
    });
    playGoofySound('merge');
}

function mergeShapes(shapeA, shapeB) {
    const nextType = SHAPE_HIERARCHY[shapeA.type].next;
    triggerMergeAnimation(shapeA, shapeB, nextType);
    shapes = shapes.filter(s => s.id !== shapeA.id && s.id !== shapeB.id);

    for (let s of shapes) {
        const dx = s.x - ((shapeA.x + shapeB.x) / 2);
        const dy = s.y - ((shapeA.y + shapeB.y) / 2);
        if (Math.hypot(dx, dy) < s.radius + SHAPE_HIERARCHY[nextType].size + 60) {
            wakeUpShape(s);
        }
    }
}

export function checkCollisions(playArea, gameTime) {
    const {
        BOUNCE, ROLLING_GRIP, SOUND_VELOCITY_GATE, GLOBAL_SOUND_COOLDOWN,
        POSITION_CORRECTION_PERCENT, MAX_LINEAR_SPEED, MAX_ANGULAR_SPEED,
        SLEEP_VELOCITY_THRESHOLD, SLEEP_ANGULAR_THRESHOLD, SLEEP_TIME_REQUIRED
    } = PHYSICS_CONSTANTS;

    for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];

        if (Math.abs(s.angularVelocity) > MAX_ANGULAR_SPEED) {
            s.angularVelocity = Math.sign(s.angularVelocity) * MAX_ANGULAR_SPEED;
        }

        if (s.isSleeping || s.isExploding) continue;

        if (s.isMagnetic) {
            if (s.y + s.radius < playArea.y + playArea.height) {
                s.y += s.vy;
                if (s.y + s.radius > playArea.y + playArea.height) {
                    s.y = playArea.y + playArea.height - s.radius;
                    s.vy = 0;
                }
            }
            continue;
        }

        const r = s.radius;
        let boundaryHit = false;
        let hitMagnitude = 0;

        if (s.x - r < playArea.x) {
            s.x = playArea.x + r;
            hitMagnitude = Math.abs(s.vx);
            s.vx = -s.vx * BOUNCE;
            const slidingSpeed = s.vy + s.angularVelocity * r;
            s.vy -= slidingSpeed * ROLLING_GRIP;
            s.angularVelocity -= (slidingSpeed * ROLLING_GRIP) / r;
            boundaryHit = true;
        }
        if (s.x + r > playArea.x + playArea.width) {
            s.x = playArea.x + playArea.width - r;
            hitMagnitude = Math.abs(s.vx);
            s.vx = -s.vx * BOUNCE;
            const slidingSpeed = s.vy - s.angularVelocity * r;
            s.vy -= slidingSpeed * ROLLING_GRIP;
            s.angularVelocity += (slidingSpeed * ROLLING_GRIP) / r;
            boundaryHit = true;
        }
        if (s.y + r > playArea.y + playArea.height) {
            s.y = playArea.y + playArea.height - r;
            hitMagnitude = Math.abs(s.vy);
            s.vy = -s.vy * BOUNCE;
            const slidingSpeed = s.vx - s.angularVelocity * r;
            s.vx -= slidingSpeed * ROLLING_GRIP;
            s.angularVelocity += (slidingSpeed * ROLLING_GRIP) / r;
            boundaryHit = true;
        }

        if (boundaryHit && hitMagnitude > SOUND_VELOCITY_GATE && s.soundCooldown <= 0) {
            playGoofySound('bounce', Math.min(1.5, hitMagnitude / 3));
            s.soundCooldown = GLOBAL_SOUND_COOLDOWN;
        }
    }

    for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
            const a = shapes[i];
            const b = shapes[j];

            if (a.isExploding || b.isExploding) continue;
            if (a.isSleeping && b.isSleeping) continue;

            if (a.isMagnetic || b.isMagnetic) {
                const magnetic = a.isMagnetic ? a : b;
                const other = a.isMagnetic ? b : a;

                const dx = other.x - magnetic.x;
                const dy = other.y - magnetic.y;
                const dist = Math.hypot(dx, dy);
                const minDist = other.radius + magnetic.radius;

                if (dist < minDist) {
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);
                    const overlap = minDist - dist;
                    const correctionX = nx * overlap;
                    const correctionY = ny * overlap;

                    other.x += correctionX;
                    other.y += correctionY;

                    if (other.y + other.radius > magnetic.y - magnetic.radius) {
                        other.y = magnetic.y - magnetic.radius - other.radius;
                    }

                    const relVx = other.vx - magnetic.vx;
                    const relVy = other.vy - magnetic.vy;
                    const velAlongNormal = relVx * nx + relVy * ny;

                    if (velAlongNormal < 0) {
                        const jScalar = -(1 + BOUNCE) * velAlongNormal;
                        const impulseX = jScalar * nx;
                        const impulseY = jScalar * ny;
                        other.vx -= impulseX;
                        other.vy -= impulseY;
                    }

                    wakeUpShape(other);
                }
                continue;
            }

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const minDist = a.radius + b.radius;

            if (dist < minDist) {
                if (a.isSplitter || b.isSplitter) {
                    const splitter = a.isSplitter ? a : b;
                    const target = a.isSplitter ? b : a;

                    if (!target.isSplitter && !target.isExploding && !target.isBomb && !target.isGold) {
                        const results = handleSplitterActivation(splitter, shapes);
                        if (results) {
                            const splitterIdx = shapes.indexOf(splitter);
                            const targetIdx = shapes.indexOf(target);
                            if (splitterIdx > targetIdx) {
                                shapes.splice(splitterIdx, 1);
                                shapes.splice(targetIdx, 1);
                            } else {
                                shapes.splice(targetIdx, 1);
                                shapes.splice(splitterIdx, 1);
                            }
                            results.forEach(ns => addShape(ns.type, ns.x, ns.y, ns.vx, ns.vy, gameTime));
                            return;
                        }
                    }
                }

                if (a.isBomb || b.isBomb) {
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);
                    const relVx = b.vx - a.vx;
                    const relVy = b.vy - a.vy;
                    const velAlongNormal = relVx * nx + relVy * ny;

                    const overlap = minDist - dist;
                    const correctionX = nx * overlap * POSITION_CORRECTION_PERCENT;
                    const correctionY = ny * overlap * POSITION_CORRECTION_PERCENT;

                    if (!a.isSleeping) {
                        a.x -= correctionX * 0.5;
                        a.y -= correctionY * 0.5;
                    }
                    if (!b.isSleeping) {
                        b.x += correctionX * 0.5;
                        b.y += correctionY * 0.5;
                    }

                    if (velAlongNormal < 0) {
                        const jScalar = -(1 + BOUNCE) * velAlongNormal / 2;
                        const impulseX = jScalar * nx;
                        const impulseY = jScalar * ny;

                        if (!a.isSleeping) {
                            a.vx -= impulseX;
                            a.vy -= impulseY;
                        }
                        if (!b.isSleeping) {
                            b.vx += impulseX;
                            b.vy += impulseY;
                        }
                    }
                    wakeUpShape(a);
                    wakeUpShape(b);
                    continue;
                }

                if (a.type === b.type && !a.isDitto && !b.isDitto) {
                    mergeShapes(a, b);
                    return;
                }

                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);

                const relVx = b.vx - a.vx;
                const relVy = b.vy - a.vy;
                const velAlongNormal = relVx * nx + relVy * ny;

                if (velAlongNormal > 0) continue;

                const overlap = minDist - dist;
                const correctionX = nx * overlap * POSITION_CORRECTION_PERCENT;
                const correctionY = ny * overlap * POSITION_CORRECTION_PERCENT;

                if (!a.isSleeping) {
                    a.x -= correctionX * 0.5;
                    a.y -= correctionY * 0.5;
                }
                if (!b.isSleeping) {
                    b.x += correctionX * 0.5;
                    b.y += correctionY * 0.5;
                }

                const jScalar = -(1 + BOUNCE) * velAlongNormal / 2;
                const impulseX = jScalar * nx;
                const impulseY = jScalar * ny;

                if (!a.isSleeping) {
                    a.vx -= impulseX;
                    a.vy -= impulseY;
                }
                if (!b.isSleeping) {
                    b.vx += impulseX;
                    b.vy += impulseY;
                }

                wakeUpShape(a);
                wakeUpShape(b);
            }
        }
    }

    for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        if (s.soundCooldown > 0) s.soundCooldown--;

        if (s.isMagnetic) {
            s.isSleeping = false;
            s.vx = 0;
            s.angularVelocity = 0;
            continue;
        }

        const linearEnergy = s.vx * s.vx + s.vy * s.vy;
        const angularEnergy = s.angularVelocity * s.angularVelocity;

        if (linearEnergy < SLEEP_VELOCITY_THRESHOLD && angularEnergy < SLEEP_ANGULAR_THRESHOLD) {
            s.sleepTimer++;
            if (s.sleepTimer >= SLEEP_TIME_REQUIRED) {
                s.isSleeping = true;
                s.vx = 0;
                s.vy = 0;
                s.angularVelocity = 0;
            }
        } else {
            s.sleepTimer = 0;
            s.isSleeping = false;
        }
    }

    for (let i = shapes.length - 1; i >= 0; i--) {
        if (shapes[i].isExploding) {
            shapes.splice(i, 1);
        }
    }
}