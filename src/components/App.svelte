<script>
  import { writable } from "svelte/store";
  import Solver from "../components/Solver.svelte";

  const rows = 5;
  const cols = 11;
  let board = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));

  let hovered = Array(rows)
    .fill(false)
    .map(() => Array(cols).fill(false));

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
      color: "#DCD8BA",
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
      color: "#FA001A",
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
      color: "#D2D0CB",
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

  let draggedPiece = null;
  let draggedPieceFromBoard = false;

  function handleDragStart(
    event,
    pieceName,
    fromBoard = false,
    row = null,
    col = null,
  ) {
    draggedPiece = pieceName;
    draggedPieceFromBoard = fromBoard;

    if (fromBoard && row !== null && col !== null) {
      // Find and remove all cells occupied by the piece on the board
      const piece = $pieces[pieceName];
      const pieceRows = piece.shape.length;
      const pieceCols = piece.shape[0].length;

      for (let i = 0; i < pieceRows; i++) {
        for (let j = 0; j < pieceCols; j++) {
          if (
            piece.shape[i][j] === 1 &&
            board[row + i] &&
            board[row + i][col + j] === pieceName
          ) {
            board[row + i][col + j] = null;
          }
        }
      }
    }

    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(event, row, col) {
    event.preventDefault();
    if (!draggedPiece) return;

    for (let row = 0; row < hovered.length; row++) {
      for (let col = 0; col < hovered[row].length; col++) {
        hovered[row][col] = false;
      }
    }

    const piece = $pieces[draggedPiece];
    const pieceRows = piece.shape.length;
    const pieceCols = piece.shape[0].length;

    // Check if the drop target is outside the board
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      // if (draggedPieceFromBoard) {
      //   // Add the piece back to the pieces store if it was dragged from the board
      //   pieces.update(currentPieces => {
      //     return { ...currentPieces, [draggedPiece]: piece };
      //   });
      //   console.log(pieces)
      // }

      // draggedPiece = null;
      // draggedPieceFromBoard = false;
      return;
    }

    // Check if the piece overlaps with existing pieces
    for (let i = 0; i < pieceRows; i++) {
      for (let j = 0; j < pieceCols; j++) {
        if (piece.shape[i][j] === 1 && board[row + i][col + j] !== null) return;
      }
    }

    // Place the piece on the board
    for (let i = 0; i < pieceRows; i++) {
      for (let j = 0; j < pieceCols; j++) {
        if (piece.shape[i][j] === 1) {
          board[row + i][col + j] = draggedPiece;
        }
      }
    }

    pieces.update((currentPieces) => {
      currentPieces[draggedPiece].placed = true;
      return currentPieces;
    });

    draggedPiece = null;
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
</script>

<div class="full-app">
  <div class="board">
    {#each board as row, rowIndex}
      <div class="row">
        {#each row as cell, colIndex}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="circle"
            class:hovered={hovered[rowIndex][colIndex]}
            style="background-color: {cell ? $pieces[cell].color : '#4c4a4a'};"
            on:dragenter={(event) => handleDragEnter(event, rowIndex, colIndex)}
            on:dragleave={handleDragLeave}
            on:dragover={handleDragOver}
            on:drop={(event) => handleDrop(event, rowIndex, colIndex)}
          ></div>
        {/each}
      </div>
    {/each}
  </div>

  <div class="pieces">
    {#each Object.entries($pieces) as [pieceName, piece]}
      {#if !piece.placed}
        <div class="piece-container">
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="piece"
            draggable="true"
            on:dragstart={(event) => handleDragStart(event, pieceName)}
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
            <button on:click={() => handleRotateClick(pieceName)}>Rotate</button
            >
            <button on:click={() => handleFlipClick(pieceName)}>Flip</button>
          </div>
        </div>
      {/if}
    {/each}
  </div>
  <Solver {board} pieces={$pieces} />
</div>

<style>
  .full-app {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: 0 auto;
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
</style>
