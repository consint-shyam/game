const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Helper to get local IP address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
const LOCAL_IP = getLocalIp();

// In-memory rooms storage
const rooms = {};

// Helper: Generate Random 4-character Room Code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms[code]);
  return code;
}

// Math Question Generator
function generateQuestion(operation = 'mixed', difficulty = 'medium') {
  let ops = ['+', '-', '×'];
  if (operation === 'add') ops = ['+'];
  else if (operation === 'sub') ops = ['-'];
  else if (operation === 'mul') ops = ['×'];
  else if (operation === 'div') ops = ['÷'];
  else if (operation === 'mixed') ops = ['+', '-', '×', '÷'];

  const selectedOp = ops[Math.floor(Math.random() * ops.length)];
  let num1 = 1, num2 = 1, answer = 2;

  let maxRange = 10;
  if (difficulty === 'easy') maxRange = 10;
  else if (difficulty === 'medium') maxRange = 20;
  else if (difficulty === 'hard') maxRange = 50;

  switch (selectedOp) {
    case '+':
      num1 = Math.floor(Math.random() * maxRange) + 1;
      num2 = Math.floor(Math.random() * maxRange) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * maxRange) + 2;
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // avoid negative answers for young players
      answer = num1 - num2;
      break;
    case '×':
      const mulMax = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 12;
      num1 = Math.floor(Math.random() * mulMax) + 1;
      num2 = Math.floor(Math.random() * mulMax) + 1;
      answer = num1 * num2;
      break;
    case '÷':
      const divMax = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 12;
      num2 = Math.floor(Math.random() * divMax) + 1;
      answer = Math.floor(Math.random() * divMax) + 1;
      num1 = num2 * answer; // ensures exact division
      break;
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    num1,
    num2,
    op: selectedOp,
    questionText: `${num1} ${selectedOp} ${num2} = ?`,
    answer: answer
  };
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', ({ options, hostAsSpectator }) => {
    const roomCode = generateRoomCode();
    const roomOptions = {
      operation: options?.operation || 'mixed',
      difficulty: options?.difficulty || 'medium',
      gameMode: options?.gameMode || 'timer',
      duration: options?.duration ? parseInt(options.duration) : 60,
      maxRopeTug: 100,
      isLiveDisplay: !!hostAsSpectator
    };

    const initialPlayers = [];
    if (!hostAsSpectator) {
      initialPlayers.push({
        id: socket.id,
        playerNum: 1,
        name: 'Team 1',
        score: 0,
        combo: 0,
        highestCombo: 0,
        totalAnswered: 0,
        correctAnswered: 0,
        currentQuestion: generateQuestion(roomOptions.operation, roomOptions.difficulty)
      });
    }

    rooms[roomCode] = {
      code: roomCode,
      hostId: socket.id,
      options: roomOptions,
      state: 'waiting', // 'waiting', 'playing', 'ended'
      players: initialPlayers,
      spectators: hostAsSpectator ? [socket.id] : [],
      ropePosition: 0, // -100 (Team 1 wins) to +100 (Team 2 wins)
      timeLeft: roomOptions.duration,
      timerInterval: null,
      winner: null
    };

    socket.join(roomCode);
    socket.emit('room_created', {
      roomCode,
      playerNum: hostAsSpectator ? 0 : 1, // 0 means Spectator / Display Screen
      isSpectator: !!hostAsSpectator,
      options: roomOptions,
      serverIp: LOCAL_IP,
      port: PORT,
      players: rooms[roomCode].players.map(p => ({ id: p.id, playerNum: p.playerNum, name: p.name }))
    });

    console.log(`Room created: ${roomCode} by ${socket.id} (Spectator Host: ${hostAsSpectator})`);
  });

  // Join Room as Player
  socket.on('join_room', ({ roomCode }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms[code];

    if (!room) {
      return socket.emit('join_error', { message: 'Room code not found.' });
    }

    if (room.players.length >= 2) {
      return socket.emit('join_error', { message: 'Room is full for players (2 players max).' });
    }

    if (room.state !== 'waiting') {
      return socket.emit('join_error', { message: 'Game already in progress.' });
    }

    const assignedNum = room.players.length === 0 ? 1 : 2;

    const newPlayer = {
      id: socket.id,
      playerNum: assignedNum,
      name: `Team ${assignedNum}`,
      score: 0,
      combo: 0,
      highestCombo: 0,
      totalAnswered: 0,
      correctAnswered: 0,
      currentQuestion: generateQuestion(room.options.operation, room.options.difficulty)
    };

    room.players.push(newPlayer);
    socket.join(code);

    const playersList = room.players.map(p => ({ id: p.id, playerNum: p.playerNum, name: p.name }));

    socket.emit('room_joined', {
      roomCode: code,
      playerNum: assignedNum,
      isSpectator: false,
      options: room.options,
      playersCount: room.players.length,
      players: playersList
    });

    io.to(code).emit('players_updated', {
      playersCount: room.players.length,
      players: playersList
    });

    console.log(`Socket ${socket.id} joined room ${code} as Player ${assignedNum}`);
  });

  // Join Room as Live Display / Spectator
  socket.on('join_spectator', ({ roomCode }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms[code];

    if (!room) {
      return socket.emit('join_error', { message: 'Room code not found.' });
    }

    if (!room.spectators) room.spectators = [];
    room.spectators.push(socket.id);
    socket.join(code);

    socket.emit('room_joined', {
      roomCode: code,
      playerNum: 0,
      isSpectator: true,
      options: room.options,
      playersCount: room.players.length,
      state: room.state
    });

    // If game is active, send current live state immediately
    if (room.state === 'playing') {
      socket.emit('game_started', {
        options: room.options,
        ropePosition: room.ropePosition,
        timeLeft: room.timeLeft,
        players: room.players.map(p => ({
          playerNum: p.playerNum,
          name: p.name,
          score: p.score,
          combo: p.combo,
          question: p.currentQuestion
        }))
      });
    }

    console.log(`Socket ${socket.id} joined room ${code} as Spectator/Live Screen`);
  });

  // Live Typing Broadcast
  socket.on('typing_sync', ({ roomCode, playerNum, text }) => {
    socket.to(roomCode).emit('player_typing_update', { playerNum, text });
  });

  // Start Game
  socket.on('start_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;

    if (room.players.length < 2) {
      return socket.emit('error_msg', 'Need 2 players to start!');
    }

    room.state = 'playing';
    room.ropePosition = 0;
    room.timeLeft = room.options.duration;
    room.winner = null;

    room.players.forEach(p => {
      p.score = 0;
      p.combo = 0;
      p.highestCombo = 0;
      p.totalAnswered = 0;
      p.correctAnswered = 0;
      p.currentQuestion = generateQuestion(room.options.operation, room.options.difficulty);
    });

    // Broadcast Game Started
    io.to(roomCode).emit('game_started', {
      options: room.options,
      ropePosition: room.ropePosition,
      timeLeft: room.timeLeft,
      players: room.players.map(p => ({
        playerNum: p.playerNum,
        name: p.name,
        score: p.score,
        combo: p.combo,
        question: p.currentQuestion
      }))
    });

    // Start Timer Interval if gameMode is 'timer'
    if (room.timerInterval) clearInterval(room.timerInterval);

    if (room.options.gameMode === 'timer') {
      room.timerInterval = setInterval(() => {
        room.timeLeft--;
        
        io.to(roomCode).emit('timer_tick', { timeLeft: room.timeLeft });

        if (room.timeLeft <= 0) {
          clearInterval(room.timerInterval);
          endGame(roomCode, 'time_up');
        }
      }, 1000);
    }
  });

  // Submit Answer
  socket.on('submit_answer', ({ roomCode, answer }) => {
    const room = rooms[roomCode];
    if (!room || room.state !== 'playing') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.currentQuestion) return;

    const submittedVal = parseInt(answer, 10);
    const isCorrect = submittedVal === player.currentQuestion.answer;

    player.totalAnswered++;

    if (isCorrect) {
      player.score += 1;
      player.correctAnswered++;
      player.combo += 1;
      if (player.combo > player.highestCombo) player.highestCombo = player.combo;

      // Tug Force Calculation
      const baseTug = 8;
      const comboBonus = Math.min(player.combo * 2, 10);
      const totalTug = baseTug + comboBonus;

      // Team 1 pulls Left (-), Team 2 pulls Right (+)
      if (player.playerNum === 1) {
        room.ropePosition = Math.max(-100, room.ropePosition - totalTug);
      } else {
        room.ropePosition = Math.min(100, room.ropePosition + totalTug);
      }

      // Generate New Question
      player.currentQuestion = generateQuestion(room.options.operation, room.options.difficulty);

      // Check early rope win condition
      if (room.ropePosition <= -100) {
        endGame(roomCode, 'rope_win', 1);
        return;
      } else if (room.ropePosition >= 100) {
        endGame(roomCode, 'rope_win', 2);
        return;
      }
    } else {
      player.combo = 0;
    }

    // Send answer response to triggering player
    socket.emit('answer_result', {
      isCorrect,
      score: player.score,
      combo: player.combo,
      nextQuestion: isCorrect ? player.currentQuestion : null
    });

    // Broadcast state update to room
    io.to(roomCode).emit('game_update', {
      ropePosition: room.ropePosition,
      players: room.players.map(p => ({
        playerNum: p.playerNum,
        name: p.name,
        score: p.score,
        combo: p.combo,
        currentQuestion: p.currentQuestion
      }))
    });
  });

  // Restart Game
  socket.on('restart_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.state = 'waiting';
    room.ropePosition = 0;
    room.timeLeft = room.options.duration;
    
    io.to(roomCode).emit('game_reset', {
      options: room.options,
      playersCount: room.players.length
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    for (const code in rooms) {
      const room = rooms[code];
      const pIndex = room.players.findIndex(p => p.id === socket.id);
      if (pIndex !== -1) {
        room.players.splice(pIndex, 1);
        if (room.timerInterval) clearInterval(room.timerInterval);
        
        if (room.players.length === 0) {
          delete rooms[code];
          console.log(`Room ${code} deleted (empty).`);
        } else {
          io.to(code).emit('player_left', {
            message: 'Player disconnected.',
            playersCount: room.players.length
          });
          room.state = 'waiting';
        }
        break;
      }
    }
  });
});

