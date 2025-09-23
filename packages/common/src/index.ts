import { Schema, MapSchema, type } from '@colyseus/schema';

export const BOARD_WIDTH = 12;
export const BOARD_HEIGHT = 14;
export const TILE_SIZE = 40;

export class Player extends Schema {
  @type('string') name: string = 'Anonymous';
  @type('boolean') connected: boolean = true;
}

export class GameState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();
}
