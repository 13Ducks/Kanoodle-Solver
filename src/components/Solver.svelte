<script>
    import { startSolve } from "./NoodleSolver";

    const rows = 11;
    const cols = 5;

    let ranSolver = false;
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
        ranSolver = true;
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
        if (ranSolver) {
            if (solution !== null) {
                solvable = "Solvable";
            } else {
                solvable = "Not Solvable";
            }
        } else {
            solvable = "Checking";
            solvable_interval = setInterval(() => {
                solvable = "Checking" + ".".repeat(solvable_dot_cnt);
                solvable_dot_cnt = (solvable_dot_cnt + 1) % 4;
            }, 400);

            runSolver(board);
        }
    }

    function handleHint() {
        request = "hint";
        if (!ranSolver) {
            solvable = "Solving";
            solvable_interval = setInterval(() => {
                solvable = "Solving" + ".".repeat(solvable_dot_cnt);
                solvable_dot_cnt = (solvable_dot_cnt + 1) % 4;
            }, 400);

            runSolver(board);
        }
    }

    function handleSolve() {
        request = "solve";
        if (!ranSolver) {
            solvable = "Solving";
            solvable_interval = setInterval(() => {
                solvable = "Solving" + ".".repeat(solvable_dot_cnt);
                solvable_dot_cnt = (solvable_dot_cnt + 1) % 4;
            }, 400);

            runSolver(board);
        }
    }

    function handleRandom() {
        request = "random";
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
        solution = null;
        ranSolver = false;
    }

    $: {
        if (board) {
            ranSolver = false;
        }
    }
</script>

<div class="solve">
    <div>
        <button
            on:click={() => {
                handleSolvable();
            }}>Solvable?</button
        >
        <button
            on:click={() => {
                handleHint();
            }}>Hint</button
        >
        <button
            on:click={() => {
                handleSolve();
            }}>Solve</button
        >
        <button
            style="margin-left: 30px;"
            on:click={() => {
                handleRandom();
            }}>Random Game</button
        >
        <button
            on:click={() => {
                handleReset();
            }}>Reset</button
        >
    </div>

    <h2>{solvable}</h2>
</div>

<style>
    .solve {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
</style>
