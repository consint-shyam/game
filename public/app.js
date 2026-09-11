// ==========================================================================
// TUG OF WAR: MATHEMATICS - CLIENT LOGIC & SOUND ENGINE
// ==========================================================================

// Global App State
let socket = null;
let currentRoomCode = null;
let playerNum = null; // 1 or 2
let isHost = false;
let currentAnswerInput = '';
let isSoundEnabled = true;
let isGameActive = false;

// Audio Context (Procedural Web Audio API)
// Audio Context & Dynamic Sound Engine (Procedural Web Audio API)
let audioCtx = null;
let masterGain = null;
let masterCompressor = null;
let bgmGain = null;
let bgmInterval = null;
let isBgmPlaying = false;
let bgmStep = 0;

function initAudio() {
  if (!audioCtx) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return Promise.resolve(null);
      audioCtx = new AudioContext();
      
      // Dynamics Compressor for punchy, clean acoustics
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(30, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(6, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.25, audioCtx.currentTime);
      
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(isSoundEnabled ? 0.95 : 0, audioCtx.currentTime);

      bgmGain = audioCtx.createGain();
      bgmGain.gain.setValueAtTime(isSoundEnabled ? 0.48 : 0, audioCtx.currentTime);
      bgmGain.connect(masterGain);
      
      masterGain.connect(masterCompressor);
      masterCompressor.connect(audioCtx.destination);
    } catch (e) {
      console.warn('AudioContext init error:', e);
      return Promise.resolve(null);
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    return audioCtx.resume().then(() => {
      updateSoundStatusUI(audioCtx.state === 'running');
      return audioCtx;
    }).catch(err => {
      updateSoundStatusUI(false);
      return audioCtx;
    });
  } else if (audioCtx && audioCtx.state === 'running') {
    updateSoundStatusUI(true);
    return Promise.resolve(audioCtx);
  }
  return Promise.resolve(audioCtx);
}

function updateSoundStatusUI(isRunning) {
  const statusEl = document.getElementById('loader-sound-status');
  if (statusEl) {
    if (isRunning && isSoundEnabled) {
      statusEl.className = 'loader-sound-status active';
      statusEl.innerHTML = `
        <div class="sound-eq-bars"><span></span><span></span><span></span></div>
        <span id="sound-status-msg">🎵 AUDIO & MUSIC ACTIVE</span>
      `;
    } else if (isSoundEnabled) {
      statusEl.className = 'loader-sound-status needs-tap';
      statusEl.innerHTML = `
        <span>🔊 TAP / MOVE ANYWHERE FOR MUSIC</span>
      `;
    } else {
      statusEl.className = 'loader-sound-status';
      statusEl.innerHTML = `<span>🔇 SOUND MUTED</span>`;
    }
  }
}

// High-Energy Upbeat Background Music Engine (128 BPM Cyber Battle Loop)
function startExcitedBGM() {
  if (!isSoundEnabled) return;
  initAudio().then(() => {
    if (!audioCtx || !bgmGain) return;

    isBgmPlaying = true;

    // If already actively looping, don't create duplicate intervals
    if (bgmInterval) return;

    bgmStep = 0;
    const stepTime = 60 / 128 / 4; // 16th note at 128 BPM (~117ms)

    // Melodic Arpeggio Notes (Dm -> F -> C -> G progression)
    const leadPattern = [
      293.66, null, 349.23, null, 440.00, null, 587.33, null,  // D4, F4, A4, D5
      523.25, null, 440.00, null, 349.23, null, 392.00, null,  // C5, A4, F4, G4
      293.66, 349.23, 440.00, 523.25, 587.33, 523.25, 440.00, 349.23,
      392.00, null, 440.00, null, 523.25, null, 587.33, null
    ];

    // Driving Bass Notes
    const bassPattern = [
      73.42, 73.42, null, 73.42, 87.31, 87.31, null, 87.31,   // D2, F2
      65.41, 65.41, null, 65.41, 98.00, 98.00, null, 98.00,   // C2, G2
      73.42, 73.42, 73.42, 73.42, 87.31, 87.31, 87.31, 87.31,
      65.41, 65.41, 65.41, 65.41, 98.00, 98.00, 110.00, 130.81
    ];

    // Warm Synth Chords on bar boundaries
    const chordRoots = [
      [146.83, 220.00, 261.63], // Dm7
      [174.61, 220.00, 261.63], // F
      [130.81, 196.00, 261.63], // C
      [196.00, 246.94, 293.66]  // G
    ];

    bgmInterval = setInterval(() => {
      if (!isBgmPlaying || !isSoundEnabled || !audioCtx) return;
      if (audioCtx.state !== 'running') {
        audioCtx.resume().then(() => {
          updateSoundStatusUI(true);
        }).catch(() => {});
        return;
      }

    const now = audioCtx.currentTime;
    const step = bgmStep % 32;

    try {
      // 1. Kick Drum (Punchy on every quarter note: 0, 4, 8, 12, 16, 20, 24, 28)
      if (step % 4 === 0) {
        const kickOsc = audioCtx.createOscillator();
        const kickGain = audioCtx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(155, now);
        kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
        kickGain.gain.setValueAtTime(0.75, now);
        kickGain.gain.linearRampToValueAtTime(0.0001, now + 0.13);
        kickOsc.connect(kickGain);
        kickGain.connect(bgmGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.13);
      }

      // 2. Crisp Hi-Hat (Offbeat 16th notes: step % 2 === 1)
      if (step % 2 === 1) {
        const hatOsc = audioCtx.createOscillator();
        const hatFilter = audioCtx.createBiquadFilter();
        const hatGain = audioCtx.createGain();
        hatOsc.type = 'sawtooth';
        hatOsc.frequency.setValueAtTime(4500, now);
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(8000, now);
        hatGain.gain.setValueAtTime(step % 4 === 2 ? 0.22 : 0.12, now);
        hatGain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
        hatOsc.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(bgmGain);
        hatOsc.start(now);
        hatOsc.stop(now + 0.05);
      }

      // 3. Snare / Clap Snap on beats 2 and 4 (step 4, 12, 20, 28)
      if (step % 8 === 4) {
        const snareOsc = audioCtx.createOscillator();
        const snareGain = audioCtx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(240, now);
        snareGain.gain.setValueAtTime(0.35, now);
        snareGain.gain.linearRampToValueAtTime(0.0001, now + 0.14);
        snareOsc.connect(snareGain);
        snareGain.connect(bgmGain);
        snareOsc.start(now);
        snareOsc.stop(now + 0.14);
      }

      // 4. Driving Pumping Synth Bassline
      const bassFreq = bassPattern[step];
      if (bassFreq) {
        const bOsc = audioCtx.createOscillator();
        const bFilter = audioCtx.createBiquadFilter();
        const bGain = audioCtx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(bassFreq, now);
        bFilter.type = 'lowpass';
        bFilter.Q.setValueAtTime(4.0, now);
        bFilter.frequency.setValueAtTime(500, now);
        bGain.gain.setValueAtTime(0.32, now);
        bGain.gain.linearRampToValueAtTime(0.0001, now + stepTime * 1.8);
        bOsc.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(bgmGain);
        bOsc.start(now);
        bOsc.stop(now + stepTime * 1.8);
      }

      // 5. Catchy Upbeat Melodic Arp
      const leadFreq = leadPattern[step];
      if (leadFreq) {
        const lOsc = audioCtx.createOscillator();
        const lGain = audioCtx.createGain();
        lOsc.type = 'triangle';
        lOsc.frequency.setValueAtTime(leadFreq, now);
        lGain.gain.setValueAtTime(0.26, now);
        lGain.gain.linearRampToValueAtTime(0.0001, now + stepTime * 1.5);
        lOsc.connect(lGain);
        lGain.connect(bgmGain);
        lOsc.start(now);
        lOsc.stop(now + stepTime * 1.5);
      }

      // 6. Warm Synth Chords on bar boundaries
      if (step % 8 === 0) {
        const barIdx = Math.floor(step / 8) % 4;
        const chord = chordRoots[barIdx];
        chord.forEach(freq => {
          const cOsc = audioCtx.createOscillator();
          const cFilter = audioCtx.createBiquadFilter();
          const cGain = audioCtx.createGain();
          cOsc.type = 'sine';
          cOsc.frequency.setValueAtTime(freq, now);
          cFilter.type = 'lowpass';
          cFilter.frequency.setValueAtTime(1200, now);
          cGain.gain.setValueAtTime(0.08, now);
          cGain.gain.linearRampToValueAtTime(0.0001, now + stepTime * 7.5);
          cOsc.connect(cFilter);
          cFilter.connect(cGain);
          cGain.connect(bgmGain);
          cOsc.start(now);
          cOsc.stop(now + stepTime * 7.5);
        });
      }
    } catch (e) {
      console.warn('BGM step error:', e);
    }

    bgmStep++;
  }, Math.round(stepTime * 1000));
  });
}

function stopBGM() {
  isBgmPlaying = false;
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
}

// Procedural White Noise Buffer Generator
function getNoiseBuffer(duration = 2.0) {
  if (!audioCtx) return null;
  const sampleRate = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Native AI Voice Synthesizer for Engineers Day
function speakIntroAnnouncement() {
  if (!('speechSynthesis' in window) || !isSoundEnabled) return;
  try {
    window.speechSynthesis.cancel();
    const text = "Welcome Engineers! Initializing Quantum Mathematics Duel. Innovated and presented by Shyam. Happy Engineers Day!";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 0.95; // Slightly lower, authoritative cyber AI tone
    utterance.volume = 1.0;

    let hasSpoken = false;
    const doSpeak = () => {
      if (hasSpoken) return;
      hasSpoken = true;
      try {
        const voices = window.speechSynthesis.getVoices();
        const cyberVoice = voices.find(v => v.lang && v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Alex')));
        if (cyberVoice) {
          utterance.voice = cyberVoice;
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis speak error:', err);
      }
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setTimeout(doSpeak, 450);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        setTimeout(doSpeak, 450);
      };
      setTimeout(doSpeak, 650);
    }
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

// Epic Blockbuster Movie Intro Soundtrack (Braaam horn, Tron Arps, Timpani, Shyam Fanfare, Title Slam)
function playCinematicIntroSound() {
  if (!isSoundEnabled) return;
  try {
    initAudio();
    if (!audioCtx || !masterGain) return;
    const now = audioCtx.currentTime;

    // 1. Sub Bass Impact Boom (0.0s)
    const subOsc = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.6);
    subGain.gain.setValueAtTime(0.55, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    subOsc.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start(now);
    subOsc.stop(now + 1.8);

    // 2. Timpani / Taiko Drum Hit (0.05s)
    const noiseBuf = getNoiseBuffer(2.0);
    if (noiseBuf) {
      const timpani = audioCtx.createBufferSource();
      const timpaniFilter = audioCtx.createBiquadFilter();
      const timpaniGain = audioCtx.createGain();
      timpani.buffer = noiseBuf;
      timpaniFilter.type = 'lowpass';
      timpaniFilter.frequency.setValueAtTime(160, now);
      timpaniGain.gain.setValueAtTime(0.4, now);
      timpaniGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      timpani.connect(timpaniFilter);
      timpaniFilter.connect(timpaniGain);
      timpaniGain.connect(masterGain);
      timpani.start(now);
      timpani.stop(now + 0.35);
    }

    // 3. Blockbuster Brass Horn Swell ("BRAAAM" - 0.2s to 1.8s)
    [65.4, 65.8, 98.0].forEach((freq) => {
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + 0.2);
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(4.5, now + 0.2);
      filter.frequency.setValueAtTime(180, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.65);
      filter.frequency.exponentialRampToValueAtTime(320, now + 1.8);
      gain.gain.setValueAtTime(0.001, now + 0.2);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start(now + 0.2);
      osc.stop(now + 1.8);
    });

    // 3b. Tron Cyber Synth Arpeggiator (0.3s to 2.8s)
    const arpNotes = [146.83, 220.00, 293.66, 349.23, 440.00, 587.33, 440.00, 349.23];
    for (let loop = 0; loop < 3; loop++) {
      arpNotes.forEach((freq, idx) => {
        const tStart = now + 0.3 + loop * 0.8 + idx * 0.1;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, tStart);
        gain.gain.setValueAtTime(0.05, tStart);
        gain.gain.exponentialRampToValueAtTime(0.001, tStart + 0.09);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(tStart);
        osc.stop(tStart + 0.09);
      });
    }

    // 4. Dramatic Timpani Build-up Rhythmic Hits (0.6s & 0.9s)
    [0.6, 0.9].forEach((tOff, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now + tOff);
      osc.frequency.exponentialRampToValueAtTime(40, now + tOff + 0.3);
      gain.gain.setValueAtTime(0.28 + idx * 0.1, now + tOff);
      gain.gain.exponentialRampToValueAtTime(0.001, now + tOff + 0.3);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + tOff);
      osc.stop(now + tOff + 0.3);
    });

    // 5. "PRESENTED BY SHYAM" Fanfare Reveal (1.3s to 3.2s)
    // Majestic D-Major Chord: D3, A3, D4, F#4, A4, D5
    const shyamFanfare = [
      { f: 146.83, delay: 1.3, dur: 2.0, vol: 0.22 }, // D3
      { f: 220.00, delay: 1.35, dur: 1.9, vol: 0.22 }, // A3
      { f: 293.66, delay: 1.4, dur: 1.8, vol: 0.25 }, // D4
      { f: 369.99, delay: 1.45, dur: 1.8, vol: 0.28 }, // F#4
      { f: 440.00, delay: 1.5, dur: 1.8, vol: 0.28 }, // A4
      { f: 587.33, delay: 1.55, dur: 1.9, vol: 0.32 }, // D5
    ];

    shyamFanfare.forEach(item => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, now + item.delay);
      gain.gain.setValueAtTime(0.001, now + item.delay);
      gain.gain.linearRampToValueAtTime(item.vol, now + item.delay + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + item.delay + item.dur);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + item.delay);
      osc.stop(now + item.delay + item.dur);
    });

    // 6. Tension String / Laser Riser Whoosh (2.5s to 3.1s)
    if (noiseBuf) {
      const riserSrc = audioCtx.createBufferSource();
      const riserFilter = audioCtx.createBiquadFilter();
      const riserGain = audioCtx.createGain();
      riserSrc.buffer = noiseBuf;
      riserFilter.type = 'bandpass';
      riserFilter.Q.setValueAtTime(3.0, now + 2.5);
      riserFilter.frequency.setValueAtTime(300, now + 2.5);
      riserFilter.frequency.exponentialRampToValueAtTime(4500, now + 3.1);
      riserGain.gain.setValueAtTime(0.01, now + 2.5);
      riserGain.gain.linearRampToValueAtTime(0.35, now + 3.05);
      riserGain.gain.exponentialRampToValueAtTime(0.001, now + 3.15);
      riserSrc.connect(riserFilter);
      riserFilter.connect(riserGain);
      riserGain.connect(masterGain);
      riserSrc.start(now + 2.5);
      riserSrc.stop(now + 3.15);
    }

    // 7. "TUG OF WAR MATHEMATICS" Drop & Cymbal Crash (3.1s)
    // Deep Sub Drop
    const dropOsc = audioCtx.createOscillator();
    const dropGain = audioCtx.createGain();
    dropOsc.type = 'sine';
    dropOsc.frequency.setValueAtTime(95, now + 3.1);
    dropOsc.frequency.exponentialRampToValueAtTime(32, now + 4.3);
    dropGain.gain.setValueAtTime(0.5, now + 3.1);
    dropGain.gain.exponentialRampToValueAtTime(0.001, now + 4.3);
    dropOsc.connect(dropGain);
    dropGain.connect(masterGain);
    dropOsc.start(now + 3.1);
    dropOsc.stop(now + 4.3);

    // Shimmering Cymbal Wash
    if (noiseBuf) {
      const cymbalSrc = audioCtx.createBufferSource();
      const cymbalFilter = audioCtx.createBiquadFilter();
      const cymbalGain = audioCtx.createGain();
      cymbalSrc.buffer = noiseBuf;
      cymbalFilter.type = 'highpass';
      cymbalFilter.frequency.setValueAtTime(5000, now + 3.1);
      cymbalGain.gain.setValueAtTime(0.3, now + 3.1);
      cymbalGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
      cymbalSrc.connect(cymbalFilter);
      cymbalFilter.connect(cymbalGain);
      cymbalGain.connect(masterGain);
      cymbalSrc.start(now + 3.1);
      cymbalSrc.stop(now + 4.5);
    }

    // Cascading Crystalline Bells
    const bellPitches = [587.33, 739.99, 880.00, 1174.66, 1479.98, 1760.00, 2349.32];
    bellPitches.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 3.1 + idx * 0.08);
      gain.gain.setValueAtTime(0.12, now + 3.1 + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.1 + idx * 0.08 + 0.45);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + 3.1 + idx * 0.08);
      osc.stop(now + 3.1 + idx * 0.08 + 0.45);
    });

    // 8. Triumphant Engineers Finale Swell (5.2s to 8.2s)
    const finaleChords = [
      { f: 293.66, t: 5.2, dur: 2.8, v: 0.18 }, // D4
      { f: 440.00, t: 5.4, dur: 2.6, v: 0.20 }, // A4
      { f: 587.33, t: 5.6, dur: 2.4, v: 0.22 }, // D5
      { f: 739.99, t: 5.8, dur: 2.2, v: 0.24 }, // F#5
      { f: 880.00, t: 6.0, dur: 2.0, v: 0.26 }, // A5
      { f: 1174.66, t: 6.2, dur: 2.0, v: 0.28 }, // D6
    ];
    finaleChords.forEach(n => {
      const fOsc = audioCtx.createOscillator();
      const fGain = audioCtx.createGain();
      fOsc.type = 'triangle';
      fOsc.frequency.setValueAtTime(n.f, now + n.t);
      fGain.gain.setValueAtTime(0.001, now + n.t);
      fGain.gain.linearRampToValueAtTime(n.v, now + n.t + 0.15);
      fGain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur);
      fOsc.connect(fGain);
      fGain.connect(masterGain);
      fOsc.start(now + n.t);
      fOsc.stop(now + n.t + n.dur);
    });

    // Sub Bass Warmth underneath finale (5.2s - 8.2s)
    const finSub = audioCtx.createOscillator();
    const finSubGain = audioCtx.createGain();
    finSub.type = 'sine';
    finSub.frequency.setValueAtTime(73.42, now + 5.2);
    finSub.frequency.exponentialRampToValueAtTime(36.71, now + 8.2);
    finSubGain.gain.setValueAtTime(0.35, now + 5.2);
    finSubGain.gain.exponentialRampToValueAtTime(0.001, now + 8.2);
    finSub.connect(finSubGain);
    finSubGain.connect(masterGain);
    finSub.start(now + 5.2);
    finSub.stop(now + 8.2);

  } catch (err) {
    console.warn('Cinematic intro sound error:', err);
  }
}

// Procedural Sound Effects Engine
function playSound(type) {
  if (!isSoundEnabled) return;
  try {
    initAudio();
    if (!audioCtx || !masterGain) return;
    const now = audioCtx.currentTime;

    if (type === 'beep' || type === 'tap') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'correct') {
      const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      chord.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.16, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.35);
      });
    } else if (type === 'wrong') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.linearRampToValueAtTime(70, now + 0.28);
      osc2.frequency.setValueAtTime(145, now);
      osc2.frequency.linearRampToValueAtTime(72, now + 0.28);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
    } else if (type === 'tug') {
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.16);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'tick_urgent') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'match_start') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(165, now + 0.8);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === 'victory') {
      const victoryChords = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 0.1 },
        { f: 783.99, t: 0.2 },
        { f: 1046.50, t: 0.32 },
        { f: 1318.51, t: 0.45 },
      ];
      victoryChords.forEach(n => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.24, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + 0.55);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + n.t);
        osc.stop(now + n.t + 0.55);
      });
    }
  } catch (e) {
    console.error('Audio play error:', e);
  }
}

// DOM Elements
const views = {
  lobby: document.getElementById('view-lobby'),
  waiting: document.getElementById('view-waiting'),
  game: document.getElementById('view-game')
};

const modalGameOver = document.getElementById('modal-game-over');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initAudio();
  initCinematicLoader();
  initMathParticles();
  initTelemetryHUD();
  setupSocket();
  setupEventListeners();
  fetchServerInfo();
});

window.addEventListener('load', () => {
  initAudio();
  const silentUnlocker = document.getElementById('silent-audio-unlocker');
  if (silentUnlocker) {
    silentUnlocker.play().catch(() => {});
  }
});

// Cinematic Presentation Loader Logic (Presented By Shyam - Engineers Day Special)
let cinematicTimer = null;

function initCinematicLoader() {
  triggerCinematicIntro(false);
}

function triggerCinematicIntro(forceReplay = false) {
  let loaderOverlay = document.getElementById('cinematic-loader');
  
  // If replaying and overlay was removed from DOM, recreate it dynamically
  if (!loaderOverlay && forceReplay) {
    const tempDiv = document.createElement('div');
    tempDiv.id = 'cinematic-loader';
    tempDiv.className = 'cinematic-loader-overlay';
    tempDiv.innerHTML = `
      <div class="loader-bg-glow"></div>
      <div class="loader-stars"></div>
      <div class="cyber-scanlines"></div>
      <div class="loader-content clean-cinematic-card">
        <div class="engineers-day-ribbon animate-fade-in">
          <span class="eng-icon">⚙️</span>
          <span>ENGINEERS DAY SPECIAL</span>
        </div>

        <div class="creator-reveal animate-fade-in">
          <span class="sub-text">PRESENTED BY</span>
          <h1 class="creator-name animate-glow-text">SHYAM</h1>
        </div>

        <div class="loader-game-title animate-fade-in">
          <h2 class="epic-title">TUG OF WAR <span class="math-glow">MATHEMATICS</span></h2>
        </div>

        <div class="loading-bar-wrap">
          <div class="loading-bar-fill" id="loader-fill"></div>
        </div>
        <span class="loading-status-text" id="loader-status">STARTING ARENA...</span>

        <div class="loader-sound-status active" id="loader-sound-status" title="Sound System Status">
          <div class="sound-eq-bars"><span></span><span></span><span></span></div>
          <span id="sound-status-msg">STARTING AUDIO ENGINE...</span>
        </div>

        <button id="btn-skip-intro" class="skip-intro-btn">ENTER DUEL ⏭</button>
      </div>
    `;
    document.body.appendChild(tempDiv);
    loaderOverlay = tempDiv;
  }

  if (!loaderOverlay) return;

  loaderOverlay.classList.remove('fade-out');
  const fillBar = document.getElementById('loader-fill');
  const statusText = document.getElementById('loader-status');
  const skipBtn = document.getElementById('btn-skip-intro');

  let hasStartedIntroSound = false;

  function playIntroSoundSequence() {
    if (hasStartedIntroSound || !isSoundEnabled) return;
    if (!audioCtx || audioCtx.state !== 'running') return;
    hasStartedIntroSound = true;
    updateSoundStatusUI(true);
    playCinematicIntroSound();
    speakIntroAnnouncement();
  }

  function tryPlayIntroSound() {
    if (!isSoundEnabled || hasStartedIntroSound) return;
    initAudio().then(() => {
      if (audioCtx && audioCtx.state === 'running') {
        playIntroSoundSequence();
      } else {
        updateSoundStatusUI(false);
      }
    }).catch(() => {
      updateSoundStatusUI(false);
    });
  }

  function startPresentationSequence() {
    // Attempt automatic playback immediately as DOM is rendered
    tryPlayIntroSound();

    // Also attempt silent HTML5 unlocker for browser autoplay permission elevation
    const silentUnlocker = document.getElementById('silent-audio-unlocker');
    if (silentUnlocker) {
      silentUnlocker.play().then(() => {
        tryPlayIntroSound();
      }).catch(() => {});
    }

    // Progress milestone timeline (~8.5 seconds)
    const milestones = [
      { p: 15, t: "INITIALIZING QUANTUM ARENA...", delay: 400 },
      { p: 35, t: "PRESENTED BY SHYAM...", delay: 1600 },
      { p: 60, t: "SYNCHRONIZING MATHEMATICAL MATRIX...", delay: 3400 },
      { p: 80, t: "ENGINEERS DAY SPECIAL EDITION...", delay: 5200 },
      { p: 95, t: "CALIBRATING QUANTUM ALGORITHMS...", delay: 6800 },
      { p: 100, t: "READY TO DUEL! LAUNCHING...", delay: 7800 },
    ];

    milestones.forEach(m => {
      setTimeout(() => {
        if (fillBar) fillBar.style.width = m.p + '%';
        if (statusText) statusText.textContent = m.t;
      }, m.delay);
    });

    // Auto-dismiss presentation loader and transition directly to excited background music
    cinematicTimer = setTimeout(dismissLoader, 8500);
  }

  function dismissLoader() {
    if (cinematicTimer) clearTimeout(cinematicTimer);
    loaderOverlay.classList.add('fade-out');
    setTimeout(() => {
      if (loaderOverlay && loaderOverlay.parentNode) {
        loaderOverlay.remove();
      }
      // Play excited battle music automatically right after presentation loader!
      startExcitedBGM();
    }, 500);
  }

  // Start presentation sequence automatically
  startPresentationSequence();

  // Multi-event autoplay unblocker: any movement, scroll, key, or tap unlocks audio seamlessly
  const unlockAudioAndPlayIntro = () => {
    if (hasStartedIntroSound) return;
    tryPlayIntroSound();
  };

  ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'mousemove', 'wheel', 'scroll', 'focus'].forEach(evt => {
    window.addEventListener(evt, unlockAudioAndPlayIntro, { passive: true });
  });

  // Direct click on sound status pill
  const soundStatusPill = document.getElementById('loader-sound-status');
  if (soundStatusPill) {
    soundStatusPill.addEventListener('click', (e) => {
      e.stopPropagation();
      tryPlayIntroSound();
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio().then(() => {
        dismissLoader();
      });
    });
  }
}
// Floating Ambient Math Formula Particles (Engineers Day Cyber Canvas)
function initMathParticles() {
  const canvas = document.getElementById('math-particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const symbols = ['∫', '∑', 'π', 'E=mc²', '∇×B', '√x', 'Ω', 'λ', '0101', 'Δ', '∞', 'f(x)', 'θ', 'λ·v', '∂y/∂x'];
  const particles = [];
  const count = Math.min(26, Math.floor(window.innerWidth / 50));

  for (let i = 0; i < count; i++) {
    particles.push({
      text: symbols[Math.floor(Math.random() * symbols.length)],
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 12 + 10,
      speedY: Math.random() * 0.5 + 0.25,
      speedX: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.45 + 0.15,
      color: Math.random() > 0.4 ? '#38bdf8' : '#f59e0b'
    });
  }

  function renderParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.font = `bold ${p.size}px monospace`;
      ctx.fillText(p.text, p.x, p.y);

      p.y -= p.speedY;
      p.x += p.speedX;

      if (p.y < -20) {
        p.y = height + 20;
        p.x = Math.random() * width;
      }
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
    });
    requestAnimationFrame(renderParticles);
  }
  renderParticles();
}

// Real-Time Engineering Telemetry HUD (FPS, Latency, Calculations/Sec)
let frameCount = 0;
let lastFpsUpdate = performance.now();

function initTelemetryHUD() {
  const elLatency = document.getElementById('hud-latency');
  const elFps = document.getElementById('hud-fps');
  const elSpeed = document.getElementById('hud-calc-speed');

  // Live FPS Counter
  function trackFps(now) {
    frameCount++;
    if (now - lastFpsUpdate >= 600) {
      const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
      if (elFps) elFps.textContent = Math.min(60, Math.max(30, fps));
      frameCount = 0;
      lastFpsUpdate = now;
    }
    requestAnimationFrame(trackFps);
  }
  requestAnimationFrame(trackFps);

  // Live Latency Ping Telemetry
  setInterval(() => {
    if (elLatency) {
      const ping = Math.floor(Math.random() * 5) + 7; // 7ms - 12ms
      elLatency.textContent = `${ping}ms`;
    }
    if (elSpeed && isGameActive) {
      const speed = (Math.random() * 0.6 + 0.9).toFixed(1);
      elSpeed.textContent = `${speed}s/op`;
    }
  }, 2200);
}

// Fetch Server IP & Origin URL for QR Code Display
function fetchServerInfo() {
  // 1. Immediately set dynamic browser URL (e.g. https://your-game.onrender.com)
  const currentOrigin = window.location.origin;
  updateUrlAndQR(currentOrigin);

  // 2. If running locally on localhost, fetch local Wi-Fi IP for offline local network devices
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    fetch('/api/info')
      .then(res => res.json())
      .then(data => {
        if (data && data.ip && data.ip !== 'localhost') {
          updateUrlAndQR(`http://${data.ip}:${data.port}`);
        }
      })
      .catch(() => updateUrlAndQR(currentOrigin));
  }
}

function updateUrlAndQR(url) {
  const displayEl = document.getElementById('display-network-url');
  const displayLinkEl = document.getElementById('display-network-url-link');

  if (displayEl) {
    displayEl.textContent = url;
  }
  if (displayLinkEl) {
    displayLinkEl.href = url;
  }

  // Generate QR Code containing the origin link
  const qrcodeBox = document.getElementById('qrcode-box');
  if (qrcodeBox) {
    qrcodeBox.innerHTML = '';
    if (window.QRCode) {
      new QRCode(qrcodeBox, {
        text: url,
        width: 90,
        height: 90
      });
    }
  }
}

// Switch UI Screens
function showScreen(screenName) {
  Object.keys(views).forEach(name => {
    if (name === screenName) {
      views[name].classList.add('active');
    } else {
      views[name].classList.remove('active');
    }
  });
}

// Socket Connection & Listeners
function setupSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('Connected to server, socket ID:', socket.id);
    document.getElementById('network-status').className = 'status-badge';
    document.getElementById('status-text').textContent = 'Connected';
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    document.getElementById('network-status').className = 'status-badge disconnected';
    document.getElementById('status-text').textContent = 'Offline';
  });

  socket.on('room_created', (data) => {
    currentRoomCode = data.roomCode;
    playerNum = data.playerNum;
    isHost = true;

    document.getElementById('display-room-code').textContent = currentRoomCode;
    showScreen('waiting');
    updateWaitingLobbyUI(data.players || [{ playerNum: 1, id: socket.id }]);
  });

  socket.on('room_joined', (data) => {
    currentRoomCode = data.roomCode;
    playerNum = data.playerNum;
    isHost = false;

    document.getElementById('display-room-code').textContent = currentRoomCode;
    showScreen('waiting');
    updateWaitingLobbyUI(data.players || []);
  });

  socket.on('join_error', (data) => {
    alert(data.message || 'Error joining room.');
  });

  socket.on('players_updated', (data) => {
    updateWaitingLobbyUI(data.players || []);
  });

  socket.on('game_started', (data) => {
    isGameActive = true;
    currentAnswerInput = '';
    playSound('match_start');
    
    // Set Room Code on Game Screen Header
    document.getElementById('playing-room-code').textContent = currentRoomCode || '----';

    showScreen('game');

    // Update Initial Scores & Questions
    updateGameUI(data);

    // Setup Active Device Layout
    setupDeviceCards();
  });

  socket.on('timer_tick', (data) => {
    const mins = Math.floor(data.timeLeft / 60);
    const secs = data.timeLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById('game-timer').textContent = formatted;

    if (data.timeLeft <= 5 && data.timeLeft > 0) {
      playSound('tick_urgent');
    }
  });

  socket.on('answer_result', (data) => {
    const ansBox = document.getElementById(`ans-box-p${playerNum}`);
    
    if (data.isCorrect) {
      playSound('correct');
      triggerHaptic([30, 30, 60]);
      spawnFloatingParticle(`ans-box-p${playerNum}`, '+1 ⭐');

      ansBox.classList.add('correct-flash');
      setTimeout(() => ansBox.classList.remove('correct-flash'), 300);

      // Clear input & update question
      currentAnswerInput = '';
      updateInputDisplay(playerNum, '');
      if (data.nextQuestion) {
        document.getElementById(`q-text-p${playerNum}`).textContent = data.nextQuestion.questionText;
      }
    } else {
      playSound('wrong');
      triggerHaptic([120]);
      ansBox.classList.add('wrong-flash');
      setTimeout(() => ansBox.classList.remove('wrong-flash'), 400);

      currentAnswerInput = '';
      updateInputDisplay(playerNum, '');
    }
  });

  socket.on('game_update', (data) => {
    playSound('tug');
    const tugContainer = document.querySelector('.tug-visual-container');
    if (tugContainer) {
      tugContainer.classList.add('rope-pull-pulse');
      setTimeout(() => tugContainer.classList.remove('rope-pull-pulse'), 300);
    }
    updateGameUI(data);
  });

  socket.on('game_over', (data) => {
    isGameActive = false;
    showVictoryModal(data);
  });

  socket.on('game_reset', () => {
    modalGameOver.classList.remove('active');
    if (isHost) {
      showScreen('waiting');
    } else {
      showScreen('waiting');
    }
  });

  socket.on('player_typing_update', (data) => {
    updateInputDisplay(data.playerNum, data.text);
  });
}

// Update Waiting Lobby Slots & Start Game Button
function updateWaitingLobbyUI(players = []) {
  const slotP1Status = document.querySelector('#slot-p1 .p-status');
  const slotP2Status = document.getElementById('p2-status-label');
  const btnStart = document.getElementById('btn-start-game');

  const p1 = players.find(p => p.playerNum === 1);
  const p2 = players.find(p => p.playerNum === 2);

  if (p1) {
    slotP1Status.textContent = (p1.id === socket?.id) ? 'YOU (TEAM 1)' : 'TEAM 1 CONNECTED';
    slotP1Status.className = 'p-status ready';
  } else {
    slotP1Status.textContent = 'Waiting for player...';
    slotP1Status.className = 'p-status waiting';
  }

  if (p2) {
    slotP2Status.textContent = (p2.id === socket?.id) ? 'YOU (TEAM 2)' : 'TEAM 2 CONNECTED';
    slotP2Status.className = 'p-status ready';
  } else {
    slotP2Status.textContent = 'Waiting for player...';
    slotP2Status.className = 'p-status waiting';
  }

  if (isHost) {
    btnStart.style.display = 'inline-flex';
    if (players.length >= 2) {
      btnStart.disabled = false;
      btnStart.textContent = '▶ START GAME';
    } else {
      btnStart.disabled = true;
      btnStart.textContent = '⏳ WAITING FOR 2ND PLAYER...';
    }
  } else {
    btnStart.style.display = 'inline-flex';
    btnStart.disabled = true;
    btnStart.textContent = '⏳ WAITING FOR HOST TO START...';
  }
}

// Configure Player Cards based on whether single window host or multi-device player
function setupDeviceCards() {
  const card1 = document.getElementById('card-player-1');
  const card2 = document.getElementById('card-player-2');
  const arenaGrid = document.querySelector('.arena-grid');
  if (!card1 || !card2 || !arenaGrid) return;

  if (playerNum === 0) {
    // Spectator / Live Display Mode: show both cards
    document.getElementById('arena-status-text').textContent = '📺 LIVE DISPLAY SCREEN - WATCH THE DUEL!';
    arenaGrid.classList.add('show-dual');
    card1.classList.add('active-device-card');
    card2.classList.add('active-device-card');
  } else if (window.innerWidth <= 1100) {
    // Mobile/tablet device: show only the active player card
    arenaGrid.classList.remove('show-dual');
    card1.classList.remove('active-device-card');
    card2.classList.remove('active-device-card');

    if (playerNum === 2) {
      card2.classList.add('active-device-card');
    } else {
      // Default to Team 1 for Player 1 or host
      card1.classList.add('active-device-card');
    }
  } else {
    // Desktop layout: show both cards side-by-side
    arenaGrid.classList.add('show-dual');
    card1.classList.add('active-device-card');
    card2.classList.add('active-device-card');
  }
}

// Update UI elements during gameplay
function updateGameUI(data) {
  if (data.ropePosition !== undefined) {
    updateRopePosition(data.ropePosition);
  }

  if (data.players) {
    data.players.forEach(p => {
      // Top header scores
      document.getElementById(`top-score-p${p.playerNum}`).textContent = p.score;
      document.getElementById(`score-pill-p${p.playerNum}`).textContent = p.score;

      // Combo Pill
      const comboEl = document.getElementById(`combo-p${p.playerNum}`);
      if (p.combo >= 2) {
        comboEl.textContent = `COMBO x${p.combo}! 🔥`;
        comboEl.classList.add('active');
      } else {
        comboEl.classList.remove('active');
      }

      // Question Text for both cards
      if (p.currentQuestion) {
        document.getElementById(`q-text-p${p.playerNum}`).textContent = p.currentQuestion.questionText;
      }
    });
  }
}

// Animate Rope & SVG Graphics
function updateRopePosition(ropePos) {
  // ropePos ranges from -100 (P1 wins Left) to +100 (P2 wins Right)
  // SVG center is 400. Max displacement is ±220px.
  const displacement = (ropePos / 100) * 220;
  const tugGroup = document.getElementById('tug-dynamic-group');

  if (tugGroup) {
    tugGroup.style.transform = `translate(${displacement}px, 0)`;
  }

  // Update Meter Bar below arena
  // ropePos = -100 -> meter P1 = 100%, P2 = 0%
  const p1Width = 50 - (ropePos / 2);
  const p2Width = 50 + (ropePos / 2);

  document.getElementById('meter-p1').style.width = `${p1Width}%`;
  document.getElementById('meter-p2').style.width = `${p2Width}%`;
}

// UI Event Listeners
function setupEventListeners() {
  // Dynamic Window Resize Listener
  window.addEventListener('resize', setupDeviceCards);

  // Sound Toggle Button
  document.getElementById('btn-sound').addEventListener('click', (e) => {
    e.stopPropagation();
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    isSoundEnabled = !isSoundEnabled;
    document.getElementById('btn-sound').textContent = isSoundEnabled ? '🔊' : '🔇';
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(isSoundEnabled ? 0.95 : 0, audioCtx.currentTime);
    }
    if (bgmGain && audioCtx) {
      bgmGain.gain.setValueAtTime(isSoundEnabled ? 0.48 : 0, audioCtx.currentTime);
    }
    if (isSoundEnabled) {
      startExcitedBGM();
    } else {
      stopBGM();
    }
  });

  // Global Interaction Unmute Listener (ensures audio plays instantly upon any user interaction or movement)
  const globalUnmuteHandler = () => {
    if (!isSoundEnabled) return;
    initAudio().then(() => {
      if (audioCtx && audioCtx.state === 'running') {
        const loader = document.getElementById('cinematic-loader');
        if (!loader && isSoundEnabled && !isBgmPlaying) {
          startExcitedBGM();
        }
      }
    });
  };
  ['click', 'touchstart', 'pointerdown', 'keydown', 'mousemove', 'wheel', 'scroll'].forEach(evt => {
    window.addEventListener(evt, globalUnmuteHandler, { passive: true });
  });

  // Replay Shyam Cinematic Presentation
  const replayBtn = document.getElementById('btn-replay-intro');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      initAudio();
      stopBGM();
      triggerCinematicIntro(true);
    });
  }

  // Host Role Mode Card Toggles
  const btnModePlayer = document.getElementById('btn-mode-player');
  const btnModeSpectator = document.getElementById('btn-mode-spectator');
  const hostModeVal = document.getElementById('create-host-mode-val');

  if (btnModePlayer && btnModeSpectator) {
    btnModePlayer.addEventListener('click', () => {
      btnModePlayer.classList.add('active');
      btnModeSpectator.classList.remove('active');
      hostModeVal.value = 'player';
    });

    btnModeSpectator.addEventListener('click', () => {
      btnModeSpectator.classList.add('active');
      btnModePlayer.classList.remove('active');
      hostModeVal.value = 'spectator';
    });
  }

  // Create Room Form
  document.getElementById('form-create-room').addEventListener('submit', (e) => {
    e.preventDefault();
    initAudio();

    const hostMode = document.getElementById('create-host-mode-val').value;

    const options = {
      operation: document.getElementById('create-operation').value,
      difficulty: document.getElementById('create-difficulty').value,
      duration: document.getElementById('create-duration').value
    };

    socket.emit('create_room', {
      options,
      hostAsSpectator: (hostMode === 'spectator')
    });
  });

  // Join Room Form
  document.getElementById('form-join-room').addEventListener('submit', (e) => {
    e.preventDefault();
    initAudio();

    const code = document.getElementById('join-code-input').value;
    if (!code || code.length < 4) return alert('Enter valid 4-letter room code.');

    socket.emit('join_room', { roomCode: code });
  });

  // Join Spectator Button
  const btnSpectator = document.getElementById('btn-join-spectator');
  if (btnSpectator) {
    btnSpectator.addEventListener('click', () => {
      initAudio();
      const code = document.getElementById('join-code-input').value;
      if (!code || code.length < 4) return alert('Enter valid 4-letter room code.');

      socket.emit('join_spectator', { roomCode: code });
    });
  }

  // Copy Code Button
  document.getElementById('btn-copy-code').addEventListener('click', () => {
    if (currentRoomCode) {
      navigator.clipboard.writeText(currentRoomCode);
      alert(`Room code ${currentRoomCode} copied to clipboard!`);
    }
  });

  // Start Game Button (Host)
  document.getElementById('btn-start-game').addEventListener('click', () => {
    if (currentRoomCode && isHost) {
      socket.emit('start_game', { roomCode: currentRoomCode });
    }
  });

  // Leave Room Button
  document.getElementById('btn-leave-room').addEventListener('click', () => {
    location.reload();
  });

  // Keypad Click Listeners
  document.querySelectorAll('.keypad-grid').forEach(grid => {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.key-btn');
      if (!btn || !isGameActive) return;

      const targetCard = btn.closest('.player-card');
      const cardPlayerNum = targetCard.id === 'card-player-1' ? 1 : 2;

      // Allow typing on active player's card, or on both cards if local desktop dual view
      if (cardPlayerNum !== playerNum && window.innerWidth <= 992) return;

      playSound('beep');
      handleKeyInput(btn.dataset.val, cardPlayerNum);
    });
  });

  // Physical Keyboard Input Listener
  document.addEventListener('keydown', (e) => {
    if (!isGameActive) return;

    // Use current playerNum
    const pNum = playerNum || 1;

    if (e.key >= '0' && e.key <= '9') {
      playSound('beep');
      handleKeyInput(e.key, pNum);
    } else if (e.key === 'Backspace') {
      playSound('beep');
      handleKeyInput('clear', pNum);
    } else if (e.key === 'Enter') {
      playSound('beep');
      handleKeyInput('submit', pNum);
    }
  });

  // Victory Modal Actions
  document.getElementById('btn-play-again').addEventListener('click', () => {
    socket.emit('restart_game', { roomCode: currentRoomCode });
  });

  document.getElementById('btn-modal-lobby').addEventListener('click', () => {
    location.reload();
  });
}

// Handle Keypress / Button Presses
function handleKeyInput(val, targetPlayerNum) {
  if (val === 'clear') {
    currentAnswerInput = '';
    updateInputDisplay(targetPlayerNum, '');
    socket.emit('typing_sync', { roomCode: currentRoomCode, playerNum: targetPlayerNum, text: '' });
  } else if (val === 'submit') {
    if (currentAnswerInput !== '') {
      socket.emit('submit_answer', {
        roomCode: currentRoomCode,
        answer: currentAnswerInput
      });
    }
  } else {
    // Append Digit (Max 4 digits)
    if (currentAnswerInput.length < 4) {
      currentAnswerInput += val;
      updateInputDisplay(targetPlayerNum, currentAnswerInput);
      socket.emit('typing_sync', { roomCode: currentRoomCode, playerNum: targetPlayerNum, text: currentAnswerInput });
    }
  }
}

// Update text display in answer box
function updateInputDisplay(pNum, val) {
  document.getElementById(`ans-val-p${pNum}`).textContent = val;
}

// Show Game Over / Victory Modal
function showVictoryModal(data) {
  playSound('victory');

  // Trigger Confetti effect
  if (window.confetti) {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  }

  const titleEl = document.getElementById('victory-title');
  const reasonEl = document.getElementById('victory-reason');
  const emojiEl = document.getElementById('victory-emoji');

  if (data.winnerNum === 1) {
    titleEl.textContent = 'TEAM 1 (BLUE) WINS!';
    titleEl.style.color = 'var(--p1-blue-light)';
    emojiEl.textContent = '🏆';
  } else if (data.winnerNum === 2) {
    titleEl.textContent = 'TEAM 2 (RED) WINS!';
    titleEl.style.color = 'var(--p2-red-light)';
    emojiEl.textContent = '🏆';
  } else {
    titleEl.textContent = "IT'S A DRAW!";
    titleEl.style.color = 'var(--accent-gold)';
    emojiEl.textContent = '🤝';
  }

  reasonEl.textContent = data.reason === 'rope_win' 
    ? 'Outpulled the opponent in Tug of War!' 
    : 'Time expired - total scores decided the winner!';

  // Update Stats Breakdown
  if (data.stats) {
    data.stats.forEach(s => {
      document.getElementById(`stat-score-p${s.playerNum}`).textContent = s.score;
      document.getElementById(`stat-acc-p${s.playerNum}`).textContent = `${s.accuracy}%`;
      document.getElementById(`stat-combo-p${s.playerNum}`).textContent = s.highestCombo;
    });
  }

  // Engineering Performance Matrix Evaluation
  const engTitles = [
    "QUANTUM ALGORITHM MASTER 🚀",
    "TURING COMPUTE TITAN ⚡",
    "NEURAL VECTOR DYNAMO 🧠",
    "KINETIC MATH WIZARD ⚙️",
    "CYBER MECHANICS PRODIGY 🏆"
  ];
  const evalTitle = document.getElementById('eval-title');
  const evalIq = document.getElementById('eval-iq');
  const evalJoules = document.getElementById('eval-joules');

  if (evalTitle) {
    evalTitle.textContent = engTitles[Math.floor(Math.random() * engTitles.length)];
  }
  if (evalIq) {
    const s1 = data.stats && data.stats[0] ? data.stats[0].score : 0;
    const s2 = data.stats && data.stats[1] ? data.stats[1].score : 0;
    const topScore = Math.max(s1, s2);
    const iq = 135 + Math.min(30, topScore * 4);
    evalIq.textContent = `${iq} Bp`;
  }
  if (evalJoules) {
    const joules = Math.floor(Math.random() * 220) + 480;
    evalJoules.textContent = `${joules} J`;
  }

  modalGameOver.classList.add('active');
}

// Mobile Haptic Vibration Helper
function triggerHaptic(pattern = [20]) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
}

// Spawn Floating Particle Effect on Correct Score
function spawnFloatingParticle(elementId, text) {
  const target = document.getElementById(elementId);
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const particle = document.createElement('div');
  particle.className = 'floating-particle';
  particle.textContent = text;
  particle.style.left = `${rect.left + rect.width / 2 - 20}px`;
  particle.style.top = `${rect.top}px`;

  document.body.appendChild(particle);
  setTimeout(() => particle.remove(), 800);
}
