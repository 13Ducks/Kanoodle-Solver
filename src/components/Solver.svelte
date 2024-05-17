<script>
    import { onMount } from "svelte";

    const rows = 11;
    const cols = 5;

    let worker = null;
    let ranSolver = false;
    let solvable = "";
    let solvable_dot_cnt = 1;
    let solvable_interval = null;

    export let solution = null;
    export let request = "";
    export let board;
    export let pieces;

    onMount(() => {
        worker = new Worker(new URL("./solver.worker.js", import.meta.url));
        worker.onmessage = (event) => {
            MessageCb(event);
        };
    });

    const tiles = [
        {
            name: "L",
            layout: [
                [1, 1],
                [1, 2],
                [1, 3],
                [1, 4],
                [2, 4],
            ],
        },
        {
            name: "l",
            layout: [
                [1, 1],
                [1, 2],
                [1, 3],
                [2, 3],
            ],
        },
        {
            name: "i",
            layout: [
                [1, 1],
                [1, 2],
                [2, 2],
            ],
        },
        {
            name: "N",
            layout: [
                [2, 1],
                [2, 2],
                [1, 3],
                [2, 3],
                [1, 4],
            ],
        },
        {
            name: "V",
            layout: [
                [1, 1],
                [1, 2],
                [1, 3],
                [2, 3],
                [3, 3],
            ],
        },
        {
            name: "P",
            layout: [
                [1, 1],
                [2, 1],
                [1, 2],
                [2, 2],
                [1, 3],
            ],
        },
        {
            name: "S",
            layout: [
                [1, 1],
                [2, 1],
                [1, 2],
                [2, 2],
            ],
        },
        {
            name: "U",
            layout: [
                [1, 1],
                [3, 1],
                [1, 2],
                [2, 2],
                [3, 2],
            ],
        },
        {
            name: "W",
            layout: [
                [1, 1],
                [1, 2],
                [2, 2],
                [2, 3],
                [3, 3],
            ],
        },
        {
            name: "X",
            layout: [
                [2, 1],
                [1, 2],
                [2, 2],
                [3, 2],
                [2, 3],
            ],
        },
        {
            name: "Y",
            layout: [
                [1, 1],
                [1, 2],
                [1, 3],
                [2, 3],
                [1, 4],
            ],
        },
        {
            name: "I",
            layout: [
                [1, 1],
                [1, 2],
                [1, 3],
                [1, 4],
            ],
        },
    ];

    function shiftShape(shape) {
        let newShape = JSON.parse(JSON.stringify(shape));
        let minX = newShape[0][0];
        let minY = newShape[0][1];

        for (let i = 0; i < newShape.length; i++) {
            minX = Math.min(minX, newShape[i][0]);
            minY = Math.min(minY, newShape[i][1]);
        }

        for (let i = 0; i < newShape.length; i++) {
            newShape[i][0] -= minX;
            newShape[i][1] -= minY;
        }

        return newShape;
    }

    function rotateShape(shape) {
        let newShape = JSON.parse(JSON.stringify(shape));

        for (let i = 0; i < newShape.length; i++) {
            let x = newShape[i][0];
            let y = newShape[i][1];
            newShape[i][0] = 6 - y;
            newShape[i][1] = x;
        }
        newShape.sort(locCompare);

        return shiftShape(newShape);
    }

    function flipShapeX(shape) {
        var newShape = JSON.parse(JSON.stringify(shape));

        for (var i = 0; i < newShape.length; i++) {
            newShape[i][0] = 6 - newShape[i][0];
        }
        newShape.sort(locCompare);

        return shiftShape(newShape);
    }

    function flipShapeY(shape) {
        var newShape = JSON.parse(JSON.stringify(shape));

        for (var i = 0; i < newShape.length; i++) {
            newShape[i][1] = 6 - newShape[i][1];
        }
        newShape.sort(locCompare);

        return shiftShape(newShape);
    }

    function locCompare(loc1, loc2) {
        if (loc1[0] < loc2[0]) return -1;
        if (loc1[0] > loc2[0]) return 1;
        if (loc1[1] < loc2[1]) return -1;
        if (loc1[1] > loc2[1]) return 1;
        return 0;
    }

    function duplicateLayout(layouts, shape) {
        for (var i = 0; i < layouts.length; i++) {
            if (compareShape(layouts[i], shape)) return true;
        }

        return false;
    }

    function compareShape(shape1, shape2) {
        if (shape1.length != shape2.length) return false;

        for (var i = 0; i < shape2.length; i++) {
            if (shape1[i][0] != shape2[i][0]) return false;
            if (shape1[i][1] != shape2[i][1]) return false;
        }

        return true;
    }

    function addLayout(shapeNo, layout, shapes) {
        shapes[shapeNo].layout.push(layout);
    }

    function init(tiles, board) {
        let shapes = [];
        let curShape;
        let i, j, k;

        for (i = 0; i < tiles.length; i++) {
            shapes[i] = {};
            shapes[i]["layout"] = [];
            shapes[i]["name"] = tiles[i].name;
            for (k = 0; k < 3; k++) {
                curShape = tiles[i].layout;
                switch (k) {
                    case 0:
                        curShape = shiftShape(curShape);
                        curShape.sort(locCompare);
                        break;
                    case 1:
                        curShape = flipShapeX(curShape);
                        break;
                    case 2:
                        curShape = flipShapeY(curShape);
                        break;
                }
                for (j = 0; j < 4; j++) {
                    if (!duplicateLayout(shapes[i]["layout"], curShape)) {
                        addLayout(i, curShape, shapes);
                    }
                    curShape = rotateShape(curShape);
                }
            }
        }

        let Board = {};

        let boardConfig = [];

        for (let i = 0; i < board.length; i++) {
            let row = "";
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j] === null) {
                    row += ".";
                } else {
                    row += board[i][j];
                }
            }
            boardConfig.push(row);
        }

        Board.Width = 0;
        Board.Height = boardConfig.length;
        for (i = 0; i < boardConfig.length; i++) {
            Board.Width = Math.max(Board.Width, boardConfig[i].length);
        }

        Board.Layout = [];
        for (i = 0; i < Board.Width; i++) {
            var Col = new Array();
            for (j = 0; j < Board.Height; j++) {
                if (boardConfig[j].substring(i, i + 1) == ".") Col.push(-1);
                else Col.push(boardConfig[j].substring(i, i + 1));
            }
            Board.Layout.push(Col);
        }

        return [shapes, Board];
        // DrawWorkBoard(Board);
    }

    function MessageCb(Event) {
        var Data = Event.data;
        var Board;

        switch (Data.MsgType) {
            case "debug":
                console.log(Data.Msg);
                break;

            case "solution":
                let board = JSON.parse(Data.Board).Layout;
                ranSolver = true;
                solution = board;
                clearInterval(solvable_interval);
                solvable_dot_cnt = 1;
                solvable = "Solvable";
                break;

            case "finished":
                ranSolver = true;
                solution = null;
                clearInterval(solvable_interval);
                solvable_dot_cnt = 1;
                solvable = "Not Solvable";
                break;
        }
    }

    function getRandomPieces(count) {
        const keys = Object.keys(tiles);
        const result = [];

        for (let i = 0; i < count; i++) {
            if (keys.length === 0) {
                break;
            }
            const randomIndex = Math.floor(Math.random() * keys.length);
            const randomKey = keys.splice(randomIndex, 1)[0];
            result.push(tiles[randomKey]);
        }

        return result;
    }

    function startWorker(tiles) {
        let tilesToUse = tiles.filter((tile) => !pieces[tile.name].placed);
        let [shapes, solveBoard] = init(tilesToUse, board);
        console.log(shapes, solveBoard);
        worker.postMessage({
            MsgType: "start",
            Shapes: JSON.stringify(shapes),
            Board: JSON.stringify(solveBoard),
        });
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
            startWorker(tiles);
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
            startWorker(tiles);
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
            startWorker(tiles);
        }
    }

    async function handleRandom() {
        request = "random";
        solvable = "Randomizing...";

        let newBoard = Array(rows)
            .fill(null)
            .map(() => Array(cols).fill(null));
        const randomPieces = getRandomPieces(2);
        console.log(randomPieces);

        for (const piece of randomPieces) {
            const pieceLayout = piece.layout;

            let placed = false;
            while (!placed) {
                const row = Math.floor(Math.random() * board.length);
                const col = Math.floor(Math.random() * board[0].length);

                for (const [pieceRow, pieceCol] of pieceLayout) {
                    if (
                        row + pieceRow - 1 >= board.length ||
                        col + pieceCol - 1 >= board[0].length ||
                        newBoard[row + pieceRow - 1][col + pieceCol - 1] !==
                            null
                    ) {
                        continue;
                    }
                }
                placed = true;

                for (const [pieceRow, pieceCol] of pieceLayout) {
                    console.log(row, col, pieceRow, pieceCol);
                    newBoard[row + pieceRow - 1][col + pieceCol - 1] =
                        piece.name;
                }
            }
        }

        console.log(newBoard);

        // Check if the game is solvable
        const remainingTiles = tiles.filter(
            (tile) => !pieces[tile.name].placed,
        );
        const [shapes, solvableBoard] = init(remainingTiles);
        worker.postMessage({
            MsgType: "start",
            Shapes: JSON.stringify(shapes),
            Board: JSON.stringify(solvableBoard),
        });

        // // Wait for the worker to finish solving
        // await new Promise((resolve) => {
        //     const onMessage = (event) => {
        //         if (
        //             event.data.MsgType === "solution" ||
        //             event.data.MsgType === "finished"
        //         ) {
        //             worker.removeEventListener("message", onMessage);
        //             resolve();
        //         }
        //     };
        //     worker.addEventListener("message", onMessage);
        // });

        // if (solution !== null) {
        //     solvable = "Solvable";
        // } else {
        //     // If not solvable, retry generating a random game
        //     handleRandom();
        // }
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
                handleHint(tiles);
            }}>Hint</button
        >
        <button
            on:click={() => {
                handleSolve(tiles);
            }}>Solve</button
        >
        <!-- <button
            style="margin-left: 30px;"
            on:click={() => {
                handleRandom(tiles);
            }}>Random Game</button
        > -->
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
