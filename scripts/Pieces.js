//Creates and return a game object for a piece
function createPiece(gl, glProgram, mesh, coordinate, color, pieceName, kit) {
    let pieceObject = new GameObject(gl, glProgram, mesh);

    //Set textures and normal maps

    //black pieces
    if(color === 'b') {
        pieceObject.setDiffuseColor(kit.blackColor[0], kit.blackColor[1], kit.blackColor[2], kit.blackColor[3]);
        if(kit.blackTextureURI !== undefined && kit.piecesNormalMapURI !== undefined) {
            pieceObject.setTexture(gl, kit.blackTextureURI, kit.piecesNormalMapURI);
        }
    }
    else { // white pieces
        pieceObject.setDiffuseColor(kit.whiteColor[0], kit.whiteColor[1], kit.whiteColor[2], kit.whiteColor[3]);
        if(kit.whiteTextureURI !== undefined && kit.piecesNormalMapURI !== undefined) {
            pieceObject.setTexture(gl, kit.whiteTextureURI, kit.piecesNormalMapURI);
        }
    }

    pieceObject.setPieceColor(color);
    pieceObject.placeOnSquare(coordinate);
    pieceObject.setPiece(pieceName);
    if(pieceName === 'N') pieceObject.setYaw(90);
    if(pieceName === 'n') pieceObject.setYaw(270);

    return pieceObject;
}

function updatePieceKit(pieceObject, kit) {

    //black pieces
    if(pieceObject.getPieceColor() === 'b') {
        pieceObject.setDiffuseColor(kit.blackColor[0], kit.blackColor[1], kit.blackColor[2], kit.blackColor[3]);
        if(kit.blackTextureURI !== undefined && kit.piecesNormalMapURI !== undefined) {
            pieceObject.setTexture(gl, kit.blackTextureURI, kit.piecesNormalMapURI);
        } else {
            pieceObject.resetTexture();
        }
    }
    else { // white pieces
        pieceObject.setDiffuseColor(kit.whiteColor[0], kit.whiteColor[1], kit.whiteColor[2], kit.whiteColor[3]);
        if(kit.whiteTextureURI !== undefined && kit.piecesNormalMapURI !== undefined) {
            pieceObject.setTexture(gl, kit.whiteTextureURI, kit.piecesNormalMapURI);
        } else {
            pieceObject.resetTexture();
        }
    }
}

function getModelPathFromPiece(piece) {
    let basePath = '../assets/models/';
    let modelName = '';
    switch (piece) {
        case 'K':
            modelName = 'King_low_uv.obj';
            break;
        case 'k':
            modelName = 'King_low_uv.obj';
            break;
        case 'Q':
            modelName = 'Queen_low_uv.obj';
            break;
        case 'q':
            modelName = 'Queen_low_uv.obj';
            break;
        case 'R':
            modelName = 'Rook_low_uv.obj';
            break;
        case 'r':
            modelName = 'Rook_low_uv.obj';
            break;
        case 'B':
            modelName = 'Bishop_low_uv.obj';
            break;
        case 'b':
            modelName = 'Bishop_low_uv.obj';
            break;
        case 'N':
            modelName = 'Knight_low_uv.obj';
            break;
        case 'n':
            modelName = 'Knight_low_uv.obj';
            break;
        case 'P':
            modelName = 'Pawn_low_uv.obj';
            break;
        case 'p':
            modelName = 'Pawn_low_uv.obj';
            break;
        default:
            console.error("Not existing piece: ", piece);
            break;
    }
    return basePath + modelName;
}
