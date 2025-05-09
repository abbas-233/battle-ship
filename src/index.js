import '../public/style.css';
import Ship from './ship.js';
import Gameboard from './gameboard.js';
import Player from './player.js';
import domController from './domController.js';
import audioController from './audioController.js';

// --- State Variables ---
let player;
let computer;
let currentPlayer;
let gameOver = false;
let playerShips = []; // Array to hold the ship objects for placement
let currentPlacingShip = null; // { length, name, index }
let isVertical = false; // Current placement orientation

// Define the standard fleet
const FLEET = [
    { name: 'Carrier', length: 5 },
    { name: 'Battleship', length: 4 },
    { name: 'Cruiser', length: 3 },
    { name: 'Submarine', length: 3 },
    { name: 'Destroyer', length: 2 },
];

// --- Game Initialization and Reset ---
function initializeGame() {
    gameOver = false;
    player = Player('human');
    computer = Player('computer');
    playerShips = FLEET.map(ship => ({ ...ship, placed: false })); // Reset placement status
    currentPlacingShip = null;
    isVertical = false;

    // Place computer ships randomly
    placeComputerShipsRandomly(computer.gameboard);

    // Render empty player board and ship list for placement
    domController.renderBoard(player.gameboard, domController.getPlayerBoardContainer(), false);
    domController.renderShipList(playerShips, handleShipSelection);
    domController.updateRotationButton(isVertical);
    domController.setPlacementPhaseUI(true); // Activate placement UI
    addPlacementListeners();

    domController.displayMessage('Place your ships! Select a ship, use Rotate button, then click board.');
}

function resetGame() {
    removePlacementListeners();
    removeAttackListeners();
    // Clear boards (or create new players/boards)
    // Re-initialize
    initializeGame();
}

// --- Ship Placement Logic ---
function placeComputerShipsRandomly(board) {
    const boardSize = 10; // Assuming 10x10
    FLEET.forEach(shipInfo => {
        let placed = false;
        while (!placed) {
            const row = Math.floor(Math.random() * boardSize);
            const col = Math.floor(Math.random() * boardSize);
            const vertical = Math.random() < 0.5;
            try {
                // Use the actual Ship factory here
                board.placeShip(Ship(shipInfo.length), row, col, vertical);
                placed = true;
            } catch (error) {
                // Collision or out of bounds, try again
            }
        }
    });
}

function handleShipSelection(length, name, index) {
    // Only select if not already placed
    if (!playerShips[index].placed) {
        currentPlacingShip = { length, name, index };
        domController.displayMessage(`Placing ${name}. Click on your board.`);
    } else {
        domController.displayMessage(`${name} already placed.`);
    }
}

function handleRotateShip() {
    isVertical = !isVertical;
    domController.updateRotationButton(isVertical);
    // If a ship is selected, update hover immediately (optional)
    // Requires knowing the last hover position, maybe add later
}

function handleBoardHover(event) {
    if (!currentPlacingShip || !event.target.classList.contains('cell')) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    // Check if placement is potentially valid (bounds and overlap)
    // This requires a method on Gameboard to check without actually placing
    const isValid = checkPlacement(player.gameboard, currentPlacingShip.length, row, col, isVertical);

    domController.highlightPlacement(row, col, currentPlacingShip.length, isVertical, isValid);
}

function handleBoardLeave() {
    domController.clearPlacementHighlights();
}

function handleBoardClick(event) {
    if (!currentPlacingShip || !event.target.classList.contains('cell')) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    try {
        // Attempt to place the ship
        player.gameboard.placeShip(Ship(currentPlacingShip.length), row, col, isVertical);
        
        // Mark ship as placed in our tracking array
        playerShips[currentPlacingShip.index].placed = true;
        
        // Visually update the board WITH the newly placed ship
        domController.renderBoard(player.gameboard, domController.getPlayerBoardContainer(), false);
        
        // Update the ship list UI (e.g., disable/grey out placed ship)
        domController.renderShipList(playerShips, handleShipSelection); 
        
        currentPlacingShip = null; // Clear selection
        domController.clearPlacementHighlights();
        domController.displayMessage('Ship placed! Select the next ship.');

        // Check if all ships are placed
        if (playerShips.every(ship => ship.placed)) {
            domController.displayMessage('All ships placed! Press Start Game.');
            domController.enableStartButton();
            removePlacementListeners(); // Optional: remove board listeners after all placed
        }

    } catch (error) {
        console.warn("Placement failed:", error.message);
        domController.displayMessage(`Cannot place ship here: ${error.message}. Try again.`);
        // Highlights should already show invalid from hover, but can re-trigger if needed
    }
}

