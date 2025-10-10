/**
 * Central configuration file for game constants.
 * Following Clean Code principle: magic numbers should be named constants.
 */
export class GameConfig {
  // Grid configuration
  static readonly GRID_COLS = 12;
  static readonly GRID_ROWS = 14;
  static readonly CELL_SIZE = 40;
  static readonly GRID_OFFSET_X = 200;
  static readonly GRID_OFFSET_Y = 100;

  // Hand configuration
  static readonly HAND_SIZE = 6;
  static readonly HAND_Y = 780; // Player A hand (bottom)
  static readonly HAND_Y_PLAYER_B = 80; // Player B hand (top)
  static readonly HAND_START_X = 250;
  static readonly CARD_SPACING = 130;

  // Deck visualization
  static readonly DECK_X = 900;
  static readonly DECK_Y = 400; // Player A deck
  static readonly DECK_Y_PLAYER_B = 300; // Player B deck
  static readonly DISCARD_X = 900;
  static readonly DISCARD_Y = 200; // Player A discard
  static readonly DISCARD_Y_PLAYER_B = 500; // Player B discard

  // Player territory configuration
  static readonly PLAYER_A_TERRITORY_ROWS = [0, 1, 2]; // Bottom 3 rows
  static readonly PLAYER_B_TERRITORY_ROWS = [11, 12, 13]; // Top 3 rows

  // Colors
  static readonly PLAYER_A_COLOR = 0x4a6fa5; // Blue
  static readonly PLAYER_B_COLOR = 0x7a3a3a; // Red
  static readonly NEUTRAL_TERRITORY_COLOR = 0x333333;
  static readonly PLAYER_A_TERRITORY_COLOR = 0x3a5a7a;
  static readonly PLAYER_B_TERRITORY_COLOR = 0x7a3a3a;

  // UI positioning
  static readonly TITLE_X = 600;
  static readonly TITLE_Y = 30;
  static readonly INSTRUCTION_X = 600;
  static readonly INSTRUCTION_Y = 650;
}
