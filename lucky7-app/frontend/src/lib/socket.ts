import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

// Singleton partagé côté client
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = new URL(BACKEND_URL);
    const hasPath = url.pathname && url.pathname !== '/';
    // Quand le backend est derrière un reverse proxy avec un préfixe (ex: /Lucky7-api),
    // socket.io-client interprète ce préfixe comme un namespace, pas un path.
    // On extrait donc l'origine et on construit le path socket.io manuellement.
    socket = io(url.origin, {
      path: hasPath ? url.pathname.replace(/\/$/, '') + '/socket.io' : '/socket.io',
      autoConnect: false,
    });
  }
  return socket;
}
