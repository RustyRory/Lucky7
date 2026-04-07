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
// ROUTE TEST
// --------------------
app.get('/', (req, res) => {
  res.json({ message: 'API Lucky7 fonctionnelle !' });
});

// --------------------
// SOCKET.IO
// --------------------
io.on('connection', (socket) => {
  console.log('Un joueur connecté :', socket.id);

  socket.on('disconnect', () => {
    console.log('Joueur déconnecté :', socket.id);
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