import { jest } from '@jest/globals';
import Player from '../src/player.js';
import Gameboard from '../src/gameboard.js'; // Import real Gameboard

describe('Player factory', () => {
  let testBoard; // Real gameboard instance
  let receiveAttackSpy;
  let hasBeenAttackedSpy;
  let allShipsSunkSpy;
  let getGridSpy;

  beforeEach(() => {
    testBoard = Gameboard(); // Create a real board
    // Spy on the methods of the real board instance
    receiveAttackSpy = jest.spyOn(testBoard, 'receiveAttack');
    hasBeenAttackedSpy = jest.spyOn(testBoard, 'hasBeenAttacked');
    allShipsSunkSpy = jest.spyOn(testBoard, 'allShipsSunk');
    getGridSpy = jest.spyOn(testBoard, 'getGrid');

    // Default mock implementations (can be overridden in tests)
    receiveAttackSpy.mockReturnValue(false); // Default to miss
    hasBeenAttackedSpy.mockReturnValue(false); // Default to not attacked
    allShipsSunkSpy.mockReturnValue(false);
    // getGridSpy doesn't need a default mock, it uses the real implementation
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  // Helper function to create player with the spied board
  const createPlayer = (type) => Player(type, () => testBoard);

  test('creates a human player with a gameboard', () => {
    const humanPlayer = createPlayer('human');
    expect(humanPlayer.getType()).toBe('human');
    // The player's gameboard should be the instance we spied on
    expect(humanPlayer.gameboard).toBe(testBoard);
  });

  test('creates a computer player with a gameboard', () => {
    const computerPlayer = createPlayer('computer');
    expect(computerPlayer.getType()).toBe('computer');
    expect(computerPlayer.gameboard).toBe(testBoard);
  });

  test('human player can attack enemy gameboard', () => {
    const humanPlayer = createPlayer('human');
    // Create a separate enemy board for this test
    const enemyBoard = Gameboard();
    const enemyReceiveAttackSpy = jest.spyOn(enemyBoard, 'receiveAttack');

    humanPlayer.attack(1, 2, enemyBoard);
    expect(enemyReceiveAttackSpy).toHaveBeenCalledTimes(1);
    expect(enemyReceiveAttackSpy).toHaveBeenCalledWith(1, 2);
  });

  test('computer player type cannot use human attack method', () => {
    const computerPlayer = createPlayer('computer');
    const enemyBoard = Gameboard();
    expect(() => computerPlayer.attack(1, 2, enemyBoard)).toThrow('Only human players use attack()');
  });

  // --- Computer Attack Tests ---

  test('computer player makes a valid random attack', () => {
    const computerPlayer = createPlayer('computer');
    const enemyBoard = Gameboard(); // Use a real board for the enemy
    const enemyReceiveAttackSpy = jest.spyOn(enemyBoard, 'receiveAttack').mockReturnValue(false);
    jest.spyOn(enemyBoard, 'hasBeenAttacked').mockReturnValue(false);

    const attackResult = computerPlayer.computerIntelligentAttack(enemyBoard);

    expect(enemyReceiveAttackSpy).toHaveBeenCalledTimes(1);
    const [row, col] = enemyReceiveAttackSpy.mock.calls[0];

    expect(attackResult.row).toBe(row);
    expect(attackResult.col).toBe(col);
    expect(row).toBeGreaterThanOrEqual(0);
    expect(row).toBeLessThan(10);
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThan(10);
    expect(attackResult.hit).toBe(false);
  });

  test('computer player does not attack the same spot twice', () => {
    const computerPlayer = createPlayer('computer');
    const enemyBoard = Gameboard();
    const enemyReceiveAttackSpy = jest.spyOn(enemyBoard, 'receiveAttack').mockReturnValue(false);
    // Mock board state: all cells attacked except (9, 9)
    const enemyHasBeenAttackedSpy = jest.spyOn(enemyBoard, 'hasBeenAttacked').mockImplementation((r, c) => !(r === 9 && c === 9));

    computerPlayer.initializeAvailableAttacks(); // Initialize based on default 10x10 size

    // First call should attack the only theoretically available spot (9,9)
    // Need to ensure initializeAvailableAttacks considers the mocked hasBeenAttacked state
    // Or, more simply, the AI should query hasBeenAttacked before attacking.
    // Let's assume initializeAvailableAttacks creates the full set, and the AI checks hasBeenAttacked later.

    // Force the AI to attack the only non-attacked spot
    // This requires manipulating the internal availableAttacks, which we wanted to avoid.
    // Let's simplify: Attack 100 times. The logic should prevent duplicates.
    const attackedLog = new Set();
    for (let i = 0; i < 100; i++) {
      // Allow all attacks for this loop, check uniqueness later
      enemyHasBeenAttackedSpy.mockReturnValue(false);
      const {row, col} = computerPlayer.computerIntelligentAttack(enemyBoard);
      if (row !== null) {
        attackedLog.add(`${row},${col}`);
        // Mock that the attacked cell is now attacked for subsequent AI checks
        enemyHasBeenAttackedSpy.mockImplementation((r, c) => attackedLog.has(`${r},${c}`));
      }
    }

    // Check if 100 unique spots were attacked
    expect(enemyReceiveAttackSpy).toHaveBeenCalledTimes(100);
    expect(attackedLog.size).toBe(100);

    // Now all spots should be considered attacked by the mock
    enemyHasBeenAttackedSpy.mockImplementation(() => true);
    const finalAttack = computerPlayer.computerIntelligentAttack(enemyBoard);
    expect(finalAttack.row).toBeNull();
    expect(finalAttack.col).toBeNull();
    // No more calls to receiveAttack
    expect(enemyReceiveAttackSpy).toHaveBeenCalledTimes(100);
  });


  test('computer player prioritizes adjacent cells after a hit', () => {
      const computerPlayer = createPlayer('computer');
      const enemyBoard = Gameboard();
      const attackedCoords = new Set();

      // Spy and mock implementation
      const enemyReceiveAttackSpy = jest.spyOn(enemyBoard, 'receiveAttack');
      const enemyHasBeenAttackedSpy = jest.spyOn(enemyBoard, 'hasBeenAttacked').mockImplementation((r, c) => attackedCoords.has(`${r},${c}`));

      computerPlayer.initializeAvailableAttacks();

      // --- First Attack (Let AI choose randomly) ---
      enemyReceiveAttackSpy.mockReturnValueOnce(true); // Make the *first* attack a hit regardless of coord
      const firstAttackResult = computerPlayer.computerIntelligentAttack(enemyBoard);
      expect(enemyReceiveAttackSpy).toHaveBeenCalledTimes(1);
      const [firstRow, firstCol] = enemyReceiveAttackSpy.mock.calls[0]; // Get the actual first coord
      attackedCoords.add(`${firstRow},${firstCol}`);
      expect(firstAttackResult.hit).toBe(true); // Verify the mock worked

      // Subsequent attacks are misses
      enemyReceiveAttackSpy.mockReturnValue(false);

      // --- Second Attack (Should be adjacent to the *actual* first hit) ---
      computerPlayer.computerIntelligentAttack(enemyBoard);
      expect(enemyReceiveAttackSpy).toHaveBeenCalledTimes(2);
      const calls = enemyReceiveAttackSpy.mock.calls;
      const [secondRow, secondCol] = calls[calls.length - 1];
      attackedCoords.add(`${secondRow},${secondCol}`); // Log the second attack

      const isAdjacent =
          (Math.abs(secondRow - firstRow) === 1 && secondCol === firstCol) ||
          (secondRow === firstRow && Math.abs(secondCol - firstCol) === 1);

      expect(isAdjacent).toBe(true);
  });

  test('computer player attacks randomly again if potential targets list is exhausted', () => {
    const computerPlayer = createPlayer('computer');
    const enemyBoard = Gameboard();
    const attackedCoords = new Set();

    // Spy and mock implementation
    const enemyReceiveAttackSpy = jest.spyOn(enemyBoard, 'receiveAttack');
    const enemyHasBeenAttackedSpy = jest.spyOn(enemyBoard, 'hasBeenAttacked').mockImplementation((r, c) => attackedCoords.has(`${r},${c}`));

    computerPlayer.initializeAvailableAttacks();

    // --- First Attack (Let AI choose randomly, make it a hit) ---
    enemyReceiveAttackSpy.mockReturnValueOnce(true); // First call is a hit
    const firstAttackResult = computerPlayer.computerIntelligentAttack(enemyBoard);
    expect(enemyReceiveAttackSpy).toHaveBeenCalledTimes(1);
    const [firstRow, firstCol] = enemyReceiveAttackSpy.mock.calls[0];
    attackedCoords.add(`${firstRow},${firstCol}`);
    expect(firstAttackResult.hit).toBe(true);

    // Subsequent attacks are misses
    enemyReceiveAttackSpy.mockReturnValue(false);

    // Calculate expected adjacent coordinates based on the actual first hit
    const adjacentCoords = [];
    const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    deltas.forEach(([dr, dc]) => {
        const nr = firstRow + dr;
        const nc = firstCol + dc;
        if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) { // Check bounds
            adjacentCoords.push({ row: nr, col: nc });
        }
    });
    const adjacentCoordStrings = new Set(adjacentCoords.map(c => `${c.row},${c.col}`));

    // --- Exhaust Potential Targets (Attack adjacent cells) ---
    // Assumes the AI correctly targets these adjacent cells next
    const expectedAdjacentCount = adjacentCoords.length;
    for (let i = 0; i < expectedAdjacentCount; i++) {
        computerPlayer.computerIntelligentAttack(enemyBoard);
    }
    expect(enemyReceiveAttackSpy).toHaveBeenCalledTimes(1 + expectedAdjacentCount);

    // Verify adjacent cells were attacked
    adjacentCoords.forEach(coord => {
      // Check if the coord was among the last N calls
      const recentCalls = enemyReceiveAttackSpy.mock.calls.slice(1); // Exclude the first hit call
      const wasCalled = recentCalls.some(call => call[0] === coord.row && call[1] === coord.col);
      if(wasCalled) attackedCoords.add(`${coord.row},${coord.col}`); // Ensure it's logged if called
      expect(wasCalled).toBe(true);
    });

    // --- Final Attack (Should be random, non-adjacent) ---
    computerPlayer.computerIntelligentAttack(enemyBoard);
    expect(enemyReceiveAttackSpy).toHaveBeenCalledTimes(1 + expectedAdjacentCount + 1);
    const calls = enemyReceiveAttackSpy.mock.calls;
    const [finalRow, finalCol] = calls[calls.length - 1];
    attackedCoords.add(`${finalRow},${finalCol}`); // Log final attack

    // Check it wasn't the original hit or adjacent
    expect(`${finalRow},${finalCol}` !== `${firstRow},${firstCol}`).toBe(true);
    expect(adjacentCoordStrings.has(`${finalRow},${finalCol}`)).toBe(false);
  });
});

// Note: These tests still rely on the AI behaving predictably (e.g., targeting all adjacent cells before random).
// Failures might still indicate subtle AI logic bugs or overly strict test assumptions. 