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
  static readonly HAND_Y = 770; // Player A hand (bottom)
  static readonly HAND_Y_PLAYER_B = 85; // Player B hand (top)
  static readonly HAND_START_X = 220;
  static readonly CARD_SPACING = 130;

  // Deck visualization - Left side layout
  static readonly DECK_A_X = 90;
  static readonly DECK_A_Y = 680;
  static readonly DISCARD_A_X = 90;
  static readonly DISCARD_A_Y = 550;
  
  // Deck visualization - Right side layout
  static readonly DECK_B_X = 1110;
  static readonly DECK_B_Y = 175;
  static readonly DISCARD_B_X = 1110;
  static readonly DISCARD_B_Y = 305;

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
  static readonly TITLE_Y = 25;
  static readonly INSTRUCTION_X = 600;
  static readonly INSTRUCTION_Y = 650;
  static readonly PHASE_INDICATOR_X = 1110;
  static readonly PHASE_INDICATOR_Y = 450;
}
