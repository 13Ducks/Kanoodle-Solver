var BoardConfig = [
	"XXXXXXXXXXX",
	"XXXXXXXXXXX",
	"XllXXXXXXXX",
	"SSlXXXXXXXX",
	"SSlXXXXXXXX",
];

var Pentominoes = [
{
    Name: "L",
    Layout: [
    [1,1],
    [1,2],
    [1,3],
    [1,4],[2,4]
    ]},
{
    Name: "i",
    Layout: [
    [1,1],
    [1,2],[2,2]
    ]},
{
    Name: "N",
    Layout: [
          [2,1],
          [2,2],
    [1,3],[2,3],
    [1,4]
    ]},
{
    Name: "V",
    Layout: [
    [1,1],
    [1,2],
    [1,3],[2,3],[3,3]
    ]},
{
    Name: "P",
    Layout: [
    [1,1],[2,1],
    [1,2],[2,2],
    [1,3]
    ]},
{
    Name: "U",
    Layout: [
    [1,1],      [3,1],
    [1,2],[2,2],[3,2]
    ]},
{
    Name: "W",
    Layout: [
    [1,1],
    [1,2],[2,2],
          [2,3],[3,3]
    ]},
{
    Name: "X",
    Layout: [
          [2,1],
    [1,2],[2,2],[3,2],
          [2,3]
    ]},
{
    Name: "Y",
    Layout: [
    [1,1],
    [1,2],
    [1,3],[2,3],
    [1,4]
    ]},
{
    Name: "I",
    Layout: [
    [1,1],
    [1,2],
    [1,3],
    [1,4],
    ]},
];

var Shapes = [];

var Board = {};

var WebWorker = null;
var Solutions = 0;
var SolHash = {};

Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};

function StartWorker()
{
    Initialise();
    
    if(typeof(Worker)!=="undefined"){
        WebWorker = new Worker('Kanoodle.js');
    
        WebWorker.addEventListener('message', MessageCb, false);
    
        WebWorker.postMessage({'MsgType': "start", 'Shapes': JSON.stringify(Shapes), 'Board': JSON.stringify(Board)});
    }
    else{
        WorkerStopped();
        alert("This browser does not support Web Workers! Try Chrome, Firefox, Opera or Safari");
    }
}

function StopWorker()
{
    WebWorker.terminate();
    WorkerStopped();
}

function WorkerStopped()
{
    WebWorker = null;
    $("#stopbtn").remove();    
}

function MessageCb(Event)
{
    var Data = Event.data;
    var Board;
    
    switch(Data.MsgType){
    case "debug":
        Debug(Data.Msg);
        break;
        
    case "solution":
        Board = JSON.parse(Data.Board);
        if(!DuplicateSolution(Board, Shapes)){
            DumpBoard(Board, Shapes);
        }
        break;
        
    case "workupdate":
        Board = JSON.parse(Data.Board);
        UpdateWorkBoard(Board);
        break;

    case "finished":
        StopWorker();
        break;
        
    }
}

function DuplicateSolution(Board, Shapes)
{
    var Dupe = false;
    var String = "";
    var CurShape;
    var Row;
    var Col;
    
    for(Row=0; Row<Board.Height; Row++){
        for(Col=0; Col<Board.Width; Col++){
            CurShape = Board.Layout[Col][Row];
            if(CurShape>=0) String += Shapes[CurShape].Name;
        }
    }

    if(SolHash[String] === undefined){
        SolHash[String] = null;
    }
    else{
        Dupe = true;
    }

    return Dupe;
}

function Initialise()
{
    var CurShape;
    var i,j,k;
    
//    Debug("Using " + Pentominoes.length + " pentominoes");
    for(i=0; i<Pentominoes.length; i++){
        Shapes[i] = {}
        Shapes[i].Layout = [];
        Shapes[i].Name = Pentominoes[i].Name;
        Shapes[i].Colour = Pentominoes[i].Colour;
        for(k=0; k<3; k++){
            CurShape = Pentominoes[i].Layout;
            switch(k){
                case 0:
                    CurShape = ShiftShape(CurShape);
                    CurShape.sort(LocCompare);
                    break;
                case 1:
                    CurShape = FlipShapeX(CurShape);
                    break;
                case 2:
                    CurShape = FlipShapeY(CurShape);
                    break;
            }
            for(j=0; j<4; j++){
                if(!DuplicateLayout(Shapes[i].Layout, CurShape)){
                    AddLayout(i, CurShape);
                }
                CurShape = RotateShape(CurShape);
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
    for(i=0; i<BoardConfig.length; i++){
        Board.Width = Math.max(Board.Width, BoardConfig[i].length);
    }

    Board.Layout = [];
    for(i=0; i<Board.Width; i++){
        var Col = new Array();
        for(j=0; j<Board.Height; j++){
            if(BoardConfig[j].substring(i,i+1) == "X") Col.push(-1);
            else Col.push(-2);
        }
        Board.Layout.push(Col);
    }
    
    DrawWorkBoard(Board);
}

function AddLayout(ShapeNo, Layout)
{
    Shapes[ShapeNo].Layout.push(Layout);
}

function DuplicateLayout(Layouts, Shape)
{
    for(var i=0; i<Layouts.length; i++){
        if(CompareShape(Layouts[i], Shape)) return true;
    }
    
    return false;
}

function CompareShape(Shape1, Shape2)
{
    if(Shape1.length != Shape2.length) return false;
    
    for(var i=0; i<Shape1.length; i++){
        if(Shape1[i][0] != Shape2[i][0]) return false;
        if(Shape1[i][1] != Shape2[i][1]) return false;
    }
    
    return true;
}

function ShiftShape(Shape)
{
    var NewShape = Shape.clone();
    var MinX = NewShape[0][0];
    var MinY = NewShape[0][1];
    var i;
    
    for(i=0; i<NewShape.length; i++){
        MinX = Math.min(MinX, NewShape[i][0]);
        MinY = Math.min(MinY, NewShape[i][1]);
    }
    
    for(i=0; i<NewShape.length; i++){
        NewShape[i][0] -= MinX;
        NewShape[i][1] -= MinY;
    }    
    
    return NewShape;
}

function RotateShape(Shape)
{
    var NewShape = Shape.clone();
    
    for(var i=0; i<NewShape.length; i++){
        var x = NewShape[i][0];
        var y = NewShape[i][1];
        NewShape[i][0] = 6-y;
        NewShape[i][1] = x;
    }
    NewShape.sort(LocCompare);
    
    return ShiftShape(NewShape);
}

function FlipShapeX(Shape)
{
    var NewShape = Shape.clone();
    
    for(var i=0; i<NewShape.length; i++){
        NewShape[i][0] = 6 - NewShape[i][0];
    }
    NewShape.sort(LocCompare);
    
    return ShiftShape(NewShape);    
}

function FlipShapeY(Shape)
{
    var NewShape = Shape.clone();
    
    for(var i=0; i<NewShape.length; i++){
        NewShape[i][1] = 6 - NewShape[i][1];
    }
    NewShape.sort(LocCompare);

    return ShiftShape(NewShape);        
}

function LocCompare(Loc1, Loc2)
{
    if(Loc1[0] < Loc2[0]) return -1;
    if(Loc1[0] > Loc2[0]) return 1;
    if(Loc1[1] < Loc2[1]) return -1;
    if(Loc1[1] > Loc2[1]) return 1;
    return 0;
}

function Debug(Msg)
{
    $("#debug").append('<p class="debug">' + Msg + "</p>");    
}