// counter.js
export let comboCount = 0;
export let comboMultiplier = 1;
let currentTimer = null;

export function incrementCombo() {
  comboCount++;
  if (comboCount >= 6) {
    comboMultiplier = 4;
  } else if (comboCount >= 4) {
    comboMultiplier = 3;
  } else if (comboCount >= 2) {
    comboMultiplier = 2;
  } else {
    comboMultiplier = 1;
  }

  triggerComboUI();

  if (currentTimer) clearTimeout(currentTimer);
  currentTimer = setTimeout(() => {
    resetCombo();
  }, 3000);
}

export function registerPlayerDrop() {
  resetCombo();
}

export function resetCombo() {
  comboCount = 0;
  comboMultiplier = 1;
  if (currentTimer) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }
  updateComboUI();
}

function triggerComboUI() {
  let container = document.getElementById('comboContainer');
  if (!container) {
    const parent = document.getElementById('canvasContainer');
    container = document.createElement('div');
    container.id = 'comboContainer';
    container.className = 'absolute top-4 left-4 z-10 pointer-events-none transition-all duration-200 transform scale-0 opacity-0 flex flex-col gap-1';

    const textElem = document.createElement('div');
    textElem.id = 'comboText';
    textElem.className = 'bg-[#1cb0f6] border-2 border-[#1899d6] rounded-xl px-4 py-1 text-white font-black text-sm tracking-wider uppercase shadow-[0_3px_0_0_#1899d6]';

    const multElem = document.createElement('div');
    multElem.id = 'comboMult';
    multElem.className = 'bg-[#ffc800] border-2 border-[#e6b400] rounded-xl px-4 py-1 text-white font-black text-2xl text-center shadow-[0_3px_0_0_#e6b400] animate-bounce';

    container.appendChild(textElem);
    container.appendChild(multElem);
    parent.appendChild(container);
  }

  updateComboUI();
}

function updateComboUI() {
  const container = document.getElementById('comboContainer');
  if (!container) return;

  if (comboCount >= 2) {
    document.getElementById('comboText').innerText = `${comboCount} MERGE COMBO!`;
    document.getElementById('comboMult').innerText = `${comboMultiplier}x POINTS`;
    container.classList.remove('scale-0', 'opacity-0');
    container.classList.add('scale-100', 'opacity-100');
  } else {
    container.classList.remove('scale-100', 'opacity-100');
    container.classList.add('scale-0', 'opacity-0');
  }
}