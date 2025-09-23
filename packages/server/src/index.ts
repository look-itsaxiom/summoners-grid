import { Server } from 'colyseus';
import { createServer } from 'http';
import express from 'express';
import { GameRoom } from './rooms/GameRoom';

const port = Number(process.env.PORT) || 2567;

const app = express();
app.use(express.json());

const gameServer = new Server({
  server: createServer(app),
});

// Define "game" room
gameServer.define('game', GameRoom);

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
