function createPiece(gl, glProgram, mesh, coordinate, color, pieceName) {
    let pieceObject = new GameObject(gl, glProgram, mesh);

    //black pieces
    if(color === 'b')
        pieceObject.setDiffuseColor(0.2, 0.18, 0.18, 0.5);

    pieceObject.placeOnSquare(coordinate);
    pieceObject.setPiece(pieceName);
    if(pieceName === 'N') pieceObject.setYaw(90);
    if(pieceName === 'n') pieceObject.setYaw(270);

    return pieceObject;
}

function getModelPathFromPiece(piece) {
    let basePath = '../assets/models/';
    let modelName = '';
    switch (piece) {
        case 'K':
            modelName = 'King_low.obj';
            break;
        case 'k':
            modelName = 'King_low.obj';
            break;
        case 'Q':
            modelName = 'Queen_low.obj';
            break;
        case 'q':
            modelName = 'Queen_low.obj';
            break;
        case 'R':
            modelName = 'Rook_low.obj';
            break;
        case 'r':
            modelName = 'Rook_low.obj';
            break;
        case 'B':
            modelName = 'Bishop_low.obj';
            break;
        case 'b':
            modelName = 'Bishop_low.obj';
            break;
        case 'N':
            modelName = 'Knight_low.obj';
            break;
        case 'n':
            modelName = 'Knight_low.obj';
            break;
        case 'P':
            modelName = 'Pawn_low.obj';
            break;
        case 'p':
            modelName = 'Pawn_low.obj';
            break;
        default:
            console.error("Not existing piece: ", piece);
            break;
    }
    return basePath + modelName;
}