// Helper: End Game Function
function endGame(roomCode, reason, winnerNum = null) {
  const room = rooms[roomCode];
  if (!room) return;

  if (room.timerInterval) clearInterval(room.timerInterval);
  room.state = 'ended';

  if (!winnerNum) {
    // Determine winner by rope position or score
    if (room.ropePosition < 0) winnerNum = 1;
    else if (room.ropePosition > 0) winnerNum = 2;
    else {
      // Tie breaker by score
      const p1 = room.players.find(p => p.playerNum === 1);
      const p2 = room.players.find(p => p.playerNum === 2);
      if (p1 && p2) {
        if (p1.score > p2.score) winnerNum = 1;
        else if (p2.score > p1.score) winnerNum = 2;
        else winnerNum = 0; // Draw
      }
    }
  }

  room.winner = winnerNum;

  io.to(roomCode).emit('game_over', {
    reason,
    winnerNum,
    ropePosition: room.ropePosition,
    stats: room.players.map(p => ({
      playerNum: p.playerNum,
      name: p.name,
      score: p.score,
      highestCombo: p.highestCombo,
      accuracy: p.totalAnswered > 0 ? Math.round((p.correctAnswered / p.totalAnswered) * 100) : 0
    }))
  });
}

// API endpoint to retrieve connection info
app.get('/api/info', (req, res) => {
  res.json({ ip: LOCAL_IP, port: PORT });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(`  Tug of War Math Server running!`);
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Network: http://${LOCAL_IP}:${PORT}`);
  console.log(`===================================================`);
});
