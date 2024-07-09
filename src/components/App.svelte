<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  import pkg from "mobile-drag-drop";
  const { polyfill } = pkg;

  import confetti from "canvas-confetti";

  import Solver from "./Solver.svelte";
  import Sidebar from "./Sidebar.svelte";
  import ThemeSwitch from "./ThemeSwitch.svelte";
  import TimerSwitch from "./TimerSwitch.svelte";

  onMount(() => {
    polyfill({});
    window.addEventListener("touchmove", function () {}, { passive: false });
    startTimer();
  });

  const rows = 5;
  const cols = 11;
  let board = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));

  let hovered = Array(rows)
    .fill(false)
    .map(() => Array(cols).fill(false));

  let solution = null;
  let request = "";
  let usedHintOrSolver = false;

  let timerEnabled = false;
  let timerStart = null;
  let timerInterval = null;
  let elapsedTime = 0;

  let pieces = writable({
    l: {
      shape: [
        [1, 1, 1],
        [1, 0, 0],
      ],
      color: "#FA430A",
      placed: false,
    },
    L: {
      shape: [
        [1, 1, 1, 1],
        [0, 0, 0, 1],
      ],
      color: "#033699",
      placed: false,
    },
    S: {
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: "#72E946",
      placed: false,
    },
    i: {
      shape: [
        [1, 1],
        [1, 0],
      ],
      color: "#A3987F",
      placed: false,
    },
    N: {
      shape: [
        [1, 1, 0, 0],
        [0, 1, 1, 1],
      ],
      color: "#10783A",
      placed: false,
    },
    V: {
      shape: [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 1],
      ],
      color: "#A2DDD7",
      placed: false,
    },
    P: {
      shape: [
        [1, 1],
        [1, 1],
        [1, 0],
      ],
      color: "#B90006",
      placed: false,
    },
    U: {
      shape: [
        [1, 1],
        [1, 0],
        [1, 1],
      ],
      color: "#FEE01F",
      placed: false,
    },
    W: {
      shape: [
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
      ],
      color: "#F13679",
      placed: false,
    },
    X: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      color: "#7A8184",
      placed: false,
    },
    Y: {
      shape: [
        [0, 1],
        [1, 1],
        [0, 1],
        [0, 1],
      ],
      color: "#FDD7CB",
      placed: false,
    },
    I: {
      shape: [[1], [1], [1], [1]],
      color: "#612690",
      placed: false,
    },
  });

  let updated = false;

  $: if (solution || request) {
    updated = false;
  }

  $: {
    if (updated) break $;
    updated = true;

    if (solution !== null && request == "solve") {
      pieces.update((currentPieces) => {
        for (let pieceName in currentPieces) {
          currentPieces[pieceName].placed = true;
        }
        return currentPieces;
      });
      stopTimer();
      usedHintOrSolver = true;
      for (let i = 0; i < solution.length; i++) {
        for (let j = 0; j < solution[i].length; j++) {
          board[i][j] = solution[i][j];
        }
      }
    } else if (solution !== null && request == "hint") {
      let hintPiece = null;
      for (let piece in $pieces) {
        if (!$pieces[piece].placed) {
          hintPiece = piece;
          break;
        }
      }

      let notPlaced = 0;
      for (let piece in $pieces) {
        if (!$pieces[piece].placed) {
          notPlaced++;
        }
      }
      if (notPlaced <= 1) {
        stopTimer();
      }

      if (hintPiece === null) break $;

      for (let i = 0; i < solution.length; i++) {
        for (let j = 0; j < solution[i].length; j++) {
          if (solution[i][j] === hintPiece) {
            board[i][j] = hintPiece;
          }
        }
      }
      usedHintOrSolver = true;
      pieces.update((currentPieces) => {
        currentPieces[hintPiece].placed = true;
        return currentPieces;
      });
    } else if (solution !== null && request == "random") {
      let options = [
        "l",
        "P",
        "L",
        "Y",
        "N",
        "i",
        "V",
        "W",
        "U",
        "I",
        "S",
        "X",
      ];
      let chosen = options.sort(() => Math.random() - 0.5).slice(0, 2);

      for (let i = 0; i < solution.length; i++) {
        for (let j = 0; j < solution[i].length; j++) {
          if (chosen.includes(solution[i][j])) {
            board[i][j] = solution[i][j];
          } else {
            board[i][j] = null;
          }
        }
      }
      usedHintOrSolver = false;
      startTimer();
      pieces.update((currentPieces) => {
        for (let piece in currentPieces) {
          if (chosen.includes(piece)) {
            currentPieces[piece].placed = true;
          } else {
            currentPieces[piece].placed = false;
          }
        }
        return currentPieces;
      });
    } else if (request == "reset") {
      board = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(null));
      usedHintOrSolver = false;
      startTimer();
      pieces.update((currentPieces) => {
        for (let piece in currentPieces) {
          currentPieces[piece].placed = false;
        }
        return currentPieces;
      });
    }
  }

  function isPuzzleComplete() {
    for (let row of board) {
      for (let cell of row) {
        if (cell === null) {
          return false;
        }
      }
    }
    return true;
  }

  function celebrateCompletion() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, i * 250);
    }
  }

  let draggedPiece = null;
  let selectedPiece = null;

  function handleDragStart(
    event,
    pieceName,
    fromBoard = false,
    row = null,
    col = null,
  ) {
    draggedPiece = pieceName;

    if (fromBoard && row !== null && col !== null) {
      // Find and remove all cells occupied by the piece on the board
      $pieces[pieceName].placed = false;

      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
          if (board[i][j] === pieceName) {
            board[i][j] = null;
          }
        }
      }
    }

    const draggedPieceElement = document.querySelector(".piece-" + pieceName);
    event.dataTransfer.setDragImage(draggedPieceElement, 0, 0);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(event, row, col, selected = null) {
    event.preventDefault();

    let pieceToPlace = selected ? selected : draggedPiece;
    if (!pieceToPlace) return;

    for (let row = 0; row < hovered.length; row++) {
      for (let col = 0; col < hovered[row].length; col++) {
        hovered[row][col] = false;
      }
    }

    const piece = $pieces[pieceToPlace];
    const pieceRows = piece.shape.length;
    const pieceCols = piece.shape[0].length;

    // Check if the piece overlaps with existing pieces
    for (let i = 0; i < pieceRows; i++) {
      for (let j = 0; j < pieceCols; j++) {
        if (piece.shape[i][j] === 1 && board[row + i][col + j] !== null) {
          pieceToPlace = null;
          return;
        }
      }
    }

    // Place the piece on the board
    for (let i = 0; i < pieceRows; i++) {
      for (let j = 0; j < pieceCols; j++) {
        if (piece.shape[i][j] === 1) {
          board[row + i][col + j] = pieceToPlace;
        }
      }
    }

    pieces.update((currentPieces) => {
      currentPieces[pieceToPlace].placed = true;
      return currentPieces;
    });

    if (isPuzzleComplete()) {
      stopTimer();
      if (!usedHintOrSolver) {
        celebrateCompletion();
        usedHintOrSolver = true;
      }
    }

    draggedPiece = null;
    selectedPiece = null;
  }

  function handleDragEnter(event, row, col) {
    event.preventDefault();
    if (!draggedPiece) return;

    const piece = $pieces[draggedPiece];
    const pieceRows = piece.shape.length;
    const pieceCols = piece.shape[0].length;
    // Update the hover rows and columns
    for (let i = 0; i < pieceRows; i++) {
      for (let j = 0; j < pieceCols; j++) {
        if (piece.shape[i][j] === 1 && row + i < rows && col + j < cols) {
          hovered[row + i][col + j] = true;
        }
      }
    }
  }

  function handleDragLeave(event) {
    event.preventDefault();
    for (let row = 0; row < hovered.length; row++) {
      for (let col = 0; col < hovered[row].length; col++) {
        hovered[row][col] = false;
      }
    }
  }

  function handleOnClickBoard(event, row, col) {
    event.preventDefault();
    if (selectedPiece === null) return;
    handleDrop(event, row, col, selectedPiece);
  }

  function rotatePiece(piece) {
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const rotatedShape = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotatedShape[j][rows - 1 - i] = piece.shape[i][j];
      }
    }

    piece.shape = rotatedShape;
  }

  function flipPiece(piece) {
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const flippedShape = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        flippedShape[i][cols - 1 - j] = piece.shape[i][j];
      }
    }

    piece.shape = flippedShape;
  }

  function handleRotateClick(pieceName) {
    pieces.update((currentPieces) => {
      const piece = currentPieces[pieceName];
      rotatePiece(piece);
      return currentPieces;
    });
  }

  function handleFlipClick(pieceName) {
    pieces.update((currentPieces) => {
      const piece = currentPieces[pieceName];
      flipPiece(piece);
      return currentPieces;
    });
  }

  function handleKeyUp(event) {
    if (draggedPiece) {
      if (event.key === "r" || event.key === "R") {
        handleRotateClick(draggedPiece);
      } else if (event.key === "f" || event.key === "F") {
        handleFlipClick(draggedPiece);
      }
    } else if (selectedPiece) {
      if (event.key === "r" || event.key === "R") {
        handleRotateClick(selectedPiece);
      } else if (event.key === "f" || event.key === "F") {
        handleFlipClick(selectedPiece);
      }
    }
  }

  function handleOnClick(event, pieceName) {
    for (let cls of event.target.classList) {
      if (cls.includes("piece") && !cls.includes("pieces")) {
        if (pieceName !== undefined) selectedPiece = pieceName;

        return;
      }
    }
    selectedPiece = null;
  }

  function startTimer() {
    elapsedTime = 0;
    timerStart = Date.now();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      elapsedTime = Date.now() - timerStart;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
</script>

<svelte:window on:keyup={handleKeyUp} on:click={handleOnClick} />

<div class="full-app">
  <Sidebar />
  <ThemeSwitch />
  <div class="timer-container">
    {#if timerEnabled}
      <div class="timer">
        {formatTime(elapsedTime)}
      </div>
    {/if}
    <TimerSwitch bind:timerEnabled />
  </div>
  <div class="board">
    {#each board as row, rowIndex}
      <div class="row">
        {#each row as cell, colIndex}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="circle"
            class:hovered={hovered[rowIndex][colIndex]}
            style="background-color: {cell
              ? $pieces[cell].color
              : 'var(--piece-color)'};"
            draggable={cell ? "true" : "false"}
            on:dragstart={(event) =>
              handleDragStart(event, cell, true, rowIndex, colIndex)}
            on:dragenter={(event) => handleDragEnter(event, rowIndex, colIndex)}
            on:dragleave={handleDragLeave}
            on:dragover={handleDragOver}
            on:drop={(event) => handleDrop(event, rowIndex, colIndex)}
            on:dragend={() => (draggedPiece = null)}
            on:click={(event) => handleOnClickBoard(event, rowIndex, colIndex)}
          ></div>
        {/each}
      </div>
    {/each}
  </div>

  <div class="pieces">
    {#each Object.entries($pieces) as [pieceName, piece]}
      <div class="piece-container">
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="piece piece-{pieceName}"
          class:selected={selectedPiece === pieceName}
          class:dragging={draggedPiece === pieceName}
          class:placed={piece.placed}
          draggable={!piece.placed}
          on:dragstart={(event) => handleDragStart(event, pieceName)}
          on:dragend={() => (draggedPiece = null)}
          on:click={(event) => handleOnClick(event, pieceName)}
        >
          {#each piece.shape as row}
            <div class="piece-row">
              {#each row as cell}
                <div
                  class="piece-cell"
                  style="background-color: {cell === 1
                    ? piece.color
                    : 'transparent'};"
                ></div>
              {/each}
            </div>
          {/each}
        </div>
        <div class="piece-buttons">
          <button on:click={() => handleRotateClick(pieceName)}>Rotate</button>
          <button on:click={() => handleFlipClick(pieceName)}>Flip</button>
        </div>
      </div>
    {/each}
  </div>
  <Solver {board} bind:solution bind:request />
</div>

<style>
  .full-app {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: 0 auto;
  }

  [draggable="true"] {
    z-index: 1;
  }

  .title {
    text-align: center;
    font-size: 2rem;
    margin-bottom: 10px;
  }

  .board {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .row {
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
  }

  .pieces {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(2, auto);
    gap: 10px;
    justify-items: center;
    margin-top: 20px;
  }

  .piece-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .piece {
    cursor: move;
    margin-bottom: 5px;
    padding: 5px;
    border: 2px solid transparent;
  }

  .piece.selected {
    border-color: var(--button-text-color);
  }

  .piece.dragging {
    border-color: transparent;
  }

  .piece.placed {
    cursor: not-allowed;
    opacity: 0.1;
  }

  .piece-row {
    display: flex;
  }

  .piece-cell {
    width: 20px;
    height: 20px;
  }

  .circle.hovered {
    opacity: 0.2;
  }

  .piece-buttons {
    display: flex;
    justify-content: center;
    gap: 5px;
  }

  .piece-buttons button {
    padding: 5px 10px;
    font-size: 12px;
  }

  .timer-container {
    position: fixed;
    top: 1rem;
    right: 5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .timer {
    font-size: 1rem;
    font-weight: bold;
  }
</style>
