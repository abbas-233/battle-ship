import Gameboard from './gameboard.js';

const Player = (type = 'human') => {
  const playerType = type;
  const gameboard = Gameboard(); // Each player gets their own gameboard
  let availableAttacks = null; // For computer AI
  let potentialTargets = []; // For smarter AI - coords adjacent to hits

  const getType = () => playerType;

  // --- Attack Logic ---
  const attack = (row, col, enemyBoard) => {
    // Human attack: simply calls receiveAttack on enemy board
    if (playerType !== 'human') {
        throw new Error('Only human players use attack() directly.')
    }
    return enemyBoard.receiveAttack(row, col);
  };

  // --- Computer AI Attack Logic ---

  // Initialize or reset the list of available coordinates to attack
  const initializeAvailableAttacks = (boardSize = 10) => {
    availableAttacks = new Set();
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            availableAttacks.add(`${r},${c}`);
        }
    }
    potentialTargets = []; // Reset potential targets too
  };

  // Get a random coordinate from the available set
  const getRandomAttackCoords = (enemyBoard) => {
    if (availableAttacks === null) {
        initializeAvailableAttacks();
    }

    if (availableAttacks.size === 0) {
        console.error("Computer has no available moves left!");
        return { row: null, col: null }; // No moves left
    }

    // Convert set to array, pick random index
    const availableArray = Array.from(availableAttacks);
    const randomCoordStr = availableArray[Math.floor(Math.random() * availableArray.length)];
    const [row, col] = randomCoordStr.split(',').map(Number);

    return { row, col };
  };

  // Add adjacent cells to potential targets if they are valid and unattacked
  const addPotentialTargets = (row, col, enemyBoard) => {
      const boardSize = 10; // Assuming 10x10
      const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right

      deltas.forEach(([dr, dc]) => {
          const nr = row + dr;
          const nc = col + dc;
          const coordStr = `${nr},${nc}`;
          // Check bounds and if it hasn't been attacked (is still in availableAttacks)
          if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && availableAttacks.has(coordStr)) {
              // Avoid duplicates, though Set handles this
              if (!potentialTargets.some(t => t.row === nr && t.col === nc)) {
                  potentialTargets.push({ row: nr, col: nc });
              }
          }
      });
      // Optional: Shuffle potentialTargets to make it less predictable
      potentialTargets.sort(() => Math.random() - 0.5);
  }

  // Main computer attack function - chooses strategy
  const computerIntelligentAttack = (enemyBoard) => {
    if (playerType !== 'computer') {
      throw new Error('Only computer players can use computerIntelligentAttack');
    }
    if (availableAttacks === null) {
        initializeAvailableAttacks(); // Initialize on first attack
    }

    let row, col;

    // Strategy: Prioritize hitting adjacent cells after a successful hit
    if (potentialTargets.length > 0) {
        const target = potentialTargets.shift(); // Take the next potential target
        row = target.row;
        col = target.col;
    } else {
        // If no potential targets, choose a random available spot
        const randomCoords = getRandomAttackCoords(enemyBoard);
        if (randomCoords.row === null) {
             return { row: null, col: null, hit: null }; // No moves left
        }
        row = randomCoords.row;
        col = randomCoords.col;
    }

    // Mark the coordinate as attacked (remove from available)
    const coordStr = `${row},${col}`;
    if (!availableAttacks.has(coordStr)) {
        // This case should ideally not happen if logic is correct
        // but handle it - maybe pick another random one?
        console.error(`Computer chose an already attacked coord: ${coordStr}. Retrying random.`);
        // Fallback to random again, avoiding infinite loop is tricky here.
        // For simplicity, return null or throw, indicating an internal error.
        return { row: null, col: null, hit: null }; 
    }
    availableAttacks.delete(coordStr);

    // Execute the attack
    const hit = enemyBoard.receiveAttack(row, col);

    // If it was a hit, add adjacent cells to potential targets
    if (hit) {
        addPotentialTargets(row, col, enemyBoard);
        // Optional: If a ship is SUNK, clear potential targets related to that hit streak?
        // Requires more complex state tracking (which hits belong to which streak).
    }

    return { row, col, hit }; // Return attack details
  };


  // --- Public Interface ---
  return {
    getType,
    gameboard, // Expose the player's own gameboard
    attack, // Human uses this directly
    computerIntelligentAttack, // Computer uses this
    // No need to expose computerAttack anymore
  };
};

export default Player; 