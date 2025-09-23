import { Room, Client } from 'colyseus';
import { GameState, Player } from '@summoners-grid/common';

export class GameRoom extends Room<GameState> {
  onCreate(options: any) {
    this.setState(new GameState());
    console.log('GameRoom created!');

    this.onMessage('ping', (client) => {
      console.log('ping received from', client.sessionId);
      client.send('pong');
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');
    const player = new Player();
    player.name = options.name || 'Anonymous';
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);
      console.log(client.sessionId, 'left!');
    }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }
}
