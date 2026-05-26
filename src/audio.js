// audio.js
let audioCtx = null;
let masterCompressor = null;
let isMuted = false;

export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterCompressor = audioCtx.createDynamicsCompressor();
        masterCompressor.threshold.setValueAtTime(-10, audioCtx.currentTime);
        masterCompressor.knee.setValueAtTime(10, audioCtx.currentTime);
        masterCompressor.ratio.setValueAtTime(4, audioCtx.currentTime);
        masterCompressor.attack.setValueAtTime(0.002, audioCtx.currentTime);
        masterCompressor.release.setValueAtTime(0.15, audioCtx.currentTime);
        masterCompressor.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

export function setMuteState(state) {
    isMuted = state;
}

export function playGoofySound(type, volumeFactor = 1.0) {
    if (isMuted) return;
    initAudio();
    const now = audioCtx.currentTime;
    const masterGainNode = audioCtx.createGain();
    masterGainNode.gain.value = 5.0;
    masterGainNode.connect(masterCompressor);

    if (type === 'drop') {
        const osc = audioCtx.createOscillator();
        const mod = audioCtx.createOscillator();
        const modGain = audioCtx.createGain();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        mod.type = 'triangle';

        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);

        mod.frequency.setValueAtTime(25, now);
        modGain.gain.setValueAtTime(40, now);

        gain.gain.setValueAtTime(0.35 * volumeFactor, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(masterGainNode);

        mod.start(now);
        osc.start(now);
        mod.stop(now + 0.22);
        osc.stop(now + 0.22);
    }
    else if (type === 'bounce') {
        const calculatedVolume = Math.min(0.4, 0.4 * volumeFactor);
        if (calculatedVolume < 0.015) return;

        const baseFreq = 160 + (1 - Math.min(1, volumeFactor)) * 140;

        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.14);

        filter.type = 'lowpass';
        filter.Q.setValueAtTime(6, now);
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.14);

        gain.gain.setValueAtTime(calculatedVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGainNode);

        osc.start(now);
        osc.stop(now + 0.14);
    }
    else if (type === 'merge') {
        const chord = [261.63, 329.63, 392.00, 523.25];
        chord.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const startDelay = index * 0.03;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + startDelay);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + startDelay + 0.28);

            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.15 * volumeFactor, now + startDelay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + startDelay + 0.28);

            osc.connect(gain);
            gain.connect(masterGainNode);

            osc.start(now + startDelay);
            osc.stop(now + startDelay + 0.28);
        });
    }
    else if (type === 'click') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.2 * volumeFactor, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now);
        osc.stop(now + 0.04);
    }
    else if (type === 'gameover') {
        const osc = audioCtx.createOscillator();
        const vibrato = audioCtx.createOscillator();
        const vibGain = audioCtx.createGain();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.8);

        vibrato.type = 'sine';
        vibrato.frequency.setValueAtTime(14, now);
        vibGain.gain.setValueAtTime(15, now);

        gain.gain.setValueAtTime(volumeFactor, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        vibrato.connect(vibGain);
        vibGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(masterGainNode);

        vibrato.start(now);
        osc.start(now);
        vibrato.stop(now + 0.8);
        osc.stop(now + 0.8);
    }
}