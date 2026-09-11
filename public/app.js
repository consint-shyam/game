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
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Procedural Sound Effects
function playSound(type) {
  if (!isSoundEnabled) return;
  try {
    initAudio();
    const now = audioCtx.currentTime;

    if (type === 'beep') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'correct') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc2.frequency.setValueAtTime(1046.50, now + 0.16); // C6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } else if (type === 'wrong') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'tug') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'victory') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
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
  setupSocket();
  setupEventListeners();
  fetchServerInfo();
});

// Fetch Server IP & Origin URL for QR Code Display
function fetchServerInfo() {
  let targetUrl = window.location.origin;

  // If running locally on localhost, attempt fetching local Wi-Fi IP for local network devices
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    fetch('/api/info')
      .then(res => res.json())
      .then(data => {
        if (data && data.ip && data.ip !== 'localhost') {
          targetUrl = `http://${data.ip}:${data.port}`;
        }
        updateUrlAndQR(targetUrl);
      })
      .catch(() => updateUrlAndQR(window.location.origin));
  } else {
    // Deployed online (e.g. Render, Railway, Vercel): ALWAYS use window.location.origin!
    updateUrlAndQR(window.location.origin);
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
    isSoundEnabled = !isSoundEnabled;
    document.getElementById('btn-sound').textContent = isSoundEnabled ? '🔊' : '🔇';
  });

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
