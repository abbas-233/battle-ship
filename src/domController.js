// src/domController.js

import Ship from "./ship.js"; // Needed for ship placement logic

const domController = (() => {
  const playerBoardContainer = document.getElementById('player-board');
  const computerBoardContainer = document.getElementById('computer-board');
  const computerBoardWrapper = document.getElementById('computer-board-container');
  const shipListContainer = document.getElementById('ship-list');
  const rotateButton = document.getElementById('rotate-button');
  const randomPlacementButton = document.getElementById('random-placement');
  const startButton = document.getElementById('start-button');
  const resetButton = document.getElementById('reset-button');
  const soundToggleButton = document.getElementById('sound-toggle');
  const placementControlsContainer = document.getElementById('placement-controls');
  const messageArea = document.getElementById('message-area');
  const shipListMainContainer = document.getElementById('ship-list-container');

  // Now using SVGs from Heroicons in assets/images/heroicons
  const shipIcons = {
    'Carrier': '../assets/images/heroicons/cube.svg',
    'Battleship': '../assets/images/heroicons/anchor.svg',
    'Cruiser': '../assets/images/heroicons/flag.svg',
    'Submarine': '../assets/images/heroicons/rocket-launch.svg',
    'Destroyer': '../assets/images/heroicons/sparkles.svg',
  };

  // Clears and renders a game board grid
  const renderBoard = (gameboard, container, isEnemyBoard = false, showShips = true) => {
    container.innerHTML = ''; // Clear previous state
    const grid = gameboard.getGrid();
    const boardSize = grid.length;
    container.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;

    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = r;
        cell.dataset.col = c;

        const cellState = grid[r][c];

        // Show player ships only if not enemy board OR if debugging
        if (!isEnemyBoard && showShips && cellState instanceof Ship) {
             cell.classList.add('ship');
        }

        // Add hit/miss markers based on game state (needs access to attacked coords)
        if (gameboard.hasBeenAttacked && gameboard.hasBeenAttacked(r, c)) {
            if (cellState instanceof Ship) {
                cell.classList.add('hit');
            } else {
                cell.classList.add('miss');
            }
        }

        if (isEnemyBoard) {
           cell.classList.add('enemy-cell');
        }

        container.appendChild(cell);
      }
    }
  };

  // Updates a single cell's appearance after an attack
  const updateCell = (row, col, state, boardType) => {
     const container = boardType === 'player' ? playerBoardContainer : computerBoardContainer;
     const cell = container.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
     if (cell) {
        cell.classList.remove('hover-valid', 'hover-invalid'); // Clear hover states
        // Determine actual state (hit/miss) based on the input state
        const stateClass = state ? 'hit' : 'miss'; 
        cell.classList.add(stateClass);

        // If it was a hit on a ship, ensure the 'ship' class is removed if needed by CSS logic
        // (e.g., if hit overrides ship background)
        // Currently CSS handles this with specificity and ::after
        
        // Remove interactivity from attacked cells
        if (boardType === 'computer') {
            cell.classList.remove('enemy-cell');
            cell.style.cursor = 'default';
        }
        if (boardType === 'player') {
             cell.style.cursor = 'default'; // Remove placement cursor too
        }
     }
  };

  // Add other DOM manipulation functions here (e.g., display messages, game over screen)
  const displayMessage = (message) => {
      if (messageArea) {
          messageArea.textContent = message;
      }
  }

  // --- Placement Phase UI --- 
  const renderShipList = (shipsToPlace, onShipSelectCallback) => {
      shipListContainer.innerHTML = ''; // Clear previous list
      shipsToPlace.forEach((shipInfo, index) => {
          const li = document.createElement('li');
          // Only add text, no icon
          const text = document.createElement('span');
          text.textContent = `${shipInfo.name} (${shipInfo.length})`;
          li.appendChild(text);
          li.dataset.shipIndex = index;
          li.dataset.shipLength = shipInfo.length;
          li.dataset.shipName = shipInfo.name;
          li.addEventListener('click', (e) => {
              // Remove 'selected' from previously selected item
              const currentlySelected = shipListContainer.querySelector('.selected');
              if (currentlySelected) {
                  currentlySelected.classList.remove('selected');
              }
              // Add 'selected' to clicked item
              li.classList.add('selected');
              onShipSelectCallback(shipInfo.length, shipInfo.name, index);
          });
          shipListContainer.appendChild(li);
      });
  };

  const updateRotationButton = (isVertical) => {
      rotateButton.textContent = `Rotate Ship (${isVertical ? 'Vertical' : 'Horizontal'})`;
  };

  const highlightPlacement = (row, col, length, isVertical, isValid) => {
      clearPlacementHighlights(); // Clear previous highlights first
      const boardSize = 10; // TODO: Get from gameboard if dynamic

      for (let i = 0; i < length; i++) {
          const r = isVertical ? row + i : row;
          const c = isVertical ? col : col + i;

          if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
              const cell = playerBoardContainer.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
              if (cell) {
                  cell.classList.add(isValid ? 'hover-valid' : 'hover-invalid');
              }
          }
      }
  };

  const clearPlacementHighlights = () => {
      const highlightedCells = playerBoardContainer.querySelectorAll('.hover-valid, .hover-invalid');
      highlightedCells.forEach(cell => cell.classList.remove('hover-valid', 'hover-invalid'));
  };

  const setPlacementPhaseUI = (isActive) => {
      if (isActive) {
          document.body.classList.add('placement-phase');
          placementControlsContainer.style.display = 'block';
          if (shipListMainContainer) shipListMainContainer.style.display = 'block';
          computerBoardWrapper.style.display = 'none';
          startButton.disabled = true;
          resetButton.style.display = 'none';
          playerBoardContainer.style.cursor = 'crosshair'; // Add pointer
      } else {
          document.body.classList.remove('placement-phase');
          placementControlsContainer.style.display = 'none';
          if (shipListMainContainer) shipListMainContainer.style.display = 'none';
          computerBoardWrapper.style.display = 'flex'; // Or block, depending on desired layout
          startButton.disabled = true; // Keep disabled until game actually starts
          resetButton.style.display = 'none'; // Hide reset until game over
          playerBoardContainer.style.cursor = 'default';
          clearPlacementHighlights();
      }
  };

  const enableStartButton = () => {
      startButton.disabled = false;
  }
  
  const showGameOverUI = (winnerName) => {
      displayMessage(`${winnerName} win! All enemy ships have been sunk.`);
      resetButton.style.display = 'inline-block'; // Show reset button
  };

  const updateSoundButton = (isEnabled) => {
    if (soundToggleButton) {
      soundToggleButton.textContent = `Sound: ${isEnabled ? 'ON' : 'OFF'}`;
    }
  };

  // --- Getters for elements (used by index.js) ---
  const getRotateButton = () => rotateButton;
  const getRandomPlacementButton = () => randomPlacementButton;
  const getStartButton = () => startButton;
  const getResetButton = () => resetButton;
  const getSoundToggleButton = () => soundToggleButton;
  const getPlayerBoardContainer = () => playerBoardContainer;
  const getComputerBoardContainer = () => computerBoardContainer;

  return {
    renderBoard,
    updateCell,
    displayMessage,
    renderShipList,
    updateRotationButton,
    highlightPlacement,
    clearPlacementHighlights,
    setPlacementPhaseUI,
    enableStartButton,
    showGameOverUI,
    updateSoundButton,
    // Expose elements needed for event listeners in index.js
    getRotateButton,
    getRandomPlacementButton,
    getStartButton,
    getResetButton,
    getSoundToggleButton,
    getPlayerBoardContainer,
    getComputerBoardContainer,
  };
})();

export default domController; 