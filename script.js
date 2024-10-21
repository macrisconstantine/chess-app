document.addEventListener("DOMContentLoaded", function () {
    const boardElement = document.getElementById("chessboard");

    const board = [
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
    ];

    // Render the board
    function renderBoard() {
        boardElement.innerHTML = '';  // Clear the board
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement("div");
                square.className = "square " + ((row + col) % 2 === 0 ? "white" : "black");
                square.innerHTML = board[row][col] ? board[row][col] : '';
                boardElement.appendChild(square);
            }
        }
    }

    // Initialize the board
    renderBoard();

    // Button event listeners
    document.getElementById("newGameBtn").addEventListener("click", function() {
        console.log("New Game button clicked!");
        // Reset the board to initial state
        // Add reset logic here
        renderBoard();
    });

    document.getElementById("undoBtn").addEventListener("click", function() {
        console.log("Undo button clicked!");
        // Add undo logic here
    });
});
