// src/managers/comboManager.js
export class ComboManager {
    constructor(onUpdate) {
        this.comboCount = 0;
        this.comboMultiplier = 1;
        this.comboTimer = null;
        this.onUpdate = onUpdate;
    }

    triggerCombo(isMerge) {
        if (isMerge) {
            this.comboCount++;
            if (this.comboCount >= 6) this.comboMultiplier = 4;
            else if (this.comboCount >= 4) this.comboMultiplier = 3;
            else if (this.comboCount >= 2) this.comboMultiplier = 2;
            else this.comboMultiplier = 1;

            if (this.comboTimer) clearTimeout(this.comboTimer);
            this.comboTimer = setTimeout(() => {
                this.resetCombo();
            }, 3000);
        } else {
            this.resetCombo();
        }
        this.updateComboUI();
    }

    resetCombo() {
        this.comboCount = 0;
        this.comboMultiplier = 1;
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
            this.comboTimer = null;
        }
        this.updateComboUI();
    }

    updateComboUI() {
        let container = document.getElementById('comboContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'comboContainer';
            container.className = 'absolute top-4 left-4 z-10 pointer-events-none transition-all duration-200 transform scale-0 opacity-0 flex flex-col gap-1';

            const textElem = document.createElement('div');
            textElem.id = 'comboText';
            textElem.className = 'bg-[#1cb0f6] border-2 border-[#1899d6] rounded-xl px-4 py-1 text-white font-black text-sm tracking-wider uppercase shadow-[0_3px_0_0_#1899d6]';

            const multElem = document.createElement('div');
            multElem.id = 'comboMult';
            multElem.className = 'bg-[#ffc800] border-2 border-[#e6b400] rounded-xl px-4 py-1 text-white font-black text-2xl text-center shadow-[0_3px_0_0_#e6b400]';

            container.appendChild(textElem);
            container.appendChild(multElem);
            const canvasContainer = document.getElementById('canvasContainer');
            if (canvasContainer) {
                canvasContainer.appendChild(container);
            }
        }

        if (this.comboCount >= 2) {
            document.getElementById('comboText').innerText = `${this.comboCount} MERGE COMBO!`;
            document.getElementById('comboMult').innerText = `${this.comboMultiplier}x POINTS`;
            container.classList.remove('scale-0', 'opacity-0');
            container.classList.add('scale-100', 'opacity-100');
        } else {
            container.classList.remove('scale-100', 'opacity-100');
            container.classList.add('scale-0', 'opacity-0');
        }
        if (this.onUpdate) {
            this.onUpdate(this.comboCount, this.comboMultiplier);
        }
    }
}