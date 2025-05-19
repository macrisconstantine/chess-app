document.addEventListener("DOMContentLoaded", function () {
    const boardElement = document.getElementById("chessboard");
    let title = document.getElementById("title");
    let pgn = document.getElementById("move-pgn");

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
    let moveCount = 0;  // Track the number of moves made
    let isGameOver = false;  // Track if the game is over

    let test = false;  // Set to true to test the game


    let board = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],  // Black back rank (row 1)
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],  // Black pawns (row 2)
        ['', '', '', '', '', '', '', ''],          // Empty row 3
        ['', '', '', '', '', '', '', ''],          // Empty row 4
        ['', '', '', '', '', '', '', ''],          // Empty row 5
        ['', '', '', '', '', '', '', ''],          // Empty row 6
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],  // White pawns (row 7)
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],  // White back rank (row 8)
    ];

    let history = [];  // To store the history of the board states

    // Helper function to make a deep copy of the board
    function cloneBoard(board) {
        return board.map(row => [...row]);  // Copy each row
    }

    
    newGameBtn.addEventListener('click', () => {
        board = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],  // Black back rank (row 1)
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],  // Black pawns (row 2)
        ['', '', '', '', '', '', '', ''],          // Empty row 3
        ['', '', '', '', '', '', '', ''],          // Empty row 4
        ['', '', '', '', '', '', '', ''],          // Empty row 5
        ['', '', '', '', '', '', '', ''],          // Empty row 6
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],  // White pawns (row 7)
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],  // White back rank (row 8)
        ];
        currentPlayer = 'white';
        whiteKingMoved = false;
        blackKingMoved = false;
        whiteRookMoved = { kingside: false, queenside: false };
        blackRookMoved = { kingside: false, queenside: false };
        moveCount = 0;
        // history = [];
        enPassantTarget = null;
        highlightedPiece = null;
        fullMoveDone = false;
        pgn.innerHTML = '';
        title.innerHTML = "lydia didn't make chess";
        isGameOver = false;
        updateEvaluationBar(0);
        renderBoard();
        console.log('New game started');
    });

    undoBtn.addEventListener('click', () => {
        if (history.length > 0) {
            isGameOver = false;  // Reset the game over flag
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

    function getLegalMovesForPiece(row, col) {
        const piece = board[row][col];
        const moves = [];

        if (!piece) return moves;

        if (piece === 'P') { // White pawn
            if (!board[row - 1][col]) {
                moves.push({ row: row - 1, col }); // One step forward
                if (row === 6 && !board[row - 2][col]) {
                    moves.push({ row: row - 2, col }); // Two steps on first move
                }
            }
            // Add captures, en passant, etc...
        }

        // Add logic for other piece types

        return moves;
    }


    function isValidMove(piece, fromRow, fromCol, targetRow, targetCol, test) {
        if (fromRow === targetRow && fromCol === targetCol) return false;  // The piece must move to a different square
        if (targetRow < 0 || targetRow > 7 || targetCol < 0 || targetCol > 7) return false;  // Target square must be on the board
        if (piece === '') return false;  // Must select a piece to move
        if (board[targetRow][targetCol] && (isWhitePiece(piece) && isWhitePiece(board[targetRow][targetCol]) || isBlackPiece(piece) && isBlackPiece(board[targetRow][targetCol]))) return false;  // Cannot capture own piece
        if (currentPlayer === 'white' && !isWhitePiece(piece) && !test) return false;
        if (currentPlayer === 'black' && !isBlackPiece(piece) && !test) return false;
    
        // Check if the piece is a king
        if (piece.toLowerCase() === 'k') {  
    
            // Kingside Castling for white (white is on row 7)
            if (piece === 'K' && fromRow === 7 && fromCol === 4 && targetRow === 7 && targetCol === 6) {
                if (!whiteKingMoved && !whiteRookMoved.kingside && 
                    board[7][5] === '' && board[7][6] === '' &&
                    isMoveSafe(piece, fromRow, fromCol, 7, 5) &&  // The square the king passes through must be safe
                    isMoveSafe(piece, fromRow, fromCol, targetRow, targetCol)) {  // Destination square must be safe
                    return true;  // Castling is valid
                }
            }
    
            // Queenside Castling for white (white is on row 7)
            if (piece === 'K' && fromRow === 7 && fromCol === 4 && targetRow === 7 && targetCol === 2) {
                if (!whiteKingMoved && !whiteRookMoved.queenside && 
                    board[7][1] === '' && board[7][2] === '' && board[7][3] === '' &&
                    isMoveSafe(piece, fromRow, fromCol, 7, 3) &&  // The square the king passes through must be safe
                    isMoveSafe(piece, fromRow, fromCol, targetRow, targetCol)) {  // Destination square must be safe
                    return true;  // Castling is valid
                }
            }
    
            // Kingside Castling for black (black is on row 0)
            if (piece === 'k' && fromRow === 0 && fromCol === 4 && targetRow === 0 && targetCol === 6) {
                if (!blackKingMoved && !blackRookMoved.kingside && 
                    board[0][5] === '' && board[0][6] === '' &&
                    isMoveSafe(piece, fromRow, fromCol, 0, 5) &&
                    isMoveSafe(piece, fromRow, fromCol, targetRow, targetCol)) {
                    return true;  // Castling is valid
                }
            }
    
            // Queenside Castling for black (black is on row 0)
            if (piece === 'k' && fromRow === 0 && fromCol === 4 && targetRow === 0 && targetCol === 2) {
                if (!blackKingMoved && !blackRookMoved.queenside && 
                    board[0][1] === '' && board[0][2] === '' && board[0][3] === '' &&
                    isMoveSafe(piece, fromRow, fromCol, 0, 3) &&
                    isMoveSafe(piece, fromRow, fromCol, targetRow, targetCol)) {
                    return true;  // Castling is valid
                }
            }
        }
        switch (piece.toLowerCase()) {
            case 'p': return isValidPawnMove(piece, fromRow, fromCol, targetRow, targetCol);
            case 'r': return isValidRookMove(fromRow, fromCol, targetRow, targetCol);
            case 'n': return isValidKnightMove(fromRow, fromCol, targetRow, targetCol);
            case 'b': return isValidBishopMove(fromRow, fromCol, targetRow, targetCol);
            case 'q': return isValidQueenMove(fromRow, fromCol, targetRow, targetCol);
            case 'k': return isValidKingMove(fromRow, fromCol, targetRow, targetCol);
            default: return false;
        }
    }

    function isValidPawnMove(piece, fromRow, fromCol, targetRow, targetCol) {
        const direction = piece === 'P' ? 1 : -1; // White moves up (-1), Black moves down (+1)
        const startRow = piece === 'P' ? 6 : 1; // Starting position for pawns

        // Normal move (forward by 1)
        if (fromCol === targetCol && !board[targetRow][targetCol]) {
            // Move forward one square
            if (fromRow - targetRow === direction) return true;
            // Move forward two squares (only from starting position)
            if (fromRow === startRow && (fromRow - targetRow) === (2 * direction) ) {
                enPassantTarget = { row: targetRow + direction, col: targetCol};  // Set the en passant target square
                return true;
            }
        }
        
        // Capture move (diagonal)
        if ((Math.abs(fromCol - targetCol) === 1 ) && (fromRow - targetRow === direction)) {
            // Check if the target square has an opponent piece
            return isOpponentPiece(piece, targetRow, targetCol) || enPassantTarget && enPassantTarget.row === targetRow && enPassantTarget.col === targetCol;
        }
        
        return false; // Invalid move
    }

    function isValidRookMove(fromRow, fromCol, targetRow, targetCol) {
        if (fromRow !== targetRow && fromCol !== targetCol) return false;
        return isPathClear(fromRow, fromCol, targetRow, targetCol);
    }

    function isValidKnightMove(fromRow, fromCol, targetRow, targetCol) {
        const rowDiff = Math.abs(fromRow - targetRow);
        const colDiff = Math.abs(fromCol - targetCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    function isValidBishopMove(fromRow, fromCol, targetRow, targetCol) {
        if (Math.abs(fromRow - targetRow) !== Math.abs(fromCol - targetCol)) return false;
        return isPathClear(fromRow, fromCol, targetRow, targetCol);
    }

    function isValidQueenMove(fromRow, fromCol, targetRow, targetCol) {
        return isValidRookMove(fromRow, fromCol, targetRow, targetCol) || isValidBishopMove(fromRow, fromCol, targetRow, targetCol);
    }

    function isValidKingMove(fromRow, fromCol, targetRow, targetCol) {

        return Math.abs(fromRow - targetRow) <= 1 && Math.abs(fromCol - targetCol) <= 1;
    }

    function isPathClear(fromRow, fromCol, targetRow, targetCol) {
        const rowDir = fromRow < targetRow ? 1 : fromRow > targetRow ? -1 : 0;
        const colDir = fromCol < targetCol ? 1 : fromCol > targetCol ? -1 : 0;

        let row = fromRow + rowDir;
        let col = fromCol + colDir;

        while (row !== targetRow || col !== targetCol) {
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
    
    
    function isMoveSafe(piece, fromRow, fromCol, targetRow, targetCol) {
        const originalPiece = board[targetRow][targetCol];  // Save the piece at the target location
        
        // Temporarily make the move
        board[targetRow][targetCol] = piece;
        board[fromRow][fromCol] = '';
    
        const isInCheck = isKingInCheck(currentPlayer);
    
        // Undo the move
        board[fromRow][fromCol] = piece;
        board[targetRow][targetCol] = originalPiece;
    
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
                // console.log(currentPlayer + " is in checkmate! Game over.");
                gameOver();
            } else {
                title.innerHTML =  "stalemate. gg.";
                // console.log(currentPlayer + " is in stalemate! Game over.");
                gameOver();
            }
        }
    }
    
    function gameOver() {
        // Handle the end of the game (e.g., display a message, stop the game, etc.)
        console.log("Game Over");
        isGameOver = true;
    }

    // Function to generate PGN notation from a move
    function getPgnMove(piece, fromRow, fromCol, targetRow, targetCol, isCapture = false, promotion = null, isCheck = false, isMate = false, isCastling = false) {
        const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const pieceNotation = (piece.toLowerCase() === 'p') ? '' : piece.toUpperCase();  // No letter for pawn
        const fromNotation = columns[fromCol] + (8 - fromRow);  // Convert to chess notation (a-h, 1-8)
        const toNotation = columns[targetCol] + (8 - targetRow);
        
        let moveNotation = pieceNotation;  // Start with piece notation
        console.log("about to castle", isCastling);
        
        // Handle castling
        if (isCastling) {
            if (targetCol === 6) {
                // Kingside castling
                return "O-O";
            } else if (targetCol === 2) {
                // Queenside castling
                return "O-O-O";
            }
        }
        if (isCapture) {
            // If it's a pawn capture, we include the file it came from
            if (piece.toLowerCase() === 'p') {
                moveNotation += columns[fromCol];  
            }
            moveNotation += 'x';  // Add capture notation
        }
        
        moveNotation += toNotation;  // Add the destination square
        
        if (promotion) {
            moveNotation += '=' + promotion.toUpperCase();  // Add promotion notation (e.g., =Q for queen)
        }
        
        if (isCheck && !isMate) {
            moveNotation += '+';  // Add check notation
        }
         
        if (isMate) {
            moveNotation += '#';  // Add checkmate notation
        }
        
        return moveNotation;
    }
    
    // // Example of using this function to generate a PGN move
    // let pgnMove = getPgnMove('p', 6, 4, 4, 4, false, null, false, false);  // Example: Pawn moves e2 to e4
    // console.log(pgnMove);  // Should print "e4"
    function promotePawn(row, col, piece) {
        // // Display a dialog to let the player choose a piece to promote to
        // const promotionDialog = document.getElementById("promotion-dialog");
        // promotionDialog.style.display = "block";  // Show the dialog
        // promotionDialog.style.top = (row * 100) + "px";  // Position the dialog
        // promotionDialog.style.left = (col * 100) + "px";  // Position the dialog
        // promotionDialog.dataset.row = row;
        // promotionDialog.dataset.col = col;
        let queen = piece === 'p'? 'q': 'Q';
        console.log("Promoting pawn to queen ", queen);
        board[row][col] = queen;  // Promote the pawn to a queen
        return queen;
    }

    function printPgn(piece, fromRow, fromCol, targetRow, targetCol, isCapture, promotion, isCastling) {
        if (currentPlayer === 'black') {
            moveCount++;
            pgn.innerHTML += moveCount + ".";}
        // let opponent = currentPlayer === 'white' ? 'black' : 'white';
        pgn.innerHTML += getPgnMove(piece, fromRow, fromCol, targetRow, targetCol, isCapture, promotion, isKingInCheck(currentPlayer), isKingInCheck(currentPlayer) && !hasLegalMoves(currentPlayer), isCastling) + " ";
    }

    function boardToFEN(board, currentPlayer) {
        let fen = '';
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece === '') {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    fen += piece;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (row >= 0) fen += '/';
        }
        fen += ` ${currentPlayer === 'white' ? 'w' : 'b'}`;  // Current player turn
        fen += ' KQkq - 0 1';  // Simplified for castling and en passant
        console.log("FEN: ", fen);
        return fen;
    }
    
    // Function to send FEN to the backend
    function sendFENToBackend(fen) {
        
        // console.log('Sending FEN to backend:', fen);

        fetch('http://localhost:3000/api/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Make sure the content type is JSON
            },
            body: JSON.stringify({ fen: fen }) // Convert JavaScript object to JSON
        })
        .then(response => response.json())
        .then(data => {
            handleStockfishResponse(data);
            // console.log('Received data:', data);
            // console.log('Best Move: ', data.bestMove);
        })
        .catch(error => {
            console.error('Error:', error);
        });
        
    }
    
    function updateEvaluationBar(scoreCp) {
        const whiteBar = document.getElementById('white-bar');
        const blackBar = document.getElementById('black-bar');
        
        // Cap the score at +/- 1000 for the sake of visualization
        const cappedScore = Math.max(-1000, Math.min(1000, scoreCp));
        
        // Normalize score to a percentage (0% black, 100% white)
        const percentageWhite = 50 + (cappedScore / 2000) * 100;  // Scale from 0 to 100
        const percentageBlack = 100 - percentageWhite;  // Black is the remaining percentage
    
        // Update bar heights
        whiteBar.style.height = `${percentageWhite}%`;
        blackBar.style.height = `${percentageBlack}%`;
        if (!scoreCp[0]) return;  // Skip the rest if no score is available
        if (scoreCp[0].toLowerCase() === 'm') {
            if (currentPlayer === 'black') blackBar.style.height = `${100}%`;  // Show mate in moves instead of centipawn value
            else {
                whiteBar.style.height = `${100}%`;  // Show mate in moves instead of centipawn value
                blackBar.style.height = `${0}%`;  // Show mate in moves instead of centipawn value
            }
        }
    }

    function handleStockfishResponse(data) {
        const stockfishOutput = data.stockfishOutput;
        console.log('Stockfish Output:', stockfishOutput);
        let scoreCp = parseScoreFromStockfish(stockfishOutput); // Write a function to extract the score
        if (scoreCp){
            if (currentPlayer === 'black' && scoreCp[0].toLowerCase() !== 'm') scoreCp = -scoreCp;  // Invert the score for the black player
            updateEvaluationBar(scoreCp);
            console.log(scoreCp);
        }
    }
    
// Example function to extract the last score (cp or mate) from Stockfish's output
function parseScoreFromStockfish(output) {
    if (!output) return 0;  // Default to 0 if no output is found
    
    // Use matchAll to capture all score lines for both cp and mate
    const scoreLines = [...output.matchAll(/score (cp|mate) (-?\d+)/g)];
    
    // If we found any matches, return the last one
    if (scoreLines.length > 0) {
        const lastScoreLine = scoreLines[scoreLines.length - 1];
        const scoreType = lastScoreLine[1]; // cp or mate
        const scoreValue = parseInt(lastScoreLine[2], 10);

        // If it's a mate score, return it with special handling (positive/negative for mate in x moves)
        if (scoreType === 'mate') {
            return scoreValue > 0 ? `Mate in ${scoreValue}` : `Mate in ${Math.abs(scoreValue)}`;
        }
        
        // If it's a cp score, return it as is
        return scoreValue;
    }

    return 0; // Default to 0 if no score is found
}


    
    let selectedPosition = null; // Store selected piece position
    let possibleMoves = [];

    
    // Render the board
   function renderBoard() {
       for (let row = 0; row < 8; row++) {
           for (let col = 0; col < 8; col++) {
               const square = document.createElement("div");
               square.className = "square " + ((row + col) % 2 === 0 ? "white" : "black");
               square.dataset.row = row;
               square.dataset.col = col;
               
               boardElement.innerHTML = '';  // Clear the board
                                   if (possibleMoves.some(move => move.row === row && move.col === col)) {
                                   const indicator = document.createElement("div");
                                   indicator.className = "move-dot";
                                   square.appendChild(indicator);
                               }
            const piece = board[row][col];
            if (piece) {
                const pieceImg = document.createElement("img");
                pieceImg.src = pieceImages[piece];
                pieceImg.className = "piece";
                pieceImg.draggable = true;

                pieceImg.addEventListener('dragstart', (e) => {
                    draggedPiece = piece;
                    draggedFrom = { row, col };
                });

                pieceImg.addEventListener('click', () => {
                    if ((currentPlayer === 'white' && !isWhitePiece(piece)) ||
                        (currentPlayer === 'black' && !isBlackPiece(piece))) {
                        return;
                    }

                    // If the same piece is clicked again, unselect it
                    if (highlightedPiece === pieceImg) {
                        highlightedPiece.classList.remove('highlight');
                        highlightedPiece = null;
                        possibleMoves = [];
                        selectedPosition = null;
                        renderBoard();
                        return;
                    }

                    if (highlightedPiece) {
                        highlightedPiece.classList.remove('highlight');
                    }

                    highlightedPiece = pieceImg;
                    highlightedPiece.classList.add('highlight');
                    selectedPosition = { row, col };
                    possibleMoves = getLegalMovesForPiece(row, col);  // ✅ Must be defined elsewhere
                                          // Show move dot

                    renderBoard(); // ✅ Re-render after setting possible moves
                });

                square.appendChild(pieceImg);
            }

      

            // Handle click-to-move logic
            square.addEventListener('click', (e) => {
                if (highlightedPiece &&
                    !(highlightedPiece.parentElement.dataset.row === square.dataset.row &&
                      highlightedPiece.parentElement.dataset.col === square.dataset.col)) {

                    const targetRow = parseInt(square.dataset.row);
                    const targetCol = parseInt(square.dataset.col);
                    const fromRow = parseInt(highlightedPiece.parentElement.dataset.row);
                    const fromCol = parseInt(highlightedPiece.parentElement.dataset.col);
                    const piece = board[fromRow][fromCol];

                    if (
                        isValidMove(piece, fromRow, fromCol, targetRow, targetCol) &&
                        (!board[targetRow][targetCol] || isOpponentPiece(piece, targetRow, targetCol)) &&
                        isMoveSafe(piece, fromRow, fromCol, targetRow, targetCol)
                    ) {
                        // [Your full move logic here — same as before]

                        // Example partial move logic
                        history.push(cloneBoard(board));
                        board[targetRow][targetCol] = piece;
                        board[fromRow][fromCol] = '';
                        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

                        highlightedPiece = null;
                        possibleMoves = [];
                        renderBoard();
                        printPgn(piece, fromRow, fromCol, targetRow, targetCol, false, null, false);
                        checkForCheckmateOrStalemate();
                        if (!isGameOver) sendFENToBackend(boardToFEN(board, currentPlayer));
                    }
                }

            });

            square.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            square.addEventListener('drop', (e) => {
                const targetRow = parseInt(square.dataset.row);
                const targetCol = parseInt(square.dataset.col);

                if (draggedPiece && draggedFrom) {
                    const fromRow = draggedFrom.row;
                    const fromCol = draggedFrom.col;

                    if (
                        isValidMove(draggedPiece, fromRow, fromCol, targetRow, targetCol) &&
                        (!board[targetRow][targetCol] || isOpponentPiece(draggedPiece, targetRow, targetCol)) &&
                        isMoveSafe(draggedPiece, fromRow, fromCol, targetRow, targetCol)
                    ) {
                        history.push(cloneBoard(board));
                        board[targetRow][targetCol] = draggedPiece;
                        board[fromRow][fromCol] = '';
                        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

                        draggedPiece = null;
                        draggedFrom = null;
                        highlightedPiece = null;
                        possibleMoves = [];
                        renderBoard();
                        printPgn(draggedPiece, fromRow, fromCol, targetRow, targetCol, false, null, false);
                        checkForCheckmateOrStalemate();
                        if (!isGameOver) sendFENToBackend(boardToFEN(board, currentPlayer));
                    }
                }
            });

            boardElement.appendChild(square);
        }
    }
}

    renderBoard();
});

