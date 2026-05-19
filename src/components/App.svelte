<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  import pkg from "mobile-drag-drop";
  const { polyfill } = pkg;

  import confetti from "canvas-confetti";

  import Solver from "./Solver.svelte";
  import Sidebar from "./Sidebar.svelte";
  import SettingsModal from "./SettingsModal.svelte";

  onMount(() => {
    // mobile-drag-drop's synthetic dragover only fires at iterationInterval
    // (~6Hz). The polyfill DOES position its own drag image at touchmove
    // rate via this hook, so we piggy-back on it to position ours smoothly.
    polyfill({
      dragImageTranslateOverride: (_event, hoverCoords) => {
        if (hoverCoords) updateDragPreviewPosition(hoverCoords.x, hoverCoords.y);
      },
      // mobile-drag-drop@3.0.0-rc.0's default elementFromPoint returns
      // `undefined` (not `null`) when the point hits nothing. The per-tick
      // iteration code only does `null === target`, so it ends up dispatching
      // a synthetic `dragenter` with an undefined target and crashes inside
      // `target.getBoundingClientRect()`. Forcing a null return falls into
      // the correct branch.
      elementFromPoint: (x, y) => document.elementFromPoint(x, y) ?? null,
    });
    window.addEventListener("touchmove", () => {}, { passive: false });
    startTimer();

    transparentDragImg = new Image(1, 1);
    transparentDragImg.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    // Load persisted settings (fall back to system preference for theme on
    // first visit). Wrapped in try/catch so quota/private-mode failures don't
    // break the app.
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    } catch (_) {
      saved = {};
    }
    isLightMode =
      "isLightMode" in saved
        ? !!saved.isLightMode
        : window.matchMedia("(prefers-color-scheme: light)").matches;
    if (typeof saved.timerEnabled === "boolean") timerEnabled = saved.timerEnabled;
    if (typeof saved.fanEditionEnabled === "boolean") fanEditionEnabled = saved.fanEditionEnabled;
    if (typeof saved.findAllSolutionsEnabled === "boolean")
      findAllSolutionsEnabled = saved.findAllSolutionsEnabled;
    if (typeof saved.randomPieceCount === "number")
      randomPieceCount = saved.randomPieceCount;

    document.documentElement.classList.toggle("light-mode", isLightMode);
    settingsLoaded = true;
  });

  $: if (settingsLoaded) {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          isLightMode,
          timerEnabled,
          fanEditionEnabled,
          findAllSolutionsEnabled,
          randomPieceCount,
        }),
      );
    } catch (_) {
      // ignore (e.g. Safari private mode quota)
    }
    document.documentElement.classList.toggle("light-mode", isLightMode);
  }

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

  // Countdown challenge timer state
  let countdownActive = false;
  let countdownSeconds = 0;
  let countdownInterval = null;
  let storedInitialSolution = null;
  let pendingCountdownMinutes = 0;

  // Shared with Solver component
  let randomPieceCount = 2;
  let triggerRandom = false;
  let solvable = "";
  let findAllSolutionsEnabled = false;

  // Settings modal state
  let isLightMode = false;
  let fanEditionEnabled = false;

  const SETTINGS_KEY = "kanoodle-settings";
  // Block the persistence reactive until the initial load completes so it
  // doesn't write defaults over the saved values on first render.
  let settingsLoaded = false;

  // Track preplaced pieces in challenge mode
  let challengePreplacedPieces = new Set();

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
    m: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      color: "#000000",
      placed: false,
    },
    M: {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [1, 0, 0],
      ],
      color: "#1a1a1a",
      placed: false,
    },
  });

  $: activePieceKeys = fanEditionEnabled
    ? Object.keys($pieces)
    : Object.keys($pieces).filter((k) => k !== "m" && k !== "M");

  let prevFanEditionEnabled = fanEditionEnabled;
  $: {
    if (prevFanEditionEnabled && !fanEditionEnabled) {
      // Toggle just turned off: scrub m/M off the board and reset their state.
      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
          if (board[i][j] === "m" || board[i][j] === "M") {
            board[i][j] = null;
          }
        }
      }
      pieces.update((currentPieces) => {
        currentPieces.m.placed = false;
        currentPieces.M.placed = false;
        return currentPieces;
      });
      board = board;
    }
    prevFanEditionEnabled = fanEditionEnabled;
  }

  let updated = false;

  $: if (solution || request) {
    updated = false;
  }

  $: {
    if (updated) break $;
    updated = true;

    if (solution !== null && request == "solve") {
      const piecesInSolution = new Set();
      for (const row of solution) {
        for (const cell of row) {
          if (cell) piecesInSolution.add(cell);
        }
      }
      pieces.update((currentPieces) => {
        for (let pieceName in currentPieces) {
          currentPieces[pieceName].placed = piecesInSolution.has(pieceName);
        }
        return currentPieces;
      });
      stopTimer();
      handleCountdownStop();
      usedHintOrSolver = true;
      for (let i = 0; i < solution.length; i++) {
        for (let j = 0; j < solution[i].length; j++) {
          board[i][j] = solution[i][j];
        }
      }
    } else if (solution !== null && request == "hint") {
      // Only hint with pieces that the solver actually used; in Fan Edition
      // mode it may have left some pieces aside.
      const piecesInSolution = new Set();
      for (const row of solution) {
        for (const cell of row) {
          if (cell) piecesInSolution.add(cell);
        }
      }

      let hintPiece = null;
      for (let piece in $pieces) {
        if (!$pieces[piece].placed && piecesInSolution.has(piece)) {
          hintPiece = piece;
          break;
        }
      }

      let notPlaced = 0;
      for (let piece in $pieces) {
        if (!$pieces[piece].placed && piecesInSolution.has(piece)) {
          notPlaced++;
        }
      }
      if (notPlaced <= 1) {
        stopTimer();
        handleCountdownStop();
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
    } else if (solution !== null && request.startsWith("random")) {
      // Pick from pieces that actually appear in the generated solution so
      // bonus-pieces mode (where 2 of 14 are left unused) still preplaces a
      // meaningful number of pieces.
      const piecesInSolution = new Set();
      for (const row of solution) {
        for (const cell of row) {
          if (cell) piecesInSolution.add(cell);
        }
      }
      let options = [...piecesInSolution];
      let numRandomPieces = parseInt(request.split("-")[1]);
      let chosen = options
        .sort(() => Math.random() - 0.5)
        .slice(0, numRandomPieces);

      // Store the full solution for potential auto-solve on countdown expiry
      storedInitialSolution = solution.map((row) => [...row]);

      // Track preplaced pieces for challenge mode
      challengePreplacedPieces = new Set(chosen);

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

      // Start countdown if this was triggered by Challenge mode, otherwise reset challenge and start regular timer
      if (pendingCountdownMinutes > 0) {
        startCountdownTimer(pendingCountdownMinutes);
        pendingCountdownMinutes = 0;
      } else {
        handleCountdownStop(); // Reset any active challenge mode
        startTimer();
      }

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
      handleCountdownStop();
      storedInitialSolution = null;
      challengePreplacedPieces = new Set();
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
  let uniquePermutations = []; // Stores all unique shapes for the selected piece
  let uniquePermutationIndex = 0;

  // Drag preview state. The native drag image is a static snapshot taken
  // at dragstart and can't update when the user rotates/flips mid-drag.
  // We hide it with a 1x1 transparent gif and render a custom preview
  // whose shape is bound through Svelte and whose position is set with
  // direct DOM writes to skip Svelte's per-frame reactivity overhead.
  let dragPreviewEl;
  let transparentDragImg = null;
  let lastHoverRow = null;
  let lastHoverCol = null;

  function updateDragPreviewPosition(x, y) {
    if (dragPreviewEl) {
      dragPreviewEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }

  function handleDragStart(
    event,
    pieceName,
    fromBoard = false,
    row = null,
    col = null,
  ) {
    draggedPiece = pieceName;

    if (fromBoard && row !== null && col !== null) {
      if (countdownActive && challengePreplacedPieces.has(pieceName)) {
        handleCountdownStop();
        startTimer();
        solvable = "Challenge failed: preplaced piece removed";
      }

      $pieces[pieceName].placed = false;
      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
          if (board[i][j] === pieceName) {
            board[i][j] = null;
          }
        }
      }
    }

    event.dataTransfer.effectAllowed = "move";
    if (transparentDragImg) {
      event.dataTransfer.setDragImage(transparentDragImg, 0, 0);
    }
  }

  function handleDragEnd() {
    draggedPiece = null;
    lastHoverRow = null;
    lastHoverCol = null;
    clearHoverPreview();
  }

  function handleGlobalDragOver(event) {
    if (!draggedPiece) return;
    // preventDefault makes the whole window a valid drop target, which
    // skips the browser's ~250ms snap-back animation on drop-outside-board.
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    updateDragPreviewPosition(event.clientX, event.clientY);
  }

  function handleGlobalDrop(event) {
    if (!draggedPiece) return;
    event.preventDefault();
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

    // Check if the piece fits within bounds and doesn't overlap existing pieces
    for (let i = 0; i < pieceRows; i++) {
      for (let j = 0; j < pieceCols; j++) {
        if (piece.shape[i][j] === 1) {
          if (
            row + i >= rows ||
            col + j >= cols ||
            board[row + i][col + j] !== null
          ) {
            pieceToPlace = null;
            return;
          }
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
      handleCountdownStop(); // Also stop countdown if running
      solvable = "Congratulations!";
      if (!usedHintOrSolver) {
        celebrateCompletion();
        usedHintOrSolver = true;
      }
    }

    handleDragEnd();
    selectedPiece = null;
    uniquePermutations = [];
    uniquePermutationIndex = 0;
  }

  function clearHoverPreview() {
    for (let r = 0; r < hovered.length; r++) {
      for (let c = 0; c < hovered[r].length; c++) {
        hovered[r][c] = false;
      }
    }
  }

  function paintHoverPreview(row, col) {
    clearHoverPreview();
    if (row === null || col === null || !draggedPiece) return;
    const piece = $pieces[draggedPiece];
    const pieceRows = piece.shape.length;
    const pieceCols = piece.shape[0].length;
    for (let i = 0; i < pieceRows; i++) {
      for (let j = 0; j < pieceCols; j++) {
        if (piece.shape[i][j] === 1 && row + i < rows && col + j < cols) {
          hovered[row + i][col + j] = true;
        }
      }
    }
  }

  function handleDragEnter(event, row, col) {
    event.preventDefault();
    if (!draggedPiece) return;
    lastHoverRow = row;
    lastHoverCol = col;
    paintHoverPreview(row, col);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    // Only keep hover if we're entering another cell (not gaps between cells)
    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget &&
      relatedTarget.closest &&
      relatedTarget.closest(".circle")
    ) {
      return; // Entering another cell, handleDragEnter will take over
    }
    lastHoverRow = null;
    lastHoverCol = null;
    clearHoverPreview();
  }

  // Repaint the on-board ghost when the piece is rotated/flipped mid-drag.
  $: if (
    draggedPiece &&
    $pieces[draggedPiece]?.shape &&
    lastHoverRow !== null &&
    lastHoverCol !== null
  ) {
    paintHoverPreview(lastHoverRow, lastHoverCol);
  }

  function handleDragRotate(event) {
    if (!draggedPiece) return;
    event.preventDefault();
    handleRotateClick(draggedPiece);
  }

  function handleDragFlip(event) {
    if (!draggedPiece) return;
    event.preventDefault();
    handleFlipClick(draggedPiece);
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
        if (pieceName !== undefined && !$pieces[pieceName].placed) {
          if (selectedPiece === pieceName) {
            cyclePermutation(pieceName);
          } else {
            selectedPiece = pieceName;
            computeUniquePermutations(pieceName);
            uniquePermutationIndex = 0;
          }
        }
        return;
      }
    }
    selectedPiece = null;
    uniquePermutations = [];
    uniquePermutationIndex = 0;
  }

  function shapesEqual(a, b) {
    if (a.length !== b.length || a[0].length !== b[0].length) return false;
    return a.every((row, i) => row.every((cell, j) => cell === b[i][j]));
  }

  function copyShape(shape) {
    return shape.map((row) => [...row]);
  }

  function computeUniquePermutations(pieceName) {
    const tempPiece = { shape: copyShape($pieces[pieceName].shape) };
    uniquePermutations = [copyShape(tempPiece.shape)];

    for (let i = 1; i < 8; i++) {
      i === 4 ? flipPiece(tempPiece) : rotatePiece(tempPiece);
      if (!uniquePermutations.some((s) => shapesEqual(s, tempPiece.shape))) {
        uniquePermutations.push(copyShape(tempPiece.shape));
      }
    }
  }

  function cyclePermutation(pieceName) {
    if (uniquePermutations.length <= 1) return;
    uniquePermutationIndex =
      (uniquePermutationIndex + 1) % uniquePermutations.length;
    pieces.update((p) => {
      p[pieceName].shape = copyShape(
        uniquePermutations[uniquePermutationIndex],
      );
      return p;
    });
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

  function formatCountdown(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function handleCountdownStart(event) {
    const minutes = event.detail.minutes;

    // Set pending countdown and trigger Solver to generate a random puzzle
    pendingCountdownMinutes = minutes;
    triggerRandom = true;
  }

  let challengeTotalSeconds = 0; // Store total seconds for percentage calculation and elapsed time display

  function startCountdownTimer(minutes) {
    // Stop any existing timers
    stopTimer();

    countdownActive = true;
    countdownSeconds = minutes * 60;
    challengeTotalSeconds = minutes * 60;
    elapsedTime = 0; // Reset elapsed time

    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      countdownSeconds--;

      if (countdownSeconds <= 0) {
        handleCountdownExpired();
      }
    }, 1000);
  }

  function handleCountdownStop() {
    // Calculate elapsed time before stopping (for showing solve time)
    const wasActive = countdownActive;
    if (countdownActive) {
      elapsedTime = (challengeTotalSeconds - countdownSeconds) * 1000;
    }
    countdownActive = false;
    countdownSeconds = 0;
    challengePreplacedPieces = new Set();
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    // If the user wants the regular timer visible, resume it with a fresh
    // count; otherwise it stays hidden via the (timerEnabled || countdownActive)
    // check in the template.
    if (wasActive && timerEnabled) {
      startTimer();
    }
  }

  function handleCountdownExpired() {
    // Clear the countdown interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    countdownActive = false;
    countdownSeconds = 0;

    // Set elapsed time to show the challenge duration
    elapsedTime = challengeTotalSeconds * 1000;

    // Auto-solve using the stored initial solution
    if (storedInitialSolution && !isPuzzleComplete()) {
      // Apply the full solution to the board
      pieces.update((currentPieces) => {
        for (let pieceName in currentPieces) {
          currentPieces[pieceName].placed = true;
        }
        return currentPieces;
      });

      stopTimer();
      usedHintOrSolver = true;
      solvable = "Time's up!";

      for (let i = 0; i < storedInitialSolution.length; i++) {
        for (let j = 0; j < storedInitialSolution[i].length; j++) {
          board[i][j] = storedInitialSolution[i][j];
        }
      }
    }
  }
</script>

<svelte:window
  on:keyup={handleKeyUp}
  on:click={handleOnClick}
  on:dragover={handleGlobalDragOver}
  on:drop={handleGlobalDrop}
  on:dragend={handleDragEnd}
/>

<div class="full-app">
  <Sidebar />
  <div class="controls">
    <div class="timer-container">
      {#if timerEnabled || countdownActive}
        <div
          class="timer"
          class:countdown-mode={countdownActive &&
            countdownSeconds > challengeTotalSeconds * 0.5}
          class:countdown-warning={countdownActive &&
            countdownSeconds <= challengeTotalSeconds * 0.5 &&
            countdownSeconds > 10}
          class:urgent={countdownActive && countdownSeconds <= 10}
        >
          {#if countdownActive}
            {formatCountdown(countdownSeconds)}
          {:else}
            {formatTime(elapsedTime)}
          {/if}
        </div>
      {/if}
      {#if countdownActive}
        <button
          class="cancel-challenge-btn"
          on:click={handleCountdownStop}
          title="Cancel Challenge"
          aria-label="Cancel challenge"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      {/if}
      <div class="settings-anchor">
        <SettingsModal
          bind:isLightMode
          bind:timerEnabled
          bind:fanEditionEnabled
          bind:findAllSolutionsEnabled
          bind:randomPieceCount
          {countdownActive}
          on:startChallenge={(e) => handleCountdownStart(e)}
          on:stopChallenge={handleCountdownStop}
        />
      </div>
    </div>
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
            on:dragend={handleDragEnd}
            on:click={(event) => handleOnClickBoard(event, rowIndex, colIndex)}
          ></div>
        {/each}
      </div>
    {/each}
  </div>

  <div class="pieces">
    {#each activePieceKeys as pieceName (pieceName)}
      {@const piece = $pieces[pieceName]}
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
          on:dragend={handleDragEnd}
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

  {#if draggedPiece && $pieces[draggedPiece]}
    <div class="drag-preview" bind:this={dragPreviewEl} aria-hidden="true">
      <div class="drag-preview-inner">
        {#each $pieces[draggedPiece].shape as row}
          <div class="piece-row">
            {#each row as cell}
              <div
                class="piece-cell"
                style="background-color: {cell === 1
                  ? $pieces[draggedPiece].color
                  : 'transparent'};"
              ></div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if draggedPiece}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="drag-actions" aria-hidden="true">
      <div
        class="drag-action-btn"
        on:dragenter={handleDragRotate}
        on:dragover|preventDefault
        on:drop|preventDefault
      >
        <span class="drag-action-icon">↻</span>
        <span class="drag-action-label">Rotate</span>
      </div>
      <div
        class="drag-action-btn"
        on:dragenter={handleDragFlip}
        on:dragover|preventDefault
        on:drop|preventDefault
      >
        <span class="drag-action-icon">⇋</span>
        <span class="drag-action-label">Flip</span>
      </div>
    </div>
  {/if}

  <Solver
    {board}
    {fanEditionEnabled}
    bind:solution
    bind:request
    bind:randomPieceCount
    bind:triggerRandom
    bind:solvable
    bind:findAllSolutionsEnabled
  />
</div>

<style>
  .full-app {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin: 0 auto;
    padding: 60px 10px 40px;
    max-width: 100%;
    box-sizing: border-box;
  }

  [draggable="true"] {
    z-index: 1;
  }

  .board {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .row {
    display: flex;
    justify-content: center;
    gap: 0;
  }

  .circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    padding: 5px;
    box-sizing: content-box;
    background-clip: content-box;
    cursor: pointer;
  }

  .pieces {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;
    padding: 0 10px;
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

  .drag-preview {
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 9999;
    will-change: transform;
    /* Off-screen until the first pointer event positions us. */
    transform: translate3d(-9999px, -9999px, 0);
  }

  .drag-preview-inner {
    transform: translate(-50%, -50%);
    padding: 4px;
    opacity: 0.95;
  }

  /* Hide the polyfill's drag image clone — our own preview replaces it. */
  :global(.dnd-poly-drag-image) {
    opacity: 0 !important;
  }

  .drag-actions {
    position: fixed;
    left: 50%;
    bottom: 0.25rem;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 9998;
    pointer-events: auto;
    padding: 6px;
    border-radius: 12px;
    background: rgba(20, 20, 20, 0.85);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    animation: drag-actions-in 0.18s ease-out;
  }

  @media (min-width: 1024px) {
    .drag-actions {
      left: auto;
      right: 1.25rem;
      bottom: auto;
      top: 50%;
      transform: translateY(-50%);
      flex-direction: column;
      animation: drag-actions-in-right 0.18s ease-out;
    }
  }

  .drag-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 84px;
    min-height: 60px;
    padding: 9px 15px;
    border-radius: 10px;
    background: var(--button-bg-color, #2d7d46);
    color: var(--button-text-color, #ffffff);
    border: 2px dashed transparent;
    cursor: grab;
    user-select: none;
    touch-action: none;
    transition:
      transform 0.1s ease,
      border-color 0.1s ease,
      background-color 0.1s ease;
  }

  .drag-action-btn:hover,
  .drag-action-btn:active {
    border-color: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px) scale(1.05);
  }

  .drag-action-icon {
    font-size: 21px;
    font-weight: bold;
    line-height: 1;
    pointer-events: none;
  }

  .drag-action-label {
    font-size: 12px;
    margin-top: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    pointer-events: none;
  }

  @keyframes drag-actions-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes drag-actions-in-right {
    from {
      opacity: 0;
      transform: translateY(-50%) translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
  }


  .piece-buttons button {
    padding: 5px 10px;
    font-size: 12px;
    touch-action: manipulation; /* Prevents double-tap zoom on mobile */
  }

  .controls {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  .timer-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cancel-challenge-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--button-bg-color);
    border: 1px solid transparent;
    color: var(--text-color);
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    touch-action: manipulation; /* Prevents double-tap zoom on mobile */
  }

  .cancel-challenge-btn:hover {
    opacity: 0.85;
  }

  .timer {
    font-size: 1rem;
    font-weight: bold;
    padding: 4px 10px;
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .timer.countdown-mode {
    background: linear-gradient(135deg, #2d7d46, #236b3a);
    color: white;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .timer.countdown-warning {
    background: linear-gradient(135deg, #e6a817, #cc8f00);
    color: white;
    animation: warning-pulse 1.5s ease-in-out infinite;
  }

  .timer.urgent {
    background: linear-gradient(135deg, #d94a4a, #bd3535);
    color: white;
    animation: urgent-pulse 0.5s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%,
    100% {
      box-shadow: 0 0 5px rgba(45, 125, 70, 0.3);
    }
    50% {
      box-shadow: 0 0 15px rgba(45, 125, 70, 0.5);
    }
  }

  @keyframes warning-pulse {
    0%,
    100% {
      box-shadow: 0 0 5px rgba(230, 168, 23, 0.3);
    }
    50% {
      box-shadow: 0 0 12px rgba(230, 168, 23, 0.5);
    }
  }

  @keyframes urgent-pulse {
    0%,
    100% {
      box-shadow: 0 0 5px rgba(217, 74, 74, 0.4);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 20px rgba(217, 74, 74, 0.7);
      transform: scale(1.02);
    }
  }

  @media (max-width: 768px) {
    .circle {
      width: 25px;
      height: 25px;
    }

    .piece-cell {
      width: 15px;
      height: 15px;
    }

    .piece-buttons button {
      padding: 3px 6px;
      font-size: 11px;
      touch-action: manipulation; /* Prevents double-tap zoom on mobile */
    }

    .board {
      transform: scale(0.9);
      margin: 0 auto;
    }

    .controls {
      position: static;
      width: 100%;
      order: -1;
      align-items: center;
    }

    .timer-container {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 0;
      margin: 0;
      position: relative;
      width: 100%;
      /* Reserve the gear icon's natural height (22px svg + 6px padding) so the
         absolutely-positioned settings icon stays in the same spot whether or
         not the timer is rendered. */
      min-height: 34px;
    }

    .settings-anchor {
      position: absolute;
      right: 0.5rem;
      top: 0;
      bottom: 0;
      display: flex;
      align-items: center;
    }
  }

  @media (max-width: 480px) {
    .circle {
      width: 25;
      height: 25;
    }

    .board {
      transform: scale(0.8);
    }

    .piece-container {
      max-width: 90px;
    }

    .drag-action-btn {
      min-width: 72px;
      min-height: 52px;
      padding: 7px 12px;
    }

    .drag-action-icon {
      font-size: 19px;
    }

    .drag-action-label {
      font-size: 11px;
    }
  }
</style>
