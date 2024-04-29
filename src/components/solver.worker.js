// FROM https://github.com/andywarduk/KanoodleJs

Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (var i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

self.addEventListener('message', MsgHandler);

function MsgHandler(Event)
{
    var Data = Event.data;
    
    switch(Data.MsgType){
        case "start":
            const checkFailed = checkObviousFail(JSON.parse(Data.Board));
            if (checkFailed) {
                self.postMessage({'MsgType': "finished"});
                return;
            }
            StartFit(JSON.parse(Data.Shapes), JSON.parse(Data.Board));
            break;
        default:
            Debug("Unrecognised command " + Data.MsgType);
            break;
    }
}

function checkObviousFail(board) {
    const boardClone = board.clone();
    const layout = boardClone.Layout;
    const m = layout.length;
    const n = layout[0].length;


    function dfs(i, j) {
        if (i >= 0 && i < m && j >= 0 && j < n && layout[i][j] === -1) {
            layout[i][j] = 0;
            return 1 + dfs(i - 1, j) + dfs(i, j + 1) + dfs(i + 1, j) + dfs(i, j - 1);
        }
        return 0;
    }

    const areas = [];
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (layout[i][j] === -1) {
                areas.push(dfs(i, j));
            }
        }
    }

    // no piece smaller than 3 so must be impossible
    if (Math.min(...areas) <= 2) return true;
    return false;
}

function StartFit(Shapes, Board)
{    
    var ShapeList = [];
    for(var i=0; i<Shapes.length; i++){
        ShapeList.push(i);
    }

    FitShapes(Shapes, Board, 0, 0, ShapeList);

    self.postMessage({'MsgType': "finished"});
}

function FitShapes(Shapes, Board, BoardX, BoardY, ShapeList)
{
    var BoardLayout = Board.Layout;
    var Pt;
    
    // Find free square
    do{
        if(BoardLayout[BoardX][BoardY] == -1){
            // Fit shape here
            break;
        }
        else{
            if(++BoardX >= Board.Width){
                BoardX=0;
                if(++BoardY >= Board.Height){
                    Debug("OUT OF SPACES!?");
                    return;
                }
            }
        }
    } while(1);
    
    for(var ListItem=0; ListItem<ShapeList.length; ListItem++){
        var ShapeNo = ShapeList[ListItem];
        var Shape = Shapes[ShapeNo];
        var Layouts = Shape.layout;
        for(var LayoutNo=0; LayoutNo<Layouts.length; LayoutNo++){
            var Layout = Layouts[LayoutNo];
            for(var PtNo=0; PtNo<Layout.length; PtNo++){
                var OffX = BoardX - Layout[PtNo][0];
                var OffY = BoardY - Layout[PtNo][1];
                var Fit = true;
                for(var Pt=0; Pt<Layout.length; Pt++){
                    var PtX = OffX + Layout[Pt][0];
                    var PtY = OffY + Layout[Pt][1];
                    if(PtX<0 || PtX>=Board.Width || PtY<0 || PtY>=Board.Height){
                        Fit = false;
                        break;
                    }
                    if(BoardLayout[PtX][PtY] != -1){
                        Fit = false;
                        break;
                    }
                }
                if(Fit){
                    // The shape fits here
                    var NewBoard = Board.clone();
                    // Update the board
                    for(var Pt=0; Pt<Layout.length; Pt++){
                        var PtX = OffX + Layout[Pt][0];
                        var PtY = OffY + Layout[Pt][1];
                        NewBoard.Layout[PtX][PtY] = ShapeNo;
                    }      
                    // Update the shape list
                    var NewShapeList = ShapeList.clone();
                    NewShapeList.remove(ListItem);
//                    Debug("Fit shape " + Shape.Name + "(" + ShapeNo + ") layout " + LayoutNo + " point " + PtNo + " at " + BoardX + ","+BoardY);
                    if(NewShapeList.length == 0){
                        // Got a solution!
                        for (var i = 0; i < NewBoard.Layout.length; i++) {
                            for (var j = 0; j < NewBoard.Layout[i].length; j++) {
                                if (typeof NewBoard.Layout[i][j] === 'number') {
                                    NewBoard.Layout[i][j] = Shapes[NewBoard.Layout[i][j]].name;
                                }
                            }
                        }
                        self.postMessage({'MsgType': "solution", 'Board': JSON.stringify(NewBoard)});
                        throw "Solution found";
                    }
                    else{
                        FitShapes(Shapes, NewBoard, BoardX, BoardY, NewShapeList);
                    }
                }
            }
        }
    }
}


function Debug(Msg)
{
    self.postMessage({'MsgType': "debug", 'Msg': Msg});
}