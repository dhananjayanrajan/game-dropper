// ui.js
export let globalScore = 0;
const scoreDisplay = document.getElementById('scoreDisplay');
export function resetScoreDisplay() {
    globalScore = 0;
    scoreDisplay.innerText = '0';
}
export function updateScoreDisplay(amount) {
    globalScore += amount;
    scoreDisplay.innerText = globalScore;
}