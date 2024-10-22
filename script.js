document.addEventListener("DOMContentLoaded", function () {
    const boardElement = document.getElementById("chessboard");

    let draggedPiece = null;
    let draggedFrom = null;
    let currentPlayer = 'white'; // Track whose turn it is

    let board = [
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
    ];

    
    newGameBtn.addEventListener('click', () => {
        board = [
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
        ];
        currentPlayer = 'white';
        renderBoard();
        console.log('New game started');
    });

    const pieceImages = {
        'R': 'pieces/white-rook.png',
        'N': 'pieces/white-knight.png',
        'B': 'pieces/white-bishop.png',
        'Q': 'pieces/white-queen.png',
        'K': 'pieces/white-king.png',
        'P': 'pieces/white-pawn.png',
        'r': 'pieces/black-rook.png',
        'n': 'pieces/black-knight.png',
        'b': 'pieces/black-bishop.png',
        'q': 'pieces/black-queen.png',
        'k': 'pieces/black-king.png',
        'p': 'pieces/black-pawn.png',
    };

    const isWhitePiece = (piece) => /^[RNBQKP]$/.test(piece);
    const isBlackPiece = (piece) => /^[rnbqkp]$/.test(piece);

    // Move validation functions for each type of piece
    function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
        if (currentPlayer === 'white' && !isWhitePiece(piece)) return false;
        if (currentPlayer === 'black' && !isBlackPiece(piece)) return false;
        switch (piece.toLowerCase()) {
            case 'p': return isValidPawnMove(piece, fromRow, fromCol, toRow, toCol);
            case 'r': return isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'n': return isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'b': return isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'q': return isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'k': return isValidKingMove(fromRow, fromCol, toRow, toCol);
            default: return false;
        }
    }

        function isValidPawnMove(piece, fromRow, fromCol, toRow, toCol) {
        const direction = piece === 'P' ? -1 : 1; // White moves up (-1), Black moves down (+1)
        const startRow = piece === 'P' ? 1 : 6; // Starting position for pawns

        // Normal move (forward by 1)
        if (fromCol === toCol && !board[toRow][toCol]) {
            // Move forward one square
            if (fromRow - toRow === direction) return true;
            // Move forward two squares (only from starting position)
            if (fromRow === startRow && (fromRow - toRow) === (2 * direction) ) {
                return true;
            }
        }
        
        // Capture move (diagonal)
        if ((Math.abs(fromCol - toCol) === 1 ) && (fromRow - toRow === direction)) {
            // Check if the target square has an opponent piece
            return isOpponentPiece(piece, toRow, toCol);
        }
        
        return false; // Invalid move
    }

    

    function isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return isPathClear(fromRow, fromCol, toRow, toCol);
    }

    function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
        return isPathClear(fromRow, fromCol, toRow, toCol);
    }

    function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        return isValidRookMove(fromRow, fromCol, toRow, toCol) || isValidBishopMove(fromRow, fromCol, toRow, toCol);
    }

    function isValidKingMove(fromRow, fromCol, toRow, toCol) {
        return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
    }

    function isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowDir = fromRow < toRow ? 1 : fromRow > toRow ? -1 : 0;
        const colDir = fromCol < toCol ? 1 : fromCol > toCol ? -1 : 0;

        let row = fromRow + rowDir;
        let col = fromCol + colDir;

        while (row !== toRow || col !== toCol) {
            if (board[row][col]) return false;
            row += rowDir;
            col += colDir;
        }
        return true;
    }

    function isOpponentPiece(piece, targetRow, targetCol) {
        if (currentPlayer === 'white') {
            return isBlackPiece(board[targetRow][targetCol]);
        } else {
            return isWhitePiece(board[targetRow][targetCol]);
        }
    }

    let highlightedPiece = null; // To track the currently highlighted piece

    // Render the board
    function renderBoard() {
        boardElement.innerHTML = '';  // Clear the board
        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement("div");
                square.className = "square " + ((row + col) % 2 === 0 ? "white" : "black");

                square.dataset.row = row;
                square.dataset.col = col;

                const piece = board[row][col];
                if (piece) {
                    const pieceImg = document.createElement("img");
                    pieceImg.src = pieceImages[piece];
                    pieceImg.className = "piece";
                    pieceImg.draggable = true;  // Make pieces draggable

                    // Drag event listeners
                    pieceImg.addEventListener('dragstart', (e) => {
                        draggedPiece = piece;
                        draggedFrom = { row, col };
                    });

                     // Click event for selecting a piece
                    pieceImg.addEventListener('click', () => {
                        // Remove highlight from the previously highlighted piece
                        if (highlightedPiece) {
                            highlightedPiece.classList.remove('highlight');
                        }
                        if (currentPlayer === 'white' && !isWhitePiece(piece)) return false;
                        if (currentPlayer === 'black' && !isBlackPiece(piece)) return false;
                        // Highlight the currently clicked piece
                        highlightedPiece = pieceImg; // Store the current highlighted piece
                        highlightedPiece.classList.add('highlight'); // Add highlight class
                    });

                    square.appendChild(pieceImg);
                }

                // Drop event listeners
                square.addEventListener('dragover', (e) => {
                    e.preventDefault()}
                );
                square.addEventListener('drop', (e) => {
                    const targetRow = parseInt(square.dataset.row);
                    const targetCol = parseInt(square.dataset.col);

                    if (draggedPiece && draggedFrom) {
                        const fromRow = draggedFrom.row;
                        const fromCol = draggedFrom.col;

                        // Validate move
                        if (isValidMove(draggedPiece, fromRow, fromCol, targetRow, targetCol) &&
                            (board[targetRow][targetCol] === '' || isOpponentPiece(draggedPiece, targetRow, targetCol))) {

                            // Move the piece
                            board[fromRow][fromCol] = '';
                            board[targetRow][targetCol] = draggedPiece;

                            // Switch player turn
                            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

                            renderBoard();
                        }
                        draggedPiece = null;
                        draggedFrom = null;
                    }
                });

                boardElement.appendChild(square);
            }
        }
    }

    renderBoard();
});