// Helper function to check placement validity without modifying the board
function checkPlacement(board, length, row, col, isVertical) {
    const boardSize = 10; // Assuming 10x10
    const grid = board.getGrid(); // Use getGrid to check current state

    // Check bounds
    if (isVertical) {
        if (row + length > boardSize) return false;
    } else {
        if (col + length > boardSize) return false;
    }

    // Check overlap
    for (let i = 0; i < length; i++) {
        const r = isVertical ? row + i : row;
        const c = isVertical ? col : col + i;
        if (!board.isValidCoordinate(r, c) || grid[r][c] !== null) {
            return false;
        }
    }
    return true;
}


// --- Combat Phase Logic ---

function startGame() {
    if (!playerShips.every(ship => ship.placed)) {
        domController.displayMessage("Please place all your ships first!");
        return;
    }

    removePlacementListeners();
    domController.setPlacementPhaseUI(false); // Deactivate placement UI, show computer board
    
    // Render boards for combat (hide player ships on enemy board)
    domController.renderBoard(player.gameboard, domController.getPlayerBoardContainer(), false, true);
    domController.renderBoard(computer.gameboard, domController.getComputerBoardContainer(), true, false); // Don't show computer ships

    currentPlayer = player; // Player starts
    gameOver = false;
    domController.displayMessage("Game started! Your turn. Attack the enemy board.");
    addAttackListeners();
}

function addAttackListeners() {
    // Ensure the container exists before adding listener
    const computerBoardEl = domController.getComputerBoardContainer();
    if (computerBoardEl) {
        computerBoardEl.addEventListener('click', handlePlayerAttack);
    }
}

function removeAttackListeners() {
    const computerBoardEl = domController.getComputerBoardContainer();
    if (computerBoardEl) {
        computerBoardEl.removeEventListener('click', handlePlayerAttack);
    }
}

function handlePlayerAttack(event) {
    if (gameOver || currentPlayer !== player || !event.target.classList.contains('enemy-cell')) {
        return; 
    }

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    try {
        const hit = player.attack(row, col, computer.gameboard);
        // Pass boolean hit status to updateCell
        domController.updateCell(row, col, hit, 'computer'); 
        
        // Play appropriate sound based on hit result
        if (hit) {
            audioController.playHitSound();
            // Check if the ship was sunk by this hit
            const targetShip = computer.gameboard.getGrid()[row][col];
            if (targetShip && targetShip.isSunk()) {
                audioController.playSunkSound();
                domController.displayMessage("You sunk an enemy ship!");
            }
        } else {
            audioController.playMissSound();
        }

        if (computer.gameboard.allShipsSunk()) {
            endGame(player); // Player wins
        } else {
            switchTurn();
        }
    } catch (error) {
        console.warn("Attack failed:", error.message);
        domController.displayMessage(`Attack failed: ${error.message}. Try again.`);
    }
}

function computerTurn() {
    if (gameOver || currentPlayer !== computer) return;

    domController.displayMessage("Computer's turn...");
    removeAttackListeners(); 

    setTimeout(() => {
        try {
            // *** Refactored Computer Attack ***
            // Modify computerAttack to return coordinates
            const { row, col, hit } = computer.computerIntelligentAttack(player.gameboard);
            
            if(row !== null && col !== null) { // If an attack was made
                 domController.updateCell(row, col, hit, 'player');
                 
                 // Play appropriate sound for computer's attack too
                 if (hit) {
                     audioController.playHitSound();
                     // Check if the ship was sunk by this hit
                     const targetShip = player.gameboard.getGrid()[row][col];
                     if (targetShip && targetShip.isSunk()) {
                         audioController.playSunkSound();
                         domController.displayMessage("Computer sunk one of your ships!");
                     }
                 } else {
                     audioController.playMissSound();
                 }
            }
            // *** End Refactored Part ***

            if (player.gameboard.allShipsSunk()) {
                endGame(computer); // Computer wins
            } else {
                switchTurn();
            }
        } catch (error) {
            console.error("Computer attack error:", error);
            switchTurn(); // Switch back even if error for now
        }
    }, 1000); 
}

function switchTurn() {
  if (gameOver) return;

  currentPlayer = currentPlayer === player ? computer : player;
  
  if (currentPlayer === player) {
      domController.displayMessage("Your turn!");
      addAttackListeners(); 
  } else {
      computerTurn();
  }
}

function endGame(winner) {
  gameOver = true;
  removeAttackListeners();
  removePlacementListeners(); // Ensure placement listeners are off too
  const winnerName = winner.getType() === 'human' ? 'You' : 'Computer';
  
  // Play game over sound
  audioController.playGameOverSound();
  
  domController.showGameOverUI(winnerName); // Use dedicated function for game over UI
}

// --- Event Listeners Setup ---
function addPlacementListeners() {
    const rotateBtn = domController.getRotateButton();
    const randomBtn = domController.getRandomPlacementButton();
    const startBtn = domController.getStartButton();
    const playerBoardEl = domController.getPlayerBoardContainer();

    if (rotateBtn) rotateBtn.addEventListener('click', handleRotateShip);
    if (randomBtn) randomBtn.addEventListener('click', handleRandomPlacement);
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (playerBoardEl) {
        playerBoardEl.addEventListener('mouseover', handleBoardHover);
        playerBoardEl.addEventListener('mouseout', handleBoardLeave);
        playerBoardEl.addEventListener('click', handleBoardClick);
    }
}

function removePlacementListeners() {
    const playerBoardEl = domController.getPlayerBoardContainer();
    if (playerBoardEl) {
        playerBoardEl.removeEventListener('mouseover', handleBoardHover);
        playerBoardEl.removeEventListener('mouseout', handleBoardLeave);
        playerBoardEl.removeEventListener('click', handleBoardClick);
    }
}

// --- Game Setup ---

// Centralized function to set up the initial game state and listeners
function setupGame() {
    initializeGame(); // Set up boards, players, and placement UI

    // Add listeners for global controls that are always present
    domController.getRotateButton().addEventListener('click', handleRotateShip);
    domController.getRandomPlacementButton().addEventListener('click', handleRandomPlacement);
    domController.getStartButton().addEventListener('click', startGame);
    domController.getResetButton().addEventListener('click', resetGame);
    domController.getSoundToggleButton().addEventListener('click', toggleSound);

    // Initialize sound button text
    domController.updateSoundButton(audioController.isSoundEnabled());

    // Reset button is initially hidden, handled by domController
}

// --- Sound Toggling ---

function toggleSound() {
    const isEnabled = audioController.toggleSound();
    domController.updateSoundButton(isEnabled);
    console.log("Sound toggled:", isEnabled);
}

// --- Random Placement ---

function handleRandomPlacement() {
    // Clear existing player ships first
    player.gameboard.clearBoard(); 
    // Place ships randomly
    placeComputerShipsRandomly(player.gameboard); // Can reuse the same logic
    
    // Mark all ships as placed in the tracking array
    playerShips.forEach(ship => ship.placed = true);
    currentPlacingShip = null;

    // Update UI
    domController.renderBoard(player.gameboard, domController.getPlayerBoardContainer(), false, true); // Show placed ships
    domController.renderShipList(playerShips, handleShipSelection); // Update list (should show all placed/disabled)
    domController.clearPlacementHighlights();
    domController.displayMessage('Ships placed randomly! Press Start Game.');
    domController.enableStartButton();
    removePlacementListeners(); // Remove manual placement listeners
}

// --- Start the game ---

// Kick off the initial setup when the script loads
document.addEventListener('DOMContentLoaded', setupGame); 