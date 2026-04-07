```bash
cd /backend

# Initialiser projet Node
npm init -y
Wrote to /home/rusty/Documents/Lucky7/lucky7-app/backend/package.json:

{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}

# Installer dépendances
npm install express socket.io cors dotenv mongoose

# Installer nodemon pour dev
npm install -D nodemon

# Créer structure de base
mkdir src
touch src/index.js
```

```javascript
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
```

Ajouter script dev
```json
    "dev": "nodemon src/index.js",
```