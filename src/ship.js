const Ship = (length) => {
  if (length <= 0) {
    throw new Error('Ship length must be positive');
  }

  let hits = 0;

  const hit = () => {
    if (hits < length) {
      hits += 1;
    }
  };

  const getHits = () => hits;

  const isSunk = () => hits >= length;

  // Public interface
  return {
    length, // Keep length accessible
    getHits, // Use a getter for hits
    hit,
    isSunk,
  };
};

export default Ship; 