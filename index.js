const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware (Corrected Order)
app.use(bodyParser.json());
app.use(cors());

// Existing routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Game state management
const generateSequence = (level) => {
  const colors = ["red", "yellow", "green", "blue"];
  return Array.from(
    { length: level },
    () => colors[Math.floor(Math.random() * colors.length)]
  );
};

let gameState = {
  highScore: 0,
  level: 1,
  sequence: generateSequence(1),
};

// API Routes
const apiRouter = express.Router();
app.use("/api/v1", apiRouter);

// Get game state
apiRouter.get("/game-state", (req, res) => {
  res.status(200).json(gameState);
});

// Reset game state
apiRouter.put("/game-state", (req, res) => {
  const { resetHighScore } = req.body;
  
  gameState.level = 1;
  gameState.sequence = generateSequence(1);

  if (resetHighScore) {
    gameState.highScore = 0;
  }

  res.status(200).json({ message: "Game reset successfully", gameState });
});

// Compare user input sequence
apiRouter.post("/game-state/sequence", (req, res) => {
  const { sequence } = req.body;

  // Validation
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return res.status(400).json({ message: "A non-empty sequence array is required." });
  }

  if (sequence.length !== gameState.level) {
    return res.status(400).json({
      message: `Sequence must be exactly ${gameState.level} items long.`,
    });
  }

  // Compare arrays (element by element)
  const isCorrect = sequence.every((color, index) => color === gameState.sequence[index]);

  if (isCorrect) {
    gameState.level++;
    gameState.sequence = generateSequence(gameState.level);

    if (gameState.level > gameState.highScore) {
      gameState.highScore = gameState.level - 1;
    }

    return res.status(200).json({ message: "Correct!", gameState });
  } else {
    gameState.level = 1;
    gameState.sequence = generateSequence(1);
    return res.status(400).json({ message: "Incorrect! Restarting at level 1.", gameState });
  }
});

// Error Handling Middleware (Corrected Order)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// 404 Not Found Middleware (Placed Last)
app.use((req, res) => {
  res.status(404).json({ error: "Resource not found" });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
