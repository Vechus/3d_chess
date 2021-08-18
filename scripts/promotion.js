var piece;
async function promote(square, turn) {
    let color;
    if(turn === 'black') {
        color = 'b';
        piece = piece.toLowerCase();
    }
    else color = 'w';
    let object = createPiece(gl, glProgram, await loadAndInitMesh(getModelPathFromPiece(piece)), square, color, piece, CURRENT_KIT);
    Scene.push(object);
    window.isPromoting = false;
}

function setPromotingPiece(pieceString) {
    $('#promotionModal').modal('hide')
    piece = pieceString;
    window.isPromoting = false;
}