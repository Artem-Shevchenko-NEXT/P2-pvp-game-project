// File to be used for configuring re-used variables in one central place, in order to avoid "magic numbers" and improve readability.

// Variables for the resolution of the game window:
    // Original: 816x600
    // For now is 816x600 also the minimum size allowed in order to work with the dynamic re-scaling of tiles.
export const SCREEN_WIDTH = 1032;
export const SCREEN_HEIGHT = 768;

// Variables for player 1 spawn point coordinates.
    // In Phaser (0,0) is the top left corner.
export const PLAYER1_SPAWN_X = 100;
export const PLAYER1_SPAWN_Y = 450;