import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // à sécuriser en prod
    methods: ['GET', 'POST']
  }
});

// --------------------
// ÉTAT EN MÉMOIRE
// --------------------

/** @type {Map<string, { id: string, pseudo: string }>} */
const players = new Map();

function broadcastPlayersList() {
  io.emit('players:list', Array.from(players.values()));
}

// --------------------
// ROUTE TEST
// --------------------
app.get('/', (req, res) => {
  res.json({ message: 'API Lucky7 fonctionnelle !' });
});

// --------------------
// SOCKET.IO
// --------------------
io.on('connection', (socket) => {
  console.log('Connexion socket :', socket.id);

  // Envoyer la liste actuelle au nouveau connecté
  socket.emit('players:list', Array.from(players.values()));

  // Un joueur rejoint la partie avec un pseudo
  socket.on('player:join', (pseudo, callback) => {
    const trimmed = (pseudo ?? '').trim();

    if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
      return callback?.({ error: 'Pseudo invalide (2 à 20 caractères).' });
    }

    const alreadyTaken = Array.from(players.values()).some(
      (p) => p.pseudo.toLowerCase() === trimmed.toLowerCase()
    );

    if (alreadyTaken) {
      return callback?.({ error: 'Ce pseudo est déjà pris.' });
    }

    const player = { id: socket.id, pseudo: trimmed };
    players.set(socket.id, player);

    console.log(`✅ Joueur rejoint : ${trimmed} (${socket.id})`);
    broadcastPlayersList();
    callback?.({ player });
  });

  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      console.log(`❌ Joueur parti : ${player.pseudo} (${socket.id})`);
      players.delete(socket.id);
      broadcastPlayersList();
    }
  });
});

// --------------------
// MONGODB + START SERVER
// --------------------
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'localhost';

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    server.listen(PORT, () =>
      console.log(`🚀 Backend lancé sur http://${HOST}:${PORT}`)
    );
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB :', error);
    process.exit(1);
  }
};

startServer();
