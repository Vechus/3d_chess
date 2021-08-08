function createPiece(gl, glProgram, mesh, numberOfPieces) {
    let piecesArray = [];
    for(let i = 0; i < numberOfPieces; i++) {
        let pieceObject = new GameObject(gl, glProgram, mesh);
        piecesArray.push(pieceObject);
    }

    //black pieces
    for(let i = 0; i < numberOfPieces/2; i++) {
        piecesArray[i].setDiffuseColor(0.2, 0.18, 0.18, 0);
    }

    return piecesArray;
}