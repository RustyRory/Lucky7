const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // changer pour ton front en prod
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
// LANCEMENT SERVEUR
// --------------------
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend lancé sur http://localhost:${PORT}`));