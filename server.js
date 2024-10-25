const express = require('express');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
let globalStockfishData = null;  // To store the evaluation result

const app = express();

app.use(cors());
app.use(bodyParser.json());  // Middleware to parse JSON requests

// Serve static files (HTML, CSS, JS) from the "public" folder
app.use(express.static('public'));

// Path to Stockfish executable
const STOCKFISH_PATH = path.join(__dirname, 'stockfish.exe');  // Adjust this for your environment

// Initialize Stockfish engine
const stockfish = spawn(STOCKFISH_PATH);

// UCI setup: Start UCI and listen to Stockfish
stockfish.stdin.write('uci\n');

let outputBuffer = '';  // Buffer to collect Stockfish output
let lastEvaluation = null;  // To store the last evaluation score

// Listen to Stockfish's output
stockfish.stdout.on('data', (data) => {
    outputBuffer += data.toString();  // Collect data as a string

    // Extract evaluation (score cp or mate) from the output
    const evalMatch = outputBuffer.match(/score (cp|mate) (-?\d+)/);
    if (evalMatch) {
        const evalType = evalMatch[1];  // 'cp' for centipawns or 'mate' for mate in moves
        const evalValue = parseInt(evalMatch[2], 10);
        lastEvaluation = evalType === 'cp' ? evalValue / 100 : `mate in ${Math.abs(evalValue)}`;
    }

    // Check if the output contains 'bestmove' indicating Stockfish has finished its evaluation
    if (outputBuffer.includes('bestmove')) {
        const bestMoveLine = outputBuffer.split('\n').find(line => line.startsWith('bestmove'));
        const bestMove = bestMoveLine.split(' ')[1];  // Extract the move

        // Log only the final output: best move and the last captured evaluation score
        console.log('Best Move:', bestMove);
        console.log('Final Evaluation:', lastEvaluation);

        // Send the response with the best move and final evaluation score
        globalStockfishData = { bestMove: bestMove, evaluation: lastEvaluation, stockfishOutput: outputBuffer };

        // Reset the buffer and evaluation for the next move
        outputBuffer = '';
        lastEvaluation = null;
    }
});

// Function to evaluate position and send the result
function evaluatePosition(fen, res) {
    stockfish.stdin.write(`position fen ${fen}\n`);
    stockfish.stdin.write('go depth 20\n');

    // Send the bestMove and evaluation once it's ready
    setTimeout(() => {
        if (globalStockfishData) {
            // console.log('Sending response:', globalStockfishData);
            res.json(globalStockfishData);
            globalStockfishData = null;  // Reset the global variable for future evaluations
        }
    }, 500);  // Small delay to ensure Stockfish has processed the move
}

// API Endpoint to evaluate position (POST request)
app.post('/api/evaluate', (req, res) => {
    const { fen } = req.body;
    console.log('Received FEN:', fen);

    if (!fen) {
        return res.status(400).json({ error: 'Invalid FEN' });
    }

    // Evaluate the FEN using Stockfish
    evaluatePosition(fen, res);
});

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
