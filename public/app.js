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

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    
    // Dynamics Compressor for punchy, clean cinematic acoustics
    masterCompressor = audioCtx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
    masterCompressor.knee.setValueAtTime(30, audioCtx.currentTime);
    masterCompressor.ratio.setValueAtTime(6, audioCtx.currentTime);
    masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    masterCompressor.release.setValueAtTime(0.25, audioCtx.currentTime);
    
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(isSoundEnabled ? 0.85 : 0, audioCtx.currentTime);
    
    masterGain.connect(masterCompressor);
    masterCompressor.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
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

// Epic Blockbuster Movie Intro Soundtrack (Braaam horn, Timpani, Shyam Fanfare, Title Slam)
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
  initCinematicLoader();
  setupSocket();
  setupEventListeners();
  fetchServerInfo();
});

// Cinematic Presentation Loader Logic (Presented By Shyam)
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
      <div class="loader-content">
        <div class="present-tag animate-fade-in">A SPECIAL PRESENTATION</div>
        <div class="creator-reveal">
          <span class="sub-text">PRESENTED BY</span>
          <h1 class="creator-name animate-glow-text">SHYAM</h1>
        </div>
        <div class="rope-loader-animation">
          <div class="rope-track">
            <div class="rope-line-glow"></div>
            <div class="knot-pulse"></div>
          </div>
        </div>
        <div class="loader-game-title">
          <span class="mini-tag">ENTER THE DUEL</span>
          <h2 class="epic-title">TUG OF WAR <span class="math-glow">MATHEMATICS</span></h2>
        </div>
        <button class="loader-play-sound-btn pulse-glow" id="loader-start-sound-btn">
          <span class="btn-sound-wave">🔊</span>
          <span>REPLAY WITH SOUND</span>
        </button>
        <div class="sound-cue-pill" id="loader-audio-cue">
          <span class="sound-wave-icon">🎵</span>
          <span>CLICK ANYWHERE TO HEAR SOUNDTRACK</span>
        </div>
        <div class="loading-bar-wrap">
          <div class="loading-bar-fill" id="loader-fill"></div>
        </div>
        <span class="loading-status-text" id="loader-status">PRESENTED BY SHYAM...</span>
        <button id="btn-skip-intro" class="skip-intro-btn">SKIP ⏭</button>
      </div>
    `;
    document.body.appendChild(tempDiv);
    loaderOverlay = tempDiv;
  }

  if (!loaderOverlay) return;

  loaderOverlay.classList.remove('fade-out');
  const fillBar = document.getElementById('loader-fill');
  const statusText = document.getElementById('loader-status');
  const soundBtn = document.getElementById('loader-start-sound-btn');
  const soundCue = document.getElementById('loader-audio-cue');
  const skipBtn = document.getElementById('btn-skip-intro');

  let hasStartedAudio = false;

  function startSoundSequence() {
    if (hasStartedAudio) return;
    hasStartedAudio = true;
    initAudio();
    playCinematicIntroSound();
    if (soundBtn) {
      soundBtn.innerHTML = '<span class="btn-sound-wave">🎶</span><span>SOUNDTRACK PLAYING...</span>';
      soundBtn.style.pointerEvents = 'none';
      soundBtn.classList.remove('pulse-glow');
    }
    if (soundCue) {
      soundCue.innerHTML = '<span>✨ SOUNDTRACK SYNCHRONIZED</span>';
    }

    // Sync status and progress with audio timeline (~4.5 seconds)
    const milestones = [
      { p: 15, t: "INITIALIZING AUDIO ENGINE...", delay: 200 },
      { p: 35, t: "CINEMATIC BRASS SWELL...", delay: 600 },
      { p: 65, t: "PRESENTED BY SHYAM...", delay: 1300 },
      { p: 85, t: "CHARGING MATHEMATICS ARENA...", delay: 2500 },
      { p: 95, t: "TUG OF WAR READY...", delay: 3200 },
      { p: 100, t: "WELCOME TO THE DUEL!", delay: 4200 },
    ];

    milestones.forEach(m => {
      setTimeout(() => {
        if (fillBar) fillBar.style.width = m.p + '%';
        if (statusText) statusText.textContent = m.t;
      }, m.delay);
    });

    setTimeout(dismissLoader, 4800);
  }

  function dismissLoader() {
    if (cinematicTimer) clearTimeout(cinematicTimer);
    loaderOverlay.classList.add('fade-out');
    setTimeout(() => {
      loaderOverlay.remove();
    }, 850);
  }

  // Attempt autoplay immediately if browser allows
  try {
    initAudio();
    if (audioCtx && audioCtx.state === 'running') {
      startSoundSequence();
    }
  } catch(e) {}

  if (soundBtn) {
    soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startSoundSequence();
    });
  }

  if (soundCue) {
    soundCue.addEventListener('click', (e) => {
      e.stopPropagation();
      startSoundSequence();
    });
  }

  loaderOverlay.addEventListener('click', () => {
    startSoundSequence();
  });

  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissLoader();
    });
  }

  // If force replay, start sound immediately
  if (forceReplay) {
    startSoundSequence();
  } else {
    // If user is idle after 7 seconds without interaction, smoothly transition
    cinematicTimer = setTimeout(() => {
      if (!hasStartedAudio) {
        dismissLoader();
      }
    }, 7000);
  }
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

  if (playerNum === 0) {
    // Spectator / Live Display Mode
    document.getElementById('arena-status-text').textContent = '📺 LIVE LAPTOP DISPLAY - WATCH THE DUEL!';
    arenaGrid.classList.add('show-dual');
    card1.classList.add('active-device-card');
    card2.classList.add('active-device-card');
  } else if (window.innerWidth <= 992) {
    // Mobile device: show active player card only
    card1.classList.remove('active-device-card');
    card2.classList.remove('active-device-card');

    if (playerNum === 1) {
      card1.classList.add('active-device-card');
    } else {
      card2.classList.add('active-device-card');
    }
  } else {
    // Desktop layout: show both cards
    arenaGrid.classList.add('show-dual');
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
  // Sound Toggle
  document.getElementById('btn-sound').addEventListener('click', () => {
    initAudio();
    isSoundEnabled = !isSoundEnabled;
    document.getElementById('btn-sound').textContent = isSoundEnabled ? '🔊' : '🔇';
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(isSoundEnabled ? 0.85 : 0, audioCtx.currentTime);
    }
  });

  // Replay Shyam Cinematic Presentation
  const replayBtn = document.getElementById('btn-replay-intro');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      initAudio();
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
