// config.js
export const SHAPE_HIERARCHY = {
    'Cherry': { next: 'Strawberry', color: '#ff5c7a', size: 24, vertices: [[0, -0.9], [0.5, -0.7], [0.8, -0.2], [0.8, 0.4], [0.4, 0.9], [-0.4, 0.9], [-0.8, 0.4], [-0.8, -0.2], [-0.5, -0.7]] },
    'Strawberry': { next: 'Grape', color: '#ff7fa4', size: 30, vertices: [[0, -1], [0.6, -0.7], [0.8, -0.1], [0.5, 0.6], [0, 1.1], [-0.5, 0.6], [-0.8, -0.1], [-0.6, -0.7]] },
    'Grape': { next: 'Apple', color: '#b388ff', size: 38, vertices: [[0, -1.1], [0.5, -0.8], [0.8, -0.2], [0.7, 0.5], [0, 1], [-0.7, 0.5], [-0.8, -0.2], [-0.5, -0.8]] },
    'Apple': { next: 'Orange', color: '#9ccc65', size: 46, vertices: [[0, -0.8], [0.5, -1], [0.9, -0.5], [0.9, 0.4], [0.5, 0.9], [0, 0.8], [-0.5, 0.9], [-0.9, 0.4], [-0.9, -0.5], [-0.5, -1]] },
    'Orange': { next: 'Lemon', color: '#ffb74d', size: 55, vertices: [[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7]] },
    'Lemon': { next: 'Peach', color: '#fff176', size: 65, vertices: [[0, -0.8], [0.6, -0.6], [1, -0.1], [0.6, 0.7], [0, 0.9], [-0.6, 0.7], [-1, -0.1], [-0.6, -0.6]] },
    'Peach': { next: 'Kiwi', color: '#ff8a80', size: 76, vertices: [[0, -0.9], [0.6, -0.8], [0.9, -0.2], [0.8, 0.5], [0.4, 0.9], [-0.4, 0.9], [-0.8, 0.5], [-0.9, -0.2], [-0.6, -0.8]] },
    'Kiwi': { next: 'Tomato', color: '#4db6ac', size: 88, vertices: [[0, -1], [0.8, -0.6], [1, 0.1], [0.6, 0.8], [-0.6, 0.8], [-1, 0.1], [-0.8, -0.6]] },
    'Tomato': { next: 'Coconut', color: '#ff5252', size: 102, vertices: [[0, -0.85], [0.6, -1], [0.9, -0.4], [0.9, 0.5], [0.5, 0.9], [0, 0.85], [-0.5, 0.9], [-0.9, 0.5], [-0.9, -0.4], [-0.6, -1]] },
    'Coconut': { next: 'Watermelon', color: '#a1887f', size: 116, vertices: [[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7]] },
    'Watermelon': { next: 'Cherry', color: '#81c784', size: 130, vertices: [[-0.9, -0.4], [0, -0.9], [0.9, -0.4], [0.7, 0.5], [0, 0.9], [-0.7, 0.5]] }
};

export const SHAPE_TYPES = Object.keys(SHAPE_HIERARCHY);

export const FACES = [
    { eyes: 'happy', mouth: 'smile' },
    { eyes: 'cute', mouth: 'open' },
    { eyes: 'normal', mouth: 'smile_wide' },
    { eyes: 'happy', mouth: 'tongue' },
    { eyes: 'blink', mouth: 'smile' },
    { eyes: 'cute', mouth: 'shy' }
];

export const PHYSICS_CONSTANTS = {
    GRAVITY: 0.32,
    BOUNCE: 0.05,
    FRICTION: 0.96,
    ROLLING_GRIP: 0.15,
    ANGULAR_DRAG: 0.85,
    MAX_LINEAR_SPEED: 14,
    MAX_ANGULAR_SPEED: 0.25,
    SUB_STEPS: 8,
    POSITION_CORRECTION_PERCENT: 0.45,
    SLEEP_VELOCITY_THRESHOLD: 0.12,
    SLEEP_ANGULAR_THRESHOLD: 0.08,
    SLEEP_TIME_REQUIRED: 45,
    SOUND_VELOCITY_GATE: 0.50,
    GLOBAL_SOUND_COOLDOWN: 0.15
};