import Ship from '../src/ship';

describe('Ship factory', () => {
  let testShip;

  beforeEach(() => {
    // Create a new ship before each test
    testShip = Ship(3); // Example: a ship of length 3
  });

  test('ship properties are correct', () => {
    expect(testShip.length).toBe(3);
    expect(testShip.getHits()).toBe(0);
    expect(testShip.isSunk()).toBe(false);
  });

  test('hit() increases the number of hits', () => {
    testShip.hit();
    expect(testShip.getHits()).toBe(1);
  });

  test('hit() does not increase hits beyond length', () => {
    testShip.hit();
    testShip.hit();
    testShip.hit();
    testShip.hit(); // Extra hit
    expect(testShip.getHits()).toBe(3);
  });

  test('isSunk() returns false when hits < length', () => {
    testShip.hit();
    testShip.hit();
    expect(testShip.isSunk()).toBe(false);
  });

  test('isSunk() returns true when hits === length', () => {
    testShip.hit();
    testShip.hit();
    testShip.hit();
    expect(testShip.isSunk()).toBe(true);
  });
}); 