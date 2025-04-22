import Gameboard from '../src/gameboard.js';
import Ship from '../src/ship.js'; // We need Ship for testing placement

describe('Gameboard factory', () => {
  let testBoard;

  beforeEach(() => {
    testBoard = Gameboard(); // Create a new board before each test
  });

  // --- Ship Placement Tests ---
  test('placeShip places ship horizontally at specific coordinates', () => {
    const shipLength = 3;
    const testShip = Ship(shipLength);
    testBoard.placeShip(testShip, 0, 0, false); // Place horizontally at [0,0]
    // Check if grid cells occupied by the ship reference the ship object
    for (let i = 0; i < shipLength; i++) {
      expect(testBoard.getGrid()[0][i]).toBe(testShip);
    }
    // Check adjacent cell is empty
    expect(testBoard.getGrid()[0][shipLength]).toBeNull();
  });

  test('placeShip places ship vertically at specific coordinates', () => {
    const shipLength = 4;
    const testShip = Ship(shipLength);
    testBoard.placeShip(testShip, 2, 3, true); // Place vertically at [2,3]
    for (let i = 0; i < shipLength; i++) {
      expect(testBoard.getGrid()[2 + i][3]).toBe(testShip);
    }
    // Check adjacent cell is empty
    expect(testBoard.getGrid()[2 + shipLength][3]).toBeNull();
  });

  test('placeShip prevents placing ships out of bounds (horizontal)', () => {
    const testShip = Ship(3);
    // Board size is typically 10x10, so placing length 3 at x=8 should fail
    expect(() => testBoard.placeShip(testShip, 0, 8, false)).toThrow('out of bounds');
  });

  test('placeShip prevents placing ships out of bounds (vertical)', () => {
    const testShip = Ship(4);
    // Board size is 10x10, placing length 4 at y=7 should fail
    expect(() => testBoard.placeShip(testShip, 7, 0, true)).toThrow('out of bounds');
  });

  test('placeShip prevents placing ships on occupied cells (horizontal)', () => {
    const ship1 = Ship(3);
    const ship2 = Ship(4);
    testBoard.placeShip(ship1, 1, 1, false); // Place ship1 at [1,1] horizontally
    // Attempt to place ship2 overlapping ship1
    expect(() => testBoard.placeShip(ship2, 1, 2, false)).toThrow('occupied');
  });

  test('placeShip prevents placing ships on occupied cells (vertical)', () => {
    const ship1 = Ship(3);
    const ship2 = Ship(4);
    testBoard.placeShip(ship1, 1, 1, true); // Place ship1 at [1,1] vertically
    // Attempt to place ship2 overlapping ship1
    expect(() => testBoard.placeShip(ship2, 2, 1, true)).toThrow('occupied');
  });

  // --- receiveAttack Tests ---
  test('receiveAttack hits a ship correctly', () => {
    const testShip = Ship(3);
    testBoard.placeShip(testShip, 2, 2, false);
    const result = testBoard.receiveAttack(2, 3); // Hit the middle of the ship
    expect(result).toBe(true); // Indicates a hit
    expect(testShip.getHits()).toBe(1);
    // Check grid state (optional, might be implementation detail)
    // expect(testBoard.getGrid()[2][3]).toBe('hit'); // Or however hits are marked
  });

  test('receiveAttack records a missed shot', () => {
    const testShip = Ship(3);
    testBoard.placeShip(testShip, 2, 2, false);
    const result = testBoard.receiveAttack(5, 5); // Miss completely
    expect(result).toBe(false); // Indicates a miss
    expect(testBoard.getMissedAttacks()).toContainEqual([5, 5]);
    // Check grid state (optional)
    // expect(testBoard.getGrid()[5][5]).toBe('miss'); // Or however misses are marked
  });

  test('receiveAttack prevents attacking the same spot twice (hit)', () => {
    const testShip = Ship(3);
    testBoard.placeShip(testShip, 2, 2, false);
    testBoard.receiveAttack(2, 3); // First attack (hit)
    expect(() => testBoard.receiveAttack(2, 3)).toThrow('already attacked');
  });

   test('receiveAttack prevents attacking the same spot twice (miss)', () => {
    testBoard.receiveAttack(5, 5); // First attack (miss)
    expect(() => testBoard.receiveAttack(5, 5)).toThrow('already attacked');
  });

  // --- Report All Sunk Tests ---
  test('allShipsSunk reports false if no ships are placed', () => {
    expect(testBoard.allShipsSunk()).toBe(false);
  });

  test('allShipsSunk reports false if ships remain afloat', () => {
    const ship1 = Ship(2);
    const ship2 = Ship(1);
    testBoard.placeShip(ship1, 0, 0, false);
    testBoard.placeShip(ship2, 5, 5, false);
    testBoard.receiveAttack(0, 0); // Hit ship1
    expect(testBoard.allShipsSunk()).toBe(false);
  });

  test('allShipsSunk reports true when all ships are sunk', () => {
    const ship1 = Ship(2);
    const ship2 = Ship(1);
    testBoard.placeShip(ship1, 0, 0, false);
    testBoard.placeShip(ship2, 5, 5, false);

    // Sink ship1
    testBoard.receiveAttack(0, 0);
    testBoard.receiveAttack(0, 1);

    // Sink ship2
    testBoard.receiveAttack(5, 5);

    expect(testBoard.allShipsSunk()).toBe(true);
  });

  // --- Get Grid Test (Helper for other tests) ---
  test('getGrid returns the current board state', () => {
    const grid = testBoard.getGrid();
    expect(grid).toBeInstanceOf(Array);
    expect(grid.length).toBe(10); // Assuming 10x10 board
    expect(grid[0]).toBeInstanceOf(Array);
    expect(grid[0].length).toBe(10);
    expect(grid[0][0]).toBeNull(); // Expect empty cells to be null initially
  });

}); 