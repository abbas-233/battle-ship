import { jest } from '@jest/globals';

// Define the mock factory and the instance it returns
const mockGameboardInstance = {
  placeShip: jest.fn(),
  receiveAttack: jest.fn((row, col) => {
    // Simulate hit/miss logic for testing computer AI targeting
    // Let's say (1,1) and (1,2) are hits
    if ((row === 1 && col === 1) || (row === 1 && col === 2)) {
      return true; // Simulate a hit
    }
    return false; // Simulate a miss
  }),
  hasBeenAttacked: jest.fn(() => false), // Default mock: no cell attacked yet
  getGrid: jest.fn(() => Array(10).fill(0).map(() => Array(10).fill(null))), // Mock grid
  allShipsSunk: jest.fn(() => false), // Default mock: game not over
};
const mockGameboardFactory = jest.fn(() => mockGameboardInstance);

// --- Mock Gameboard BEFORE importing Player ---
jest.mock('../src/gameboard.js', () => ({
  __esModule: true,
  default: mockGameboardFactory
}));

// --- Import Player AFTER mocking ---
import Player from '../src/player.js';

describe('Player factory', () => {
  // Import the mocked module here as well, though not strictly needed
  // import Gameboard from '../src/gameboard.js';

  beforeEach(() => {
    // Reset the mock factory itself before each test
    mockGameboardFactory.mockClear();
    
    // Reset the mocks on the *instance* returned by the factory
    mockGameboardInstance.placeShip.mockClear();
    mockGameboardInstance.receiveAttack.mockClear();
    mockGameboardInstance.hasBeenAttacked.mockClear();
    // Reset hasBeenAttacked mock implementation to default (false)
    mockGameboardInstance.hasBeenAttacked.mockImplementation(() => false);
    mockGameboardInstance.allShipsSunk.mockClear();
  });

  test('creates a human player with a gameboard', () => {
    const humanPlayer = Player('human');
    expect(humanPlayer.getType()).toBe('human');
    // Check if our mock factory was called when Player() was executed
    expect(mockGameboardFactory).toHaveBeenCalledTimes(1);
    // The player should have a 'gameboard' property holding the mock instance
    expect(humanPlayer.gameboard).toBe(mockGameboardInstance);
  });

  test('creates a computer player with a gameboard', () => {
    const computerPlayer = Player('computer');
    expect(computerPlayer.getType()).toBe('computer');
    // Check if our mock factory was called
    expect(mockGameboardFactory).toHaveBeenCalledTimes(1);
    expect(computerPlayer.gameboard).toBe(mockGameboardInstance);
  });

  // ... rest of the tests should remain the same ...
  // Make sure any direct manipulation of player.gameboard uses the mockGameboardInstance methods

  test('human player can attack enemy gameboard', () => {
    const humanPlayer = Player('human');
    const mockEnemyBoard = {
          receiveAttack: jest.fn()
      };
      humanPlayer.attack(1, 2, mockEnemyBoard);
    expect(mockEnemyBoard.receiveAttack).toHaveBeenCalledTimes(1);
      expect(mockEnemyBoard.receiveAttack).toHaveBeenCalledWith(1, 2);
  });

  test('computer player type cannot use human attack method', () => {
    const computerPlayer = Player('computer');
    const mockEnemyBoard = { receiveAttack: jest.fn() };
    expect(() => computerPlayer.attack(1, 2, mockEnemyBoard)).toThrow('Only human players use attack()');
  });

  // --- Computer Attack Tests ---

  test('computer player makes a valid random attack', () => {
    // Ensure the factory is called when creating the player
    mockGameboardFactory.mockClear();
    const computerPlayer = Player('computer');
    expect(mockGameboardFactory).toHaveBeenCalledTimes(1);

    const mockEnemyBoard = {
        receiveAttack: jest.fn((r, c) => {
            return false; // Always miss
        }),
      hasBeenAttacked: jest.fn(() => false)
    };

    // No need to mock computerPlayer.gameboard.getGrid here, as
    // computerPlayer.gameboard IS mockGameboardInstance, which already has getGrid mocked.

    const attackResult = computerPlayer.computerIntelligentAttack(mockEnemyBoard);

    expect(mockEnemyBoard.receiveAttack).toHaveBeenCalledTimes(1);
    const [row, col] = mockEnemyBoard.receiveAttack.mock.calls[0];

    expect(attackResult.row).toBe(row);
    expect(attackResult.col).toBe(col);

    expect(row).toBeGreaterThanOrEqual(0);
    expect(row).toBeLessThan(10);
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThan(10);
    expect(attackResult.hit).toBe(false);
  });

  test('computer player does not attack the same spot twice', () => {
    mockGameboardFactory.mockClear();
    const computerPlayer = Player('computer');
    expect(mockGameboardFactory).toHaveBeenCalledTimes(1);

    const mockEnemyBoard = {
        receiveAttack: jest.fn().mockReturnValue(false),
        hasBeenAttacked: jest.fn().mockImplementation((r, c) => {
            return !(r === 9 && c === 9);
        })
    };

    // Access internal state (still potentially fragile, but necessary for this test logic)
    computerPlayer.initializeAvailableAttacks();
    const attackedCoords = new Set();
    for (let i = 0; i < 99; i++) {
        const { row, col } = computerPlayer.computerIntelligentAttack(mockEnemyBoard);
        if (row !== null) { // Only add if an attack was made
             attackedCoords.add(`${row},${col}`);
        }
    }
    // Force the state for the final attack (assuming random hits didn't land perfectly)
    computerPlayer.availableAttacks = new Set(['9,9']);
    computerPlayer.potentialTargets = []; // Ensure no potential targets interfere

    const attackResult = computerPlayer.computerIntelligentAttack(mockEnemyBoard);

    expect(mockEnemyBoard.receiveAttack).toHaveBeenCalledWith(9, 9);
    expect(attackResult.row).toBe(9);
    expect(attackResult.col).toBe(9);

     const secondAttackResult = computerPlayer.computerIntelligentAttack(mockEnemyBoard);
     expect(secondAttackResult.row).toBeNull();
     expect(secondAttackResult.col).toBeNull();
     // The number of calls might vary slightly due to random hits in the loop,
     // but receiveAttack(9,9) should be the last *successful* call.
     // Let's focus on the final state.
     expect(mockEnemyBoard.receiveAttack).toHaveBeenCalledTimes(100); // Expect exactly 100 calls total (99 loop + 1 final)
  });


  test('computer player prioritizes adjacent cells after a hit', () => {
      mockGameboardFactory.mockClear();
      const computerPlayer = Player('computer');
      expect(mockGameboardFactory).toHaveBeenCalledTimes(1);

      const mockEnemyBoard = {
          receiveAttack: jest.fn((row, col) => (row === 1 && col === 1)), // Hit only at (1,1)
          hasBeenAttacked: jest.fn(() => false),
      };

      // Setup internal state
      computerPlayer.initializeAvailableAttacks();
      // Simulate the FIRST attack hitting (1,1) - need to update player's internal state
      const firstAttackCoord = '1,1';
      computerPlayer.availableAttacks.delete(firstAttackCoord);
      computerPlayer.addPotentialTargets(1, 1, mockEnemyBoard);

      // Perform the NEXT attack (should pick from potentialTargets)
      const attackResult = computerPlayer.computerIntelligentAttack(mockEnemyBoard);

      expect(mockEnemyBoard.receiveAttack).toHaveBeenCalledTimes(1);
      const [row, col] = mockEnemyBoard.receiveAttack.mock.calls[0];

      const isAdjacent =
          (Math.abs(row - 1) === 1 && col === 1) || (row === 1 && Math.abs(col - 1) === 1);
      expect(isAdjacent).toBe(true);

      expect(computerPlayer.availableAttacks.has(`${row},${col}`)).toBe(false);

      expect(attackResult.row).toBe(row);
      expect(attackResult.col).toBe(col);
      expect(attackResult.hit).toBe(false);

      // Check internal state: potential target was used
      expect(computerPlayer.potentialTargets.some(t => t.row === row && t.col === col)).toBe(false);
  });

    test('computer player attacks randomly again if potential targets list is exhausted', () => {
      mockGameboardFactory.mockClear();
      const computerPlayer = Player('computer');
      expect(mockGameboardFactory).toHaveBeenCalledTimes(1);

      const mockEnemyBoard = {
          receiveAttack: jest.fn().mockReturnValue(false), // Always miss
          hasBeenAttacked: jest.fn(() => false),
      };

      computerPlayer.initializeAvailableAttacks();

      // Simulate a hit at (1,1) and add potential targets
       computerPlayer.availableAttacks.delete('1,1');
      computerPlayer.addPotentialTargets(1, 1, mockEnemyBoard);
       const initialPotentialTargets = [...computerPlayer.potentialTargets];

       // Simulate attacking all potential targets by removing them from available
       initialPotentialTargets.forEach(target => {
           computerPlayer.availableAttacks.delete(`${target.row},${target.col}`);
       });
       // Force potential targets to be empty for the next attack call
       computerPlayer.potentialTargets = [];

      // Now attack - it should pick a random spot NOT adjacent to (1,1) or (1,1) itself
       const attackResult = computerPlayer.computerIntelligentAttack(mockEnemyBoard);
       const [row, col] = mockEnemyBoard.receiveAttack.mock.calls[0];

      expect(attackResult.row).toBe(row);
      expect(attackResult.col).toBe(col);

      // Check it wasn't (1,1)
      expect(`${row},${col}` !== '1,1').toBe(true);
      // Check it wasn't one of the initial adjacent targets that were theoretically exhausted
       const wasAdjacentTarget = initialPotentialTargets.some(t => t.row === row && t.col === col);
      expect(wasAdjacentTarget).toBe(false);
  });


});
// The tests manipulating internal state (availableAttacks, potentialTargets)
// are still somewhat brittle as they rely on implementation details of Player.
// If the Player factory changes how it manages state, these tests might break. 