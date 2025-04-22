import Gameboard from './gameboard';

const Player = (type = 'human') => {
  const playerType = type;
  const gameboard = Gameboard(); // Each player gets their own gameboard

  const getType = () => playerType;

  // --- Attack Logic ---

  // Generic attack function, used by human or could be called by computer logic
  const attack = (row, col, enemyBoard) => {
    // Player executes an attack on the enemy's board
    // The result (hit/miss) is determined by the enemy board
    return enemyBoard.receiveAttack(row, col);
  };

  // Computer-specific attack logic
  const computerAttack = (enemyBoard) => {
    if (playerType !== 'computer') {
      throw new Error('Only computer players can use computerAttack');
    }

    let row, col;
    let validAttack = false;
    const boardSize = 10; // Assuming 10x10, get dynamically if needed
    let attempts = 0;
    const maxAttempts = boardSize * boardSize * 2; // Safety break for potential infinite loop

    // Keep trying random coordinates until an unattacked one is found
    // We rely on the enemyBoard's hasBeenAttacked method (mocked in tests)
    while (!validAttack && attempts < maxAttempts) {
      row = Math.floor(Math.random() * boardSize);
      col = Math.floor(Math.random() * boardSize);

      // Check if the spot has already been attacked *on the enemy board*
      // Need to ensure the mocked object in tests has this method
      if (enemyBoard.isValidCoordinate(row, col) && !enemyBoard.hasBeenAttacked(row, col)) {
        validAttack = true;
      } 
      attempts++;
    }

    if (!validAttack) {
        // This should only happen if the board is full or something went wrong
        console.error("Computer couldn't find a valid move!");
        // Handle this case - maybe return a specific value or throw error
        // depending on game rules for a full board scenario.
        return null; // Or throw new Error('No valid moves left');
    }

    // Execute the attack on the valid coordinates
    return attack(row, col, enemyBoard);
  };

  // --- Public Interface ---
  return {
    getType,
    gameboard, // Expose the player's own gameboard
    attack, // Human uses this directly
    computerAttack, // Computer uses this
  };
};

export default Player; 