import Player from '../src/player';
import Gameboard from '../src/gameboard'; // Needed to mock

// Mock the Gameboard factory
jest.mock('../src/gameboard');

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  Gameboard.mockClear();
});

describe('Player factory', () => {
  test('creates a human player with a gameboard', () => {
    const humanPlayer = Player('human');
    expect(humanPlayer.getType()).toBe('human');
    // Check if Gameboard constructor was called when player was created
    expect(Gameboard).toHaveBeenCalledTimes(1);
    expect(humanPlayer.gameboard).toBeDefined();
  });

  test('creates a computer player with a gameboard', () => {
    const computerPlayer = Player('computer');
    expect(computerPlayer.getType()).toBe('computer');
    expect(Gameboard).toHaveBeenCalledTimes(1);
    expect(computerPlayer.gameboard).toBeDefined();
  });

  test('human player can attack enemy gameboard', () => {
    const humanPlayer = Player('human');
    // Create a mock enemy gameboard instance manually for this test
    const mockEnemyBoard = {
      receiveAttack: jest.fn(),
      getMissedAttacks: jest.fn(() => []), // Needed if attack logic checks misses
      getGrid: jest.fn(() => Array(10).fill(null).map(() => Array(10).fill(null))), // Provide grid if needed
      isValidCoordinate: jest.fn(() => true), // Assume coords are valid for this test
      hasBeenAttacked: jest.fn(() => false) // Assume not attacked before
    };

    const row = 3;
    const col = 4;
    const result = humanPlayer.attack(row, col, mockEnemyBoard);

    // Expect receiveAttack to be called on the *enemy* board with correct coords
    expect(mockEnemyBoard.receiveAttack).toHaveBeenCalledWith(row, col);
    // Attack function could return the result of receiveAttack (true for hit, false for miss)
    // Let's assume receiveAttack returns true for this mock scenario
    mockEnemyBoard.receiveAttack.mockReturnValueOnce(true);
    expect(humanPlayer.attack(row, col, mockEnemyBoard)).toBe(true);
  });

  test('computer player makes a valid random attack', () => {
    const computerPlayer = Player('computer');
    const mockEnemyBoard = {
      receiveAttack: jest.fn(),
      isValidCoordinate: (r, c) => r >= 0 && r < 10 && c >= 0 && c < 10,
      hasBeenAttacked: jest.fn(() => false) // Initially, no spots attacked
    };

    computerPlayer.computerAttack(mockEnemyBoard);

    // Check that receiveAttack was called once
    expect(mockEnemyBoard.receiveAttack).toHaveBeenCalledTimes(1);
    // Check that it was called with valid coordinates (0-9)
    const [row, col] = mockEnemyBoard.receiveAttack.mock.calls[0];
    expect(row).toBeGreaterThanOrEqual(0);
    expect(row).toBeLessThan(10);
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThan(10);
  });

  test('computer player does not attack the same spot twice', () => {
    const computerPlayer = Player('computer');
    const attackedSpots = new Set();
    const mockEnemyBoard = {
      receiveAttack: jest.fn((r, c) => {
        // Simulate marking the spot as attacked after the computer chooses it
        attackedSpots.add(`${r},${c}`);
        return true; // Simulate a hit
      }),
      isValidCoordinate: (r, c) => r >= 0 && r < 10 && c >= 0 && c < 10,
      hasBeenAttacked: jest.fn((r, c) => attackedSpots.has(`${r},${c}`))
    };

    // Simulate almost all spots being attacked (99 out of 100)
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (r < 9 || c < 9) { // Leave one spot open (9,9)
          attackedSpots.add(`${r},${c}`);
        }
      }
    }

    computerPlayer.computerAttack(mockEnemyBoard);

    // Check that the *only* remaining spot (9,9) was attacked
    expect(mockEnemyBoard.receiveAttack).toHaveBeenCalledWith(9, 9);

     // Try attacking again - should throw or handle gracefully if no moves left
     // For now, let's assume it finds the last spot. A more robust test could
     // fill all spots and expect an error or specific return value.
  });

}); 