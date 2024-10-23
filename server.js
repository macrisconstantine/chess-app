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

// Function to evaluate the position with Stockfish
function evaluatePosition(fen, res) {
    // Send the position to Stockfish
    stockfish.stdin.write(`position fen ${fen}\n`);
    // Request the best move
    stockfish.stdin.write('go depth 20\n');
    
    stockfish.stdout.once('data', (data) => {
        const output = data.toString();
        // console.log(`Stockfish Output: ${output}`);
        
        // Parse the best move from Stockfish's output
        const bestMoveLine = output.split('\n').find(line => line.startsWith('bestmove'));
        if (bestMoveLine) {
            const bestMove = bestMoveLine.split(' ')[1];
            res.json({ bestMove });
        } else {
            res.status(500).json({ error: 'No best move found.' });
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
