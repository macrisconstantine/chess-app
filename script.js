document.addEventListener("DOMContentLoaded", function () {
    const boardElement = document.getElementById("chessboard");
    let title = document.getElementById("title");

    let draggedPiece = null;
    let draggedFrom = null;
    let currentPlayer = 'white'; // Track whose turn it is
    let enPassantTarget = null;  // Track the position of the pawn that can be captured via en passant
    let highlightedPiece = null;  // Track the currently highlighted piece
    let fullMoveDone = false;  // Track if a full move has been made
    let whiteKingMoved = false;
    let blackKingMoved = false;
    let whiteRookMoved = { kingside: false, queenside: false };
    let blackRookMoved = { kingside: false, queenside: false };

    let test = false;  // Set to true to test the game


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

    let history = [];  // To store the history of the board states

    // Helper function to make a deep copy of the board
    function cloneBoard(board) {
        return board.map(row => [...row]);  // Copy each row
    }

    
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

    undoBtn.addEventListener('click', () => {
        if (history.length > 0) {
            board = history.pop();  // Restore the previous board state
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';  // Switch player turn
            renderBoard();
        }
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
    function isValidMove(piece, fromRow, fromCol, toRow, toCol, test) {
        if (fromRow === toRow && fromCol === toCol) return false;  // The piece must move to a different square
        if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;  // Target square must be on the board
        if (piece === '') return false;  // Must select a piece to move
        if (board[toRow][toCol] && (isWhitePiece(piece) && isWhitePiece(board[toRow][toCol]) || isBlackPiece(piece) && isBlackPiece(board[toRow][toCol]))) return false;  // Cannot capture own piece
        if (currentPlayer === 'white' && !isWhitePiece(piece) && !test) return false;
        if (currentPlayer === 'black' && !isBlackPiece(piece) && !test) return false;
        if (piece.toLowerCase() === 'k') {  // Check if the piece is a king
            // Kingside Castling for white (white is on the bottom)
            if (piece === 'K' && fromRow === 0 && fromCol === 4 && toRow === 0 && toCol === 6) {
                if (!whiteKingMoved && !whiteRookMoved.kingside && 
                    board[0][5] === '' && board[0][6] === '' &&
                    isMoveSafe(piece, fromRow, fromCol, 0, 5) &&  // The square the king passes through must be safe
                    isMoveSafe(piece, fromRow, fromCol, toRow, toCol)) {  // Destination square must be safe
                    return true;  // Castling is valid
                }
            }
    
            // Queenside Castling for white (white is on the bottom)
            if (piece === 'K' && fromRow === 0 && fromCol === 4 && toRow === 0 && toCol === 2) {
                if (!whiteKingMoved && !whiteRookMoved.queenside && 
                    board[0][1] === '' && board[0][2] === '' && board[0][3] === '' &&
                    isMoveSafe(piece, fromRow, fromCol, 0, 3) &&  // The square the king passes through must be safe
                    isMoveSafe(piece, fromRow, fromCol, toRow, toCol)) {  // Destination square must be safe
                    return true;  // Castling is valid
                }
            }
    
            // Kingside Castling for black (black is on the top)
            if (piece === 'k' && fromRow === 7 && fromCol === 4 && toRow === 7 && toCol === 6) {
                if (!blackKingMoved && !blackRookMoved.kingside && 
                    board[7][5] === '' && board[7][6] === '' &&
                    isMoveSafe(piece, fromRow, fromCol, 7, 5) &&
                    isMoveSafe(piece, fromRow, fromCol, toRow, toCol)) {
                    return true;  // Castling is valid
                }
            }
    
            // Queenside Castling for black (black is on the top)
            if (piece === 'k' && fromRow === 7 && fromCol === 4 && toRow === 7 && toCol === 2) {
                if (!blackKingMoved && !blackRookMoved.queenside && 
                    board[7][1] === '' && board[7][2] === '' && board[7][3] === '' &&
                    isMoveSafe(piece, fromRow, fromCol, 7, 3) &&
                    isMoveSafe(piece, fromRow, fromCol, toRow, toCol)) {
                    return true;  // Castling is valid
                }
            }
        }
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
                enPassantTarget = { row: toRow + direction, col: toCol};  // Set the en passant target square
                return true;
            }
        }
        
        // Capture move (diagonal)
        if ((Math.abs(fromCol - toCol) === 1 ) && (fromRow - toRow === direction)) {
            // Check if the target square has an opponent piece
            return isOpponentPiece(piece, toRow, toCol) || enPassantTarget && enPassantTarget.row === toRow && enPassantTarget.col === toCol;
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

    function isKingInCheck(player) {
        const kingPosition = findKingPosition(player);
        const opponentPlayer = player === 'white' ? 'black' : 'white';
        const opponentIsWhite = opponentPlayer === 'white';
    
        // Loop through the board to check all opponent pieces and see if any can attack the king
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (kingPosition === null) return false;  // King not found (this should never happen)
                // If it's an opponent's piece, check if it can move to the king's position
                if (piece !== '' && ((opponentIsWhite && isWhitePiece(piece)) || (!opponentIsWhite && isBlackPiece(piece)))) {
                    if (isValidMove(piece, row, col, kingPosition.row, kingPosition.col, true) || (piece.toLowerCase() === 'p' && Math.abs(row - kingPosition.row) === 1 && Math.abs(col - kingPosition.col) === 1)) {
                        // Return true if any opponent piece can move to the king's position
                        return true;
                    }
                }
            }
        }
        return false;  // Return false if no opponent piece can attack the king
    }
    
    
    function findKingPosition(player) {
        const kingPiece = player === 'white' ? 'K' : 'k';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === kingPiece) {
                    return { row, col };
                }
            }
        }
        return null;  // King not found (this should never happen)
    }
    
    
    function isMoveSafe(piece, fromRow, fromCol, toRow, toCol) {
        const originalPiece = board[toRow][toCol];  // Save the piece at the target location
        
        // Temporarily make the move
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = '';
    
        const isInCheck = isKingInCheck(currentPlayer);
    
        // Undo the move
        board[fromRow][fromCol] = piece;
        board[toRow][toCol] = originalPiece;
    
        return !isInCheck;  // Return true if the king is not in check after the move
    }
    
    
    function hasLegalMoves(player) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if ((player === 'white' && isWhitePiece(piece)) || (player === 'black' && isBlackPiece(piece))) {
                    for (let targetRow = 0; targetRow < 8; targetRow++) {
                        for (let targetCol = 0; targetCol < 8; targetCol++) {
                            if (isValidMove(piece, row, col, targetRow, targetCol) && isMoveSafe(piece, row, col, targetRow, targetCol)) {
                                console.log("Legal move found for " + player + " at " + row + targetRow +", " + col + targetCol + piece);
                                return true;  // A legal move exists
                            }
                        }
                    }
                }
            }
        }
        return false;  // No legal moves available
    }
    
    
    function checkForCheckmateOrStalemate() {
        console.log("Checking for checkmate or stalemate for " + currentPlayer);
        if (!hasLegalMoves(currentPlayer)) {
            if (isKingInCheck(currentPlayer)) {
                let winner = currentPlayer === 'white' ? 'black' : 'white';
                title.innerHTML = "checkmate. " +  winner +" wins. gg ez.";
                console.log(currentPlayer + " is in checkmate! Game over.");
                gameOver();
            } else {
                title.innerHTML =  "stalemate. gg.";
                console.log(currentPlayer + " is in stalemate! Game over.");
                gameOver();
            }
        }
    }
    
    function gameOver() {
        // Handle the end of the game (e.g., display a message, stop the game, etc.)
        console.log("Game Over");
    }

    // Render the board
    function renderBoard() {
        boardElement.innerHTML = '';  // Clear the board
        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement("div");
                square.className = "square " + ((row + col) % 2 === 0 ? "black" : "white");

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

                square.addEventListener('click', (e) => {
                    if (highlightedPiece && !(highlightedPiece.parentElement.dataset.row === square.dataset.row && highlightedPiece.parentElement.dataset.col === square.dataset.col)) {
                        console.log("Highlighted Piece: ", highlightedPiece);
                        const targetRow = parseInt(square.dataset.row);
                        const targetCol = parseInt(square.dataset.col);
                        const fromRow = parseInt(highlightedPiece.parentElement.dataset.row);
                        const fromCol = parseInt(highlightedPiece.parentElement.dataset.col);
                
                        const piece = board[fromRow][fromCol];  // Get the actual piece from the board
                
                        console.log("From Position: ", fromRow, fromCol);
                        console.log("Target Position: ", targetRow, targetCol);
                        console.log("Is Move Valid: ", isValidMove(piece, fromRow, fromCol, targetRow, targetCol));
                
                        if (isValidMove(piece, fromRow, fromCol, targetRow, targetCol) && 
                            (board[targetRow][targetCol] === '' || isOpponentPiece(piece, targetRow, targetCol)) && 
                            isMoveSafe(piece, fromRow, fromCol, targetRow, targetCol)) {
                            
                            // Save the current state to history before making a move
                            history.push(cloneBoard(board));  // Save the board before the move
                           
                            if (piece.toLowerCase() === 'k' && Math.abs(targetCol - fromCol) === 2) {
                                // Castling move detected
                                if (targetCol === 6) {  // Kingside castling
                                    board[fromRow][5] = board[fromRow][7];  // Move the rook
                                    board[fromRow][7] = '';  // Clear the original rook position
                                } else if (targetCol === 2) {  // Queenside castling
                                    board[fromRow][3] = board[fromRow][0];  // Move the rook
                                    board[fromRow][0] = '';  // Clear the original rook position
                                }
                            }
                            
                            // Handle en passant
                            if (piece.toLowerCase() === 'p' && enPassantTarget) {
                                if (targetRow === enPassantTarget.row && targetCol === enPassantTarget.col) {
                                    // Remove the captured pawn (en passant capture)
                                    board[enPassantTarget.row + (piece === 'P' ? -1 : 1)][enPassantTarget.col] = '';
                                }
                            }
                
                            // Move the piece
                            board[fromRow][fromCol] = '';
                            board[targetRow][targetCol] = piece;

                            // Update king/rook movement flags
                            if (piece === 'K') whiteKingMoved = true;
                            if (piece === 'k') blackKingMoved = true;
                            if (piece === 'R' && fromRow === 7 && fromCol === 0) whiteRookMoved.queenside = true;
                            if (piece === 'R' && fromRow === 7 && fromCol === 7) whiteRookMoved.kingside = true;
                            if (piece === 'r' && fromRow === 0 && fromCol === 0) blackRookMoved.queenside = true;
                            if (piece === 'r' && fromRow === 0 && fromCol === 7) blackRookMoved.kingside = true;

                
                            // Switch player turn
                            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
                            console.log("Current Player: ", currentPlayer);
                
                            if (fullMoveDone) {
                                enPassantTarget = null;  // Clear enPassantTarget after a full move
                                fullMoveDone = false;
                            }
                
                            // Clear enPassantTarget after a move
                            if (enPassantTarget != null) {
                                fullMoveDone = true;
                            }
                
                            renderBoard();
                            checkForCheckmateOrStalemate();
                        } else {
                            console.log("Invalid move: King would be in check or move not valid");
                        }
                    }
                });
                

                square.addEventListener('drop', (e) => {
                    const targetRow = parseInt(square.dataset.row);
                    const targetCol = parseInt(square.dataset.col);
                
                    if (draggedPiece && draggedFrom) {
                        const fromRow = draggedFrom.row;
                        const fromCol = draggedFrom.col;
                
                        // Debugging statements
                        console.log("Dragged Piece: ", draggedPiece);
                        console.log("From Position: ", fromRow, fromCol);
                        console.log("Target Position: ", targetRow, targetCol);
                        console.log("Is Move Valid: ", isValidMove(draggedPiece, fromRow, fromCol, targetRow, targetCol));  
                        console.log("Is Move Safe: ", isMoveSafe(draggedPiece, fromRow, fromCol, targetRow, targetCol));

                        // Validate move
                        if (isValidMove(draggedPiece, fromRow, fromCol, targetRow, targetCol) && 
                            (board[targetRow][targetCol] === '' || isOpponentPiece(draggedPiece, targetRow, targetCol)) && 
                            isMoveSafe(draggedPiece, fromRow, fromCol, targetRow, targetCol)) {
                
                            // Save the current state to history before making a move
                            history.push(cloneBoard(board));  // Save the board before the move
                            
                            if (draggedPiece.toLowerCase() === 'k' && Math.abs(targetCol - fromCol) === 2) {
                                // Castling move detected
                                if (targetCol === 6) {  // Kingside castling
                                    board[fromRow][5] = board[fromRow][7];  // Move the rook
                                    board[fromRow][7] = '';  // Clear the original rook position
                                } else if (targetCol === 2) {  // Queenside castling
                                    board[fromRow][3] = board[fromRow][0];  // Move the rook
                                    board[fromRow][0] = '';  // Clear the original rook position
                                }
                            }

                            // Handle en passant
                            if (draggedPiece.toLowerCase() === 'p' && enPassantTarget) {
                                if (targetRow === enPassantTarget.row && targetCol === enPassantTarget.col) {
                                    // Remove the captured pawn (en passant capture)
                                    board[enPassantTarget.row + (draggedPiece === 'P' ? -1 : 1)][enPassantTarget.col] = '';
                                }
                            }
                
                            // Move the piece
                            board[fromRow][fromCol] = '';
                            board[targetRow][targetCol] = draggedPiece;
                
                            // Update king/rook movement flags
                            if (piece === 'K') whiteKingMoved = true;
                            if (piece === 'k') blackKingMoved = true;
                            if (piece === 'R' && fromRow === 7 && fromCol === 0) whiteRookMoved.queenside = true;
                            if (piece === 'R' && fromRow === 7 && fromCol === 7) whiteRookMoved.kingside = true;
                            if (piece === 'r' && fromRow === 0 && fromCol === 0) blackRookMoved.queenside = true;
                            if (piece === 'r' && fromRow === 0 && fromCol === 7) blackRookMoved.kingside = true;

                            // Switch player turn
                            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
                            console.log("Current Player: ", currentPlayer);
                            if (fullMoveDone) {
                                enPassantTarget = null;  // Clear enPassantTarget after a full move
                                fullMoveDone = false;
                            }
                
                            // Clear enPassantTarget after a move
                            if (enPassantTarget != null) {
                                fullMoveDone = true;
                            }
                
                            renderBoard();
                
                            checkForCheckmateOrStalemate();
                        } else {
                            console.log("Invalid move: King would be in check or move not valid");
                        }
                
                        // Reset dragged piece and position
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

