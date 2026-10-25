const path = require('node:path');
const http = require('node:http');
const express = require('express');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const publicDir = path.join(__dirname, 'public');

app.use(express.json({ limit: '8kb' }));
app.use(express.static(publicDir));
app.get('/', (_req, res) => res.redirect('/admin'));
app.get('/admin', (_req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
app.get('/overlay', (_req, res) => res.sendFile(path.join(publicDir, 'overlay.html')));
app.get('/health', (_req, res) => res.json({ ok: true }));

let liveConnection = null;
let liveHandle = '';
let status = { connected: false, connecting: false, message: 'Informe o @ da conta que está ao vivo.' };
let votes = { '13': 0, '22': 0 };
const ballots = new Map();

function snapshot() {
  return {
    status,
    handle: liveHandle,
    votes: { ...votes },
    total: votes['13'] + votes['22'],
    uniqueVoters: ballots.size
  };
}
function publish() { io.emit('poll:state', snapshot()); }
function resetVotes() { votes = { '13': 0, '22': 0 }; ballots.clear(); }
function normalizeHandle(input) {
  return String(input || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '')
    .replace(/^@/, '')
    .replace(/\/live.*$/i, '')
    .replace(/\/$/, '');
}
function publicError(error) {
  return error && error.message ? String(error.message).slice(0, 240) : 'Não foi possível conectar à live.';
}
function handleChat(data) {
  const choice = String(data.comment || '').trim();
  if (choice !== '13' && choice !== '22') return;
  const voterId = String(data.userId || data.uniqueId || '').trim();
  if (!voterId) return;

  const previous = ballots.get(voterId);
  if (previous === choice) return;
  if (previous) votes[previous] = Math.max(0, votes[previous] - 1);
  ballots.set(voterId, choice);
  votes[choice] += 1;
  publish();
}

app.post('/api/connect', async (req, res) => {
  const requestedHandle = normalizeHandle(req.body && req.body.handle);
  if (!/^[a-zA-Z0-9._]{2,24}$/.test(requestedHandle)) {
    return res.status(400).json({ error: 'Digite apenas o @usuário da conta que está ao vivo.' });
  }

  if (liveConnection) {
    try { liveConnection.disconnect(); } catch {}
    liveConnection = null;
  }
  if (requestedHandle !== liveHandle) resetVotes();
  liveHandle = requestedHandle;
  status = { connected: false, connecting: true, message: `Conectando à live de @${liveHandle}…` };
  publish();

  const connection = new WebcastPushConnection(liveHandle, { processInitialData: false });
  liveConnection = connection;
  connection.on('chat', handleChat);
  connection.on('disconnected', () => {
    if (liveConnection !== connection) return;
    liveConnection = null;
    status = { connected: false, connecting: false, message: 'A conexão com a live foi encerrada.' };
    publish();
  });
  connection.on('error', (error) => {
    if (liveConnection !== connection) return;
    status = { connected: false, connecting: false, message: `Erro na conexão: ${publicError(error)}` };
    publish();
  });

  try {
    await connection.connect();
    if (liveConnection !== connection) return res.status(409).json({ error: 'A conexão foi substituída.' });
    status = { connected: true, connecting: false, message: `Conectado à live de @${liveHandle}.` };
    publish();
    return res.json({ ok: true, state: snapshot() });
  } catch (error) {
    if (liveConnection === connection) liveConnection = null;
    status = { connected: false, connecting: false, message: `Não conectou: ${publicError(error)}` };
    publish();
    return res.status(502).json({ error: status.message });
  }
});

app.post('/api/stop', (_req, res) => {
  if (liveConnection) {
    try { liveConnection.disconnect(); } catch {}
    liveConnection = null;
  }
  status = { connected: false, connecting: false, message: 'Desconectado.' };
  publish();
  res.json({ ok: true, state: snapshot() });
});

app.post('/api/reset', (_req, res) => {
  resetVotes();
  publish();
  res.json({ ok: true, state: snapshot() });
});

io.on('connection', (socket) => socket.emit('poll:state', snapshot()));
server.listen(PORT, HOST, () => {
  console.log(`Painel: http://${HOST}:${PORT}/admin`);
  console.log(`Overlay: http://${HOST}:${PORT}/overlay`);
});
