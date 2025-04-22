// src/domController.js

const domController = (() => {
  const playerBoardContainer = document.getElementById('player-board');
  const computerBoardContainer = document.getElementById('computer-board');

  // Clears and renders a game board grid
  const renderBoard = (gameboard, container, isEnemyBoard = false) => {
    container.innerHTML = ''; // Clear previous state
    const grid = gameboard.getGrid(); // Assumes gameboard has getGrid()
    const boardSize = grid.length;
    container.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;

    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = r;
        cell.dataset.col = c;

        const cellState = grid[r][c];
        // Add classes based on cell state (null, ship, hit, miss)
        // For now, just basic cell. Will add state display later.

        // Only add event listener to enemy board cells for attacks
        if (isEnemyBoard) {
           cell.classList.add('enemy-cell'); // To allow clicking
           // Event listener will be added in the main game loop or setup
        }

        // TEMP: Show player ships for debugging (remove later)
        if (!isEnemyBoard && cellState !== null && typeof cellState.length === 'number') {
            cell.classList.add('ship');
        }

        container.appendChild(cell);
      }
    }
  };

  // Updates a single cell's appearance after an attack
  const updateCell = (row, col, state, boardType) => {
     const container = boardType === 'player' ? playerBoardContainer : computerBoardContainer;
     // QuerySelector might be slow if called very frequently, but fine for this scale
     const cell = container.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
     if (cell) {
        cell.classList.add(state); // Add 'hit' or 'miss' class
        // Remove ability to click again if it was an enemy cell
        if (boardType === 'computer') {
            cell.classList.remove('enemy-cell');
            cell.style.cursor = 'default';
        }
     }
  };

  // Add other DOM manipulation functions here (e.g., display messages, game over screen)
  const displayMessage = (message) => {
      const messageElement = document.getElementById('message-area');
      if (messageElement) {
          messageElement.textContent = message;
      }
  }

  return {
    renderBoard,
    updateCell,
    displayMessage,
    // Expose containers if needed externally, though maybe not best practice
    playerBoardContainer,
    computerBoardContainer
  };
})();

export default domController; 