import '../public/style.css';
import Ship from './ship';
import Gameboard from './gameboard'; // Although mocked in tests, we need the real one here
import Player from './player';
import domController from './domController';

// Game State
let player;
let computer;
let currentPlayer;
let gameOver = false;

function setupGame() {
  // 1. Create Players and Boards
  player = Player('human');
  computer = Player('computer');

  // 2. Place Ships (Predetermined for now)
  // TODO: Implement player ship placement UI later
  try {
    player.gameboard.placeShip(Ship(5), 0, 0, false); // Carrier
    player.gameboard.placeShip(Ship(4), 2, 1, true);  // Battleship
    player.gameboard.placeShip(Ship(3), 4, 4, false); // Cruiser
    player.gameboard.placeShip(Ship(3), 6, 0, true);  // Submarine
    player.gameboard.placeShip(Ship(2), 8, 8, false); // Destroyer

    // Place computer ships randomly (simple implementation)
    // A more robust placement strategy could be added later
    placeComputerShipsRandomly(computer.gameboard);

  } catch (error) {
      console.error("Error placing ships:", error);
      // Handle error appropriately, maybe reset or alert user
      domController.displayMessage("Error setting up the board. Please refresh.");
      return; // Stop setup if ships can't be placed
  }

  // 3. Initial Render
  domController.renderBoard(player.gameboard, domController.playerBoardContainer, false);
  domController.renderBoard(computer.gameboard, domController.computerBoardContainer, true); // Mark as enemy board

  // 4. Set starting player and update message
  currentPlayer = player;
  domController.displayMessage("Your turn! Attack the enemy board.");

  // 5. Add event listeners to enemy board
  addAttackListeners();
}

function placeComputerShipsRandomly(board) {
    const shipLengths = [5, 4, 3, 3, 2];
    const boardSize = 10;

    for (const length of shipLengths) {
        let placed = false;
        while (!placed) {
            const row = Math.floor(Math.random() * boardSize);
            const col = Math.floor(Math.random() * boardSize);
            const isVertical = Math.random() < 0.5;
            try {
                board.placeShip(Ship(length), row, col, isVertical);
                placed = true;
            } catch (error) {
                // Collision or out of bounds, try again
                // console.log(`Placement failed for length ${length} at ${row},${col}, vertical: ${isVertical}. Retrying...`);
            }
        }
    }
}

function addAttackListeners() {
    domController.computerBoardContainer.addEventListener('click', handlePlayerAttack);
}

function removeAttackListeners() {
    domController.computerBoardContainer.removeEventListener('click', handlePlayerAttack);
}

function handlePlayerAttack(event) {
    if (gameOver || currentPlayer !== player || !event.target.classList.contains('enemy-cell')) {
        return; // Ignore clicks if game over, not player's turn, or not a valid cell
    }

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    try {
        const hit = player.attack(row, col, computer.gameboard);
        domController.updateCell(row, col, hit ? 'hit' : 'miss', 'computer');

        if (computer.gameboard.allShipsSunk()) {
            endGame(player); // Player wins
        } else {
            // Switch to computer's turn
            switchTurn();
        }
    } catch (error) {
        // Likely tried to attack the same spot again
        console.warn("Attack failed:", error.message);
        domController.displayMessage(`Attack failed: ${error.message}. Try again.`);
    }
}

function computerTurn() {
    if (gameOver || currentPlayer !== computer) return;

    domController.displayMessage("Computer's turn...");
    removeAttackListeners(); // Prevent player clicks during computer turn

    // Simple delay for visual effect
    setTimeout(() => {
        try {
            // Computer makes a random valid attack
            // We need the result to update the *player's* board display
            const attackCoords = computer.computerAttack(player.gameboard); // computerAttack should ideally return coords or result
            
            // We need to know *where* the computer attacked to update the DOM.
            // Let's modify computerAttack or get the last attack info.
            // For now, we *assume* computerAttack handles its own logic correctly
            // but we don't know the row/col easily here to update the DOM.
            
            // *** Temporary Workaround: Find the last missed/hit spot ***
            // This is inefficient. A better approach is needed.
            const [lastRow, lastCol, attackResult] = findLastComputerAttack(player.gameboard);

            if(lastRow !== null) { // If an attack was actually made
                 domController.updateCell(lastRow, lastCol, attackResult ? 'hit' : 'miss', 'player');
            }
            // *** End Temporary Workaround ***

            if (player.gameboard.allShipsSunk()) {
                endGame(computer); // Computer wins
            } else {
                // Switch back to player's turn
                switchTurn();
            }
        } catch (error) {
            console.error("Computer attack error:", error);
            // Handle cases where computer fails (e.g., board full - should be caught by endGame)
            // Might need to switch turn anyway or declare draw?
            switchTurn(); // Switch back even if error for now
        }
    }, 1000); // 1 second delay
}

// Helper function (TEMPORARY WORKAROUND)
function findLastComputerAttack(playerBoard) {
    // This needs access to the internal state of playerBoard which is bad practice.
    // Requires Gameboard to expose attackedCoords or similar.
    // Let's assume Gameboard has getAttackedCoords() for now.
    const attacked = playerBoard.attackedCoords || new Set(); // Need to modify Gameboard to expose this
    if (attacked.size === 0) return [null, null, null];

    const lastCoordStr = Array.from(attacked).pop();
    const [row, col] = lastCoordStr.split(',').map(Number);
    const cellContent = playerBoard.getGrid()[row][col]; // Check the actual grid content
    
    // Determine if it was a hit or miss based on grid content *after* attack
    // If cellContent is a ship, it must have been hit. If null, it was a miss.
    // This assumes receiveAttack leaves the ship object on hit.
    const isHit = (cellContent && typeof cellContent.isSunk === 'function');

    return [row, col, isHit];
}


function switchTurn() {
  if (gameOver) return;

  currentPlayer = currentPlayer === player ? computer : player;
  
  if (currentPlayer === player) {
      domController.displayMessage("Your turn!");
      addAttackListeners(); // Re-enable player attacks
  } else {
      // Computer's turn
      computerTurn();
  }
}

function endGame(winner) {
  gameOver = true;
  removeAttackListeners();
  const winnerName = winner.getType() === 'human' ? 'You' : 'Computer';
  domController.displayMessage(`${winnerName} win! All enemy ships have been sunk.`);
  // TODO: Add a reset button or further game over logic
}


// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', setupGame); 