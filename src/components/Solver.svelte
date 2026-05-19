<script>
    import { startSolve } from "./NoodleSolver";

    const rows = 11;
    const cols = 5;

    export let randomPieceCount = 2;
    export let solvable = "";
    let solvable_dot_cnt = 1;
    let solvable_interval = null;

    export let solution = null;
    export let request = "";
    export let board;
    export let triggerRandom = false;
    export let fanEditionEnabled = false;
    export let findAllSolutionsEnabled = false;

    // Multi-solution support
    let allSolutions = [];
    let currentSolutionIndex = 0;
    let totalSolutions = 0;
    let limitReached = false;

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
        m: 13,
        M: 14,
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
        13: "m",
        14: "M",
    };

    function transpose(matrix) {
        return matrix[0].map((col, i) => matrix.map((row) => row[i]));
    }

    function runSolver(board, { findAll = false, countOnly = false } = {}) {
        let boardToUse = transpose(board);
        for (let i = 0; i < boardToUse.length; i++) {
            for (let j = 0; j < boardToUse[i].length; j++) {
                if (boardToUse[i][j] !== null) {
                    boardToUse[i][j] = replaceDict[boardToUse[i][j]];
                }
            }
        }

        let result = startSolve(boardToUse, {
            findAll,
            maxSolutions: 1000,
            useFanEdition: fanEditionEnabled,
        });
        clearInterval(solvable_interval);
        solvable_dot_cnt = 1;

        if (!result.solved) {
            solution = null;
            allSolutions = [];
            currentSolutionIndex = 0;
            totalSolutions = 0;
            limitReached = false;
            solvable = "Not Solvable";
            return;
        }

        // Convert grid(s) to use piece letters
        function convertGrid(grid) {
            return grid.map((row) =>
                row.map((cell) => (cell !== null ? solveDict[cell] : null)),
            );
        }

        if (findAll && result.solutions) {
            // Multi-solution mode
            totalSolutions = result.totalCount;
            limitReached = result.limitReached;

            if (countOnly) {
                // Just show the count, don't set solution
                allSolutions = [];
                currentSolutionIndex = 0;
                solvable = limitReached
                    ? `${totalSolutions}+ solutions`
                    : `${totalSolutions} solution${totalSolutions > 1 ? "s" : ""}`;
            } else {
                // Full solve mode - store solutions for navigation
                allSolutions = result.solutions.map(convertGrid);
                currentSolutionIndex = 0;
                solution = allSolutions[0];
                solvable = limitReached
                    ? `${totalSolutions}+ solutions found`
                    : `${totalSolutions} solution${totalSolutions > 1 ? "s" : ""} found`;
            }
        } else {
            // Single solution mode
            allSolutions = [];
            currentSolutionIndex = 0;
            totalSolutions = 0;
            limitReached = false;
            if (!countOnly) {
                solution = convertGrid(result.grid);
            }
            solvable = "Solvable";
        }
    }

    function handleSolvable() {
        request = "solvable";

        solvable = findAllSolutionsEnabled ? "Counting" : "Checking";
        solvable_interval = setInterval(() => {
            solvable =
                (findAllSolutionsEnabled ? "Counting" : "Checking") +
                ".".repeat(solvable_dot_cnt);
            solvable_dot_cnt = (solvable_dot_cnt + 1) % 4;
        }, 400);

        runSolver(board, { findAll: findAllSolutionsEnabled, countOnly: true });
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

        runSolver(board, { findAll: findAllSolutionsEnabled });
    }

    function nextSolution() {
        if (allSolutions.length > 1) {
            currentSolutionIndex =
                (currentSolutionIndex + 1) % allSolutions.length;
            solution = allSolutions[currentSolutionIndex];
        }
    }

    function prevSolution() {
        if (allSolutions.length > 1) {
            currentSolutionIndex =
                (currentSolutionIndex - 1 + allSolutions.length) %
                allSolutions.length;
            solution = allSolutions[currentSolutionIndex];
        }
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

    // Allow external triggering of random game (e.g., from Challenge mode)
    $: if (triggerRandom) {
        handleRandom();
        triggerRandom = false;
    }

    function handleReset() {
        request = "reset";
        solvable = "";
        solution = [];
        allSolutions = [];
        currentSolutionIndex = 0;
        totalSolutions = 0;
        limitReached = false;
    }
</script>

<div class="solve" class:has-status={solvable}>
    <div class="button-container">
        <div class="button-row">
            <button on:click={handleSolvable} class="solvable-btn"
                >{findAllSolutionsEnabled ? "Count" : "Solvable?"}</button
            >
            <button on:click={handleHint}>Hint</button>
            <button on:click={handleSolve}>Solve</button>
        </div>

        <div class="button-row">
            <button on:click={handleRandom}>Random Game</button>
            <button on:click={handleReset}>Reset</button>
        </div>
    </div>

    {#if allSolutions.length > 1}
        <div class="solution-nav">
            <button class="nav-btn" on:click={prevSolution}>◀</button>
            <span class="solution-counter">
                {currentSolutionIndex + 1} / {totalSolutions}{limitReached
                    ? "+"
                    : ""}
            </span>
            <button class="nav-btn" on:click={nextSolution}>▶</button>
        </div>
    {/if}

    <h2>{solvable}</h2>
</div>

<style>
    .solve {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding-top: 20px;
        transition: margin-bottom 0.15s ease;
    }

    .solve.has-status {
        margin-bottom: 40px;
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

    .solvable-btn {
        min-width: 7em;
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

    @media (max-width: 480px) {
        h2 {
            font-size: 1rem;
            max-width: 90vw;
            white-space: normal;
            text-align: center;
        }
    }

    .solution-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-top: 12px;
        padding: 8px 16px;
        background: var(--button-bg-color);
        border-radius: 8px;
        border: 1px solid var(--text-color);
    }

    .nav-btn {
        padding: 6px 12px;
        font-size: 14px;
        cursor: pointer;
        border-radius: 4px;
        transition: transform 0.1s ease;
    }

    .nav-btn:hover {
        transform: scale(1.05);
    }

    .nav-btn:active {
        transform: scale(0.95);
    }

    .solution-counter {
        font-weight: bold;
        font-size: 14px;
        min-width: 80px;
        text-align: center;
    }
</style>
