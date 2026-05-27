export const BLOCKS = [
    { name: 'Triangle', next: 'Square', color: '#ff5c7a', size: 24, vertices: [[0, -0.9], [0.8, 0.5], [-0.8, 0.5]], dropScore: -10, mergeScore: 20, level: 1 },
    { name: 'Square', next: 'Pentagon', color: '#ff7fa4', size: 30, vertices: [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]], dropScore: -15, mergeScore: 30, level: 2 },
    { name: 'Pentagon', next: 'Hexagon', color: '#b388ff', size: 36, vertices: [[0, -0.85], [0.8, -0.3], [0.5, 0.7], [-0.5, 0.7], [-0.8, -0.3]], dropScore: -20, mergeScore: 40, level: 3 },
    { name: 'Hexagon', next: 'Heptagon', color: '#9ccc65', size: 42, vertices: [[0.7, -0.4], [0.7, 0.4], [0, 0.8], [-0.7, 0.4], [-0.7, -0.4], [0, -0.8]], dropScore: -25, mergeScore: 50, level: 4 },
    { name: 'Heptagon', next: 'Octagon', color: '#ffb74d', size: 48, vertices: [[0.6, -0.65], [0.9, -0.2], [0.6, 0.65], [0, 0.9], [-0.6, 0.65], [-0.9, -0.2], [-0.6, -0.65]], dropScore: -30, mergeScore: 60, level: 5 },
    { name: 'Octagon', next: 'Nonagon', color: '#fff176', size: 54, vertices: (() => { let v = []; for (let i = 0; i < 8; i++) { let a = (i * 45 - 90) * Math.PI / 180; v.push([Math.cos(a) * 0.8, Math.sin(a) * 0.8]); } return v; })(), dropScore: -35, mergeScore: 70, level: 6 },
    { name: 'Nonagon', next: 'Decagon', color: '#ff8a80', size: 60, vertices: (() => { let v = []; for (let i = 0; i < 9; i++) { let a = (i * 40 - 90) * Math.PI / 180; v.push([Math.cos(a) * 0.9, Math.sin(a) * 0.9]); } return v; })(), dropScore: -40, mergeScore: 80, level: 7 },
    { name: 'Decagon', next: 'Circle', color: '#4db6ac', size: 66, vertices: (() => { let v = []; for (let i = 0; i < 10; i++) { let a = (i * 36 - 90) * Math.PI / 180; v.push([Math.cos(a) * 0.9, Math.sin(a) * 0.9]); } return v; })(), dropScore: -45, mergeScore: 90, level: 8 },
    { name: 'Circle', next: 'Star', color: '#ff5252', size: 72, vertices: [], dropScore: -50, mergeScore: 100, level: 9 },
    { name: 'Star', next: null, color: '#81c784', size: 78, vertices: (() => { let v = []; for (let i = 0; i < 10; i++) { let a = i * 36 * Math.PI / 180; let r = i % 2 === 0 ? 0.9 : 0.45; v.push([Math.cos(a) * r, Math.sin(a) * r]); } return v; })(), dropScore: -55, mergeScore: 110, level: 10 }
];
export const SHAPE_TYPES = BLOCKS.map(b => b.name);
export const SHAPE_HIERARCHY = Object.fromEntries(BLOCKS.map(b => [b.name, b]));
export const FACES = [
    { eyes: 'happy', mouth: 'smile' }, { eyes: 'cute', mouth: 'open' }, { eyes: 'normal', mouth: 'smile_wide' },
    { eyes: 'happy', mouth: 'tongue' }, { eyes: 'blink', mouth: 'smile' }, { eyes: 'cute', mouth: 'shy' }
];
export const PHYSICS_CONSTANTS = {
    GRAVITY: 0.32, BOUNCE: 0.05, FRICTION: 0.96, ROLLING_GRIP: 0.15, ANGULAR_DRAG: 0.85,
    MAX_LINEAR_SPEED: 14, MAX_ANGULAR_SPEED: 0.25, SUB_STEPS: 8, POSITION_CORRECTION_PERCENT: 0.45,
    SLEEP_VELOCITY_THRESHOLD: 0.12, SLEEP_ANGULAR_THRESHOLD: 0.08, SLEEP_TIME_REQUIRED: 45,
    SOUND_VELOCITY_GATE: 0.50, GLOBAL_SOUND_COOLDOWN: 0.15
};