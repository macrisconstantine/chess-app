const express = require('express');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());  // Enable CORS for all routes
// Middleware to parse JSON requests
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS) from the "public" folder
app.use(express.static('public'));

// Path to Stockfish executable
const STOCKFISH_PATH = path.join(__dirname, 'stockfish.exe');  // Adjust this for your environment

// Initialize Stockfish engine
const stockfish = spawn(STOCKFISH_PATH);

// UCI setup: Start UCI and listen to Stockfish
stockfish.stdin.write('uci\n');
stockfish.stdout.on('data', (data) => {
    console.log(`Stockfish says: ${data}`);
});

function evaluatePosition(fen, res) {
    // Clear any existing listeners to avoid duplications
    stockfish.stdout.removeAllListeners('data');
    let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; // Default FEN
    stockfish.stdin.write(`position fen ${fen}\n`);
    stockfish.stdin.write('go depth 10\n');
    
    let stockfishOutput = '';

    stockfish.stdout.on('data', (data) => {
        const output = data.toString();
        stockfishOutput += output;  // Accumulate the output
        
        console.log('Stockfish Output:', stockfishOutput); // Log the output for debugging

        // Check for the bestmove line
        if (output.includes('bestmove')) {
            const bestMoveLine = output.split('\n').find(line => line.startsWith('bestmove'));
            if (bestMoveLine) {
                const bestMove = bestMoveLine.split(' ')[1];  // e.g., e2e4
                res.json({ bestMove: bestMove, stockfishOutput: stockfishOutput });
            }
        }
    });
}



// API Endpoint to evaluate position (POST request)
app.post('/api/evaluate', (req, res) => {
    const { fen } = req.body;
    console.log('Received FEN:', fen);
    if (!fen) {
        return res.status(400).json({ error: 'Invalid FEN' });
    }
    console.log('evaluating position');
    evaluatePosition(fen, res);
});

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
