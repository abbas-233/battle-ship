import Ship from './ship'; // May need Ship if placing involves creating them here

const Gameboard = (size = 10) => {
  // Initialize grid
  let grid = Array(size).fill(null).map(() => Array(size).fill(null));
  let ships = [];
  let missedAttacks = [];
  // Use a Set for efficient lookup of attacked coordinates
  let attackedCoords = new Set();

  const markAttacked = (row, col) => {
    attackedCoords.add(`${row},${col}`);
  };

  const hasBeenAttacked = (row, col) => {
    return attackedCoords.has(`${row},${col}`);
  };

  const isValidCoordinate = (row, col) => {
    return row >= 0 && row < size && col >= 0 && col < size;
  };

  const placeShip = (ship, row, col, isVertical) => {
    // 1. Check Bounds
    if (isVertical) {
      if (row + ship.length > size) throw new Error('Ship placement out of bounds');
    } else {
      if (col + ship.length > size) throw new Error('Ship placement out of bounds');
    }

    // 2. Check Overlap
    for (let i = 0; i < ship.length; i++) {
      const currentRow = isVertical ? row + i : row;
      const currentCol = isVertical ? col : col + i;
      if (!isValidCoordinate(currentRow, currentCol)) {
          // This should technically be caught by the first check, but good to double-check
          throw new Error('Ship placement out of bounds');
      }
      if (grid[currentRow][currentCol] !== null) {
        throw new Error('Ship placement occupied');
      }
    }

    // 3. Place the ship
    for (let i = 0; i < ship.length; i++) {
      const currentRow = isVertical ? row + i : row;
      const currentCol = isVertical ? col : col + i;
      grid[currentRow][currentCol] = ship; // Store reference to the ship object
    }
    ships.push(ship); // Add ship to the board's list
  };

  const receiveAttack = (row, col) => {
    if (!isValidCoordinate(row, col)) {
        throw new Error('Attack coordinates out of bounds');
    }
    if (hasBeenAttacked(row, col)) {
      throw new Error('Coordinate already attacked');
    }

    markAttacked(row, col);
    const target = grid[row][col];

    // Check if the target is a ship object (duck typing)
    if (target && typeof target.hit === 'function' && typeof target.isSunk === 'function') {
      target.hit();
      // Optionally mark the grid specifically for hits
      return true; // Hit
    } else {
      missedAttacks.push([row, col]);
      // Optionally mark the grid for misses, e.g., grid[row][col] = 'miss';
      return false; // Miss
    }
  };

  const getMissedAttacks = () => {
    // Return a copy to prevent external modification
    return [...missedAttacks];
  };

  const allShipsSunk = () => {
    // Check if every ship in the ships array is sunk
    return ships.length > 0 && ships.every(ship => ship.isSunk());
  };

  const getGrid = () => {
      // Return a copy of the grid to prevent direct external modification
      // Deep copy might be needed if grid cells contain mutable objects other than ships
      return grid.map(row => [...row]);
  };

  // Public interface
  return {
    placeShip,
    receiveAttack,
    getMissedAttacks,
    allShipsSunk,
    getGrid, // Expose for testing and potentially rendering
  };
};

export default Gameboard; 