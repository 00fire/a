document.addEventListener("DOMContentLoaded", function() {
  const startBtn = document.getElementById("start-btn");
  const replayBtn = document.getElementById("replay-btn");
  const soundSelect = document.getElementById("sound-select");
  const gameBoard = document.getElementById("game-board");
  const highScoreElem = document.getElementById("high-score");
  const failureModal = document.getElementById("failure-modal");
  const levelIndicator = document.getElementById("level-indicator");
  const pads = document.querySelectorAll(".pad");

  let sequence = [];
  let userSequence = [];
  let highScore = 0;
  let currentLevel = 0;
  let isGameActive = false;
  let toneStyle = "sine"; // Default tone style
  let userInputEnabled = false;  // Flag to enable/disable user input during the sequence

  // Initialize the game on page load
  fetchHighScore();

  // Fetch the high score from the backend
  function fetchHighScore() {
      fetch("/highscore")  // Assuming a GET request to get high score
          .then(response => response.json())
          .then(data => {
              highScore = data.score;
              highScoreElem.textContent = highScore;
          });
  }

  // Function to trigger glow effect
  function triggerGlow(pad) {
      pad.classList.add('active');  // Add glow effect
      setTimeout(() => {
          pad.classList.remove('active');  // Remove glow effect after 500ms
      }, 500);  // Glow lasts for 500ms
  }

  // Add event listeners to all pads
  pads.forEach(pad => {
      pad.addEventListener('click', () => {
          if (userInputEnabled) {  // Only handle click if user input is enabled
              triggerGlow(pad);  // Trigger the glow on click
              handleUserInput(pad);
          }
      });
  });

// Play sound based on selected tone style
 // Function to play sounds using Tone.js
 function playSound(note) {
    if (!note) return;

    // Create a new Tone.js synthesizer
    const synth = new Tone.Synth({
        oscillator: { type: toneStyle }  // Use selected tone style
    }).toDestination();

    // Play the note for a short duration
    synth.triggerAttackRelease(note, "8n");
}

  // Light up a pad in the sequence and play the sound
  // Light up a pad in the sequence and play the sound
function playSequence() {
    let i = 0;
    const interval = setInterval(() => {
        const pad = document.getElementById(`pad-${sequence[i]}`);
        pad.classList.add("glow");

        // Play different notes for different pads
        const notes = { red: "C4", yellow: "E4", green: "G4", blue: "B4" };
        playSound(notes[sequence[i]], pad);

        setTimeout(() => {
            pad.classList.remove("glow");
        }, 500);

        i++;
        if (i === sequence.length) {
            clearInterval(interval);
            enableUserInput();
        }
    }, 1000);
}
  // Enable the user to input their sequence
  function enableUserInput() {
      userInputEnabled = true;  // Allow user to input
  }

  // Handle user input via clicking pads
  function handleUserInput(pad) {
    const padId = pad.id.replace("pad-", "");
    
    // Play sound when user presses a pad
    const notes = { red: "C4", yellow: "E4", green: "G4", blue: "B4" };
    playSound(notes[padId], pad);

    userSequence.push(padId);
    checkUserInput();
}

  // Handle user input via keyboard
  function handleKeyboardInput(event) {
    const keyMap = {
        "q": { pad: "red", note: "C4" },
        "w": { pad: "yellow", note: "D4" },
        "a": { pad: "green", note: "E4" },
        "s": { pad: "blue", note: "F4" }
    };

    event.preventDefault(); // Prevent default key behavior

    const key = event.key.toLowerCase();
    const keyData = keyMap[key];

    if (keyData && userInputEnabled) {
        const pad = document.getElementById(`pad-${keyData.pad}`);
        triggerGlow(pad);  // Visual feedback
        playSound(keyData.note);  // Play corresponding note
        userSequence.push(keyData.pad);
        checkUserInput();
    }
}


  // Check if user input is correct
function checkUserInput() {
  const currentPad = userSequence[userSequence.length - 1];
  if (currentPad !== sequence[userSequence.length - 1]) {
      resetGame();
      return;
  }

  if (userSequence.length === sequence.length) {
      if (userSequence.length > highScore) {
          highScore = userSequence.length;
          highScoreElem.textContent = highScore;
          updateHighScore(highScore);
      }
      userSequence = [];
      currentLevel++;
      levelIndicator.textContent = currentLevel;
      sequence.push(generatePad());
      playSequence();
  }
}

// Reset the game
function resetGame() {
  console.log("Incorrect input! Resetting the game...");// Test cases
  // Clear sequences and reset level
  sequence = [];
  userSequence = [];
  currentLevel = 0;
  levelIndicator.textContent = currentLevel;
  
  // Disable buttons and show failure modal
  isGameActive = false;
  replayBtn.disabled = true;
  startBtn.disabled = false;  // Enable start button for a new game
  
  // Disable user input and reset game state
  userInputEnabled = false;

  // Reset high score if applicable
  if (userSequence.length > highScore) {
      highScore = userSequence.length;
      highScoreElem.textContent = highScore;
      updateHighScore(highScore);
  }
}

  // Generate a random pad (red, yellow, green, or blue)
  function generatePad() {
      const pads = ["red", "yellow", "green", "blue"];
      return pads[Math.floor(Math.random() * pads.length)];
  }

  // Update the high score on the backend
  function updateHighScore(score) {
      fetch("/highscore", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ score: score })
      });
  }

  // Start the game when the Start button is clicked
  startBtn.addEventListener("click", () => {
      if (!isGameActive) {
          isGameActive = true;
          startBtn.disabled = true;
          replayBtn.disabled = false;
          sequence.push(generatePad());
          playSequence();
      }
  });

  // Replay the current sequence
  replayBtn.addEventListener("click", () => {
      playSequence();
  });

  // Listen for tone style change
  soundSelect.addEventListener("change", (event) => {
      toneStyle = event.target.value;
  });

  // Listen for keyboard input
  document.addEventListener("keydown", handleKeyboardInput);
});
