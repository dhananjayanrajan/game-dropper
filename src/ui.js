export let globalScore = 0;

const scoreDisplay = document.getElementById('scoreDisplay');
const nextShapePreview = document.getElementById('nextShapePreview');
const nextShapeName = document.getElementById('nextShapeName');

export function resetScoreDisplay() {
    globalScore = 0;
    scoreDisplay.innerText = '0';
}

export function updateScoreDisplay(amount) {
    globalScore += amount;
    scoreDisplay.innerText = globalScore;
}

export function renderNextShapePreview(nextDropType, config) {
    nextShapePreview.style.backgroundColor = config.color;
    nextShapePreview.style.borderRadius = '12px';
    nextShapeName.innerText = nextDropType;
}