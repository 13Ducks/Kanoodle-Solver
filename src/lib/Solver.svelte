<script>
    let webWorker = null;

    const boardConfig = [
        "XXXXXXXXXXX",
        "XXXXXXXXXXX",
        "XllXXXXXXXX",
        "SSlXXXXXXXX",
        "SSlXXXXXXXX",
    ];

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
        let newShape = shape.clone();
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

    function RotateShape(Shape) {
        var NewShape = Shape.clone();

        for (var i = 0; i < NewShape.length; i++) {
            var x = NewShape[i][0];
            var y = NewShape[i][1];
            NewShape[i][0] = 6 - y;
            NewShape[i][1] = x;
        }
        NewShape.sort(LocCompare);

        return ShiftShape(NewShape);
    }

    function FlipShapeX(Shape) {
        var NewShape = Shape.clone();

        for (var i = 0; i < NewShape.length; i++) {
            NewShape[i][0] = 6 - NewShape[i][0];
        }
        NewShape.sort(LocCompare);

        return ShiftShape(NewShape);
    }

    function FlipShapeY(Shape) {
        var NewShape = Shape.clone();

        for (var i = 0; i < NewShape.length; i++) {
            NewShape[i][1] = 6 - NewShape[i][1];
        }
        NewShape.sort(LocCompare);

        return ShiftShape(NewShape);
    }

    function init(tiles) {
        let shapes = [];
        let curShape;
        let i, j, k;

        for (i = 0; i < tiles.length; i++) {
            shapes[i] = {};
            shapes[i]["layout"] = [];
            shapes[i]["name"] = tiles[i].name;
            shapes[i]["color"] = tiles[i].color;
            console.log(shapes);
            for (k = 0; k < 3; k++) {
                curShape = tiles[i].layout;
                switch (k) {
                    case 0:
                        curShape = ShiftShape(curShape);
                        curShape.sort(LocCompare);
                        break;
                    case 1:
                        curShape = FlipShapeX(curShape);
                        break;
                    case 2:
                        curShape = FlipShapeY(curShape);
                        break;
                }
                for (j = 0; j < 4; j++) {
                    if (!DuplicateLayout(shapes[i].layout, curShape)) {
                        AddLayout(i, curShape);
                    }
                    curShape = RotateShape(curShape);
                }
            }
            /*
        Debug("Pentomino " + Pentominoes[i].Name + " has " + Shapes[i].Layout.length + " layouts");
        for(var l=0; l<Shapes[i].Layout.length; l++){
            Debug(Shapes[i].Layout[l].toString())
        }
*/
        }

        Board.Width = 0;
        Board.Height = BoardConfig.length;
        for (i = 0; i < BoardConfig.length; i++) {
            Board.Width = Math.max(Board.Width, BoardConfig[i].length);
        }

        Board.Layout = [];
        for (i = 0; i < Board.Width; i++) {
            var Col = new Array();
            for (j = 0; j < Board.Height; j++) {
                if (BoardConfig[j].substring(i, i + 1) == "X") Col.push(-1);
                else Col.push(-2);
            }
            Board.Layout.push(Col);
        }

        DrawWorkBoard(Board);
    }
</script>

<button
    on:click={() => {
        init(tiles);
    }}>Solve</button
>
