<script>
    import { onMount } from "svelte";

    let worker = null;
    let solvable = "";

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

    let solutions = new Set();

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

    function init(tiles) {
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
                else Col.push(-2);
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
                if (solutions.has(Data.Board)) {
                    break;
                }

                let Board = JSON.parse(Data.Board);
                console.log(Board);
                solvable = "Solvable";
                break;

            case "finished":
                solvable = "Not Solvable";
                break;
        }
    }

    function startWorker(tiles) {
        let tilesToUse = tiles.filter((tile) => !pieces[tile.name].placed);
        let [shapes, Board] = init(tilesToUse);
        solvable = "Checking...";
        console.log(shapes, Board);
        worker.postMessage({
            MsgType: "start",
            Shapes: JSON.stringify(shapes),
            Board: JSON.stringify(Board),
        });
    }
</script>

<div class="solve">
    <button
        on:click={() => {
            startWorker(tiles);
        }}>Solvable?</button
    >

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
