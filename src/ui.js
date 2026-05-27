// src/ui.js
let score = 0;

export function resetScoreDisplay() {
    score = 0;
    document.getElementById('scoreDisplay').innerText = '0';
}

export function updateScoreDisplay(amount) {
    score += amount;
    document.getElementById('scoreDisplay').innerText = Math.floor(score);
}

export function addDropScorePenalty(penalty) {
    score += penalty;
    document.getElementById('scoreDisplay').innerText = Math.floor(score);
}