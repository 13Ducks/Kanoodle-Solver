<script>
    import { onMount } from "svelte";
    import { startSolve } from "./NoodleSolver";

    const rows = 11;
    const cols = 5;

    let randomButtonGroup;
    let isRandomMenuOpen = false;

    let randomPieceCount = 2;
    let solvable = "";
    let solvable_dot_cnt = 1;
    let solvable_interval = null;

    export let solution = null;
    export let request = "";
    export let board;

    const replaceDict = {
        l: 1,
        P: 2,
        L: 3,
        Y: 4,
        N: 5,
        i: 6,
        V: 7,
        W: 8,
        U: 9,
        I: 10,
        S: 11,
        X: 12,
    };

    const solveDict = {
        1: "l",
        2: "P",
        3: "L",
        4: "Y",
        5: "N",
        6: "i",
        7: "V",
        8: "W",
        9: "U",
        10: "I",
        11: "S",
        12: "X",
    };

    onMount(() => {
        const handleClickOutside = (event) => {
            if (
                isRandomMenuOpen &&
                randomButtonGroup &&
                !randomButtonGroup.contains(event.target)
            ) {
                isRandomMenuOpen = false;
            }
        };

        window.addEventListener("click", handleClickOutside);

        return () => {
            window.removeEventListener("click", handleClickOutside);
        };
    });

    function toggleRandomMenu(event) {
        event.stopPropagation();
        isRandomMenuOpen = !isRandomMenuOpen;
    }

    function transpose(matrix) {
        return matrix[0].map((col, i) => matrix.map((row) => row[i]));
    }

    function runSolver(board) {
        let boardToUse = transpose(board);
        for (let i = 0; i < boardToUse.length; i++) {
            for (let j = 0; j < boardToUse[i].length; j++) {
                if (boardToUse[i][j] !== null) {
                    boardToUse[i][j] = replaceDict[boardToUse[i][j]];
                }
            }
        }

        let solvedBoard = startSolve(boardToUse);
        clearInterval(solvable_interval);
        solvable_dot_cnt = 1;

        if (!solvedBoard.solved) {
            solution = null;
            solvable = "Not Solvable";
            return;
        }

        solvable = "Solvable";
        let solvedBoardGrid = solvedBoard.grid;
        for (let i = 0; i < solvedBoardGrid.length; i++) {
            for (let j = 0; j < solvedBoardGrid[i].length; j++) {
                if (solvedBoardGrid[i][j] !== null) {
                    solvedBoardGrid[i][j] = solveDict[solvedBoardGrid[i][j]];
                }
            }
        }

        solution = solvedBoardGrid;
    }

    function handleSolvable() {
        request = "solvable";

        solvable = "Checking";
        solvable_interval = setInterval(() => {
            solvable = "Checking" + ".".repeat(solvable_dot_cnt);
            solvable_dot_cnt = (solvable_dot_cnt + 1) % 4;
        }, 400);

        runSolver(board);
    }

    function handleHint() {
        request = "hint";
        solvable = "Solving";
        solvable_interval = setInterval(() => {
            solvable = "Solving" + ".".repeat(solvable_dot_cnt);
            solvable_dot_cnt = (solvable_dot_cnt + 1) % 4;
        }, 400);

        runSolver(board);
    }

    function handleSolve() {
        request = "solve";
        solvable = "Solving";
        solvable_interval = setInterval(() => {
            solvable = "Solving" + ".".repeat(solvable_dot_cnt);
            solvable_dot_cnt = (solvable_dot_cnt + 1) % 4;
        }, 400);

        runSolver(board);
    }

    function handleRandom() {
        request = `random-${randomPieceCount}`;
        solvable = "Randomizing";
        solvable_interval = setInterval(() => {
            solvable = "Randomizing" + ".".repeat(solvable_dot_cnt);
            solvable_dot_cnt = (solvable_dot_cnt + 1) % 4;
        }, 400);

        let grid = Array.from({ length: cols }, () =>
            Array.from({ length: rows }, () => 0),
        );
        runSolver(grid);
        solvable = "Good luck!";
    }

    function handleReset() {
        request = "reset";
        solvable = "";
        solution = [];
    }
</script>

<div class="solve">
    <div class="button-container">
        <div class="button-row">
            <button on:click={handleSolvable}>Solvable?</button>
            <button on:click={handleHint}>Hint</button>
            <button on:click={handleSolve}>Solve</button>
        </div>

        <div class="button-row">
            <div class="random-button-group" bind:this={randomButtonGroup}>
                <button on:click={handleRandom} class="random-main"
                    >Random Game</button
                >
                <div class="separator"></div>
                <button
                    class="dropdown-toggle"
                    on:click={toggleRandomMenu}
                    class:active={isRandomMenuOpen}
                >
                    ▼
                </button>

                {#if isRandomMenuOpen}
                    <div class="random-dropdown">
                        <div class="slider-container">
                            <span class="piece-count"
                                >Pieces: {randomPieceCount}</span
                            >
                            <input
                                type="range"
                                min="1"
                                max="6"
                                bind:value={randomPieceCount}
                                class="piece-slider"
                            />
                        </div>
                    </div>
                {/if}
            </div>
            <button on:click={handleReset}>Reset</button>
        </div>
    </div>

    <h2>{solvable}</h2>
</div>

<style>
    .solve {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding-top: 20px;
    }

    .button-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
        width: 100%;
    }

    .button-row {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
    }

    .random-button-group {
        position: relative;
        display: flex;
        align-items: stretch;
    }

    .random-main {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        margin: 0;
    }

    .dropdown-toggle {
        padding: 0 8px;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        margin: 0;
        cursor: pointer;
    }

    .separator {
        width: 1px;
        background-color: var(--text-color);
        margin: 0;
    }

    .random-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--button-bg-color);
        border: 1px solid var(--text-color);
        border-radius: 4px;
        padding: 12px;
        margin-top: 4px;
        z-index: 100;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .slider-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .piece-count {
        font-size: 14px;
    }

    .piece-slider {
        width: 150px;
    }

    .solve {
        position: relative;
    }

    h2 {
        position: absolute;
        top: 120%;
        left: 50%;
        transform: translateX(-50%);
        width: max-content;
        margin: 0;
        visibility: hidden;
    }

    h2:not(:empty) {
        visibility: visible;
    }

    @media (min-width: 768px) {
        .button-container {
            flex-direction: row;
            flex-wrap: nowrap;
        }
    }
</style>
