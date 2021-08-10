import {Game} from "../scripts/js-chess-engine.mjs";

console.log("Hello Ale, Ali and Luca!")

const whiteAiLevel = 2
const blackAiLevel = 3

const game = new Game();
console.log(game.exportJson());

// start the game - create pieces
for (const [key, value] of Object.entries(game.board.configuration.pieces)) {
    let color = (value === value.toUpperCase()) ? 'w' : 'b';
    await createGamePiece(value, key, color);
}

await play()

async function play () {
    await sleep(2000);
    const status = game.exportJson();
    if (status.isFinished) {
        console.log(`${status.turn} is in ${status.checkMate ? 'checkmate' : 'draw'}`);
    } else {
        console.time('Calculated in');
        const move = game.aiMove(status.turn === 'black' ? blackAiLevel : whiteAiLevel);
        console.log(`${status.turn.toUpperCase()} move ${JSON.stringify(move)}`);
        // white castle queen side
        if(Object.keys(move)[0] === 'E1' && (Object.values(move)[0] === 'C1')) {
            let rook = getPieceAt('A1');
            rook.placeOnSquare('D1');
        }
        // white castle king side
        if(Object.keys(move)[0] === 'E1' && (Object.values(move)[0] === 'G1')) {
            let rook = getPieceAt('H1');
            rook.placeOnSquare('F1');
        }
        // black castle king side
        if(Object.keys(move)[0] === 'E8' && (Object.values(move)[0] === 'C8')) {
            let rook = getPieceAt('A8');
            rook.placeOnSquare('D8');
        }
        // black castle queen side
        if(Object.keys(move)[0] === 'E8' && (Object.values(move)[0] === 'G8')) {
            let rook = getPieceAt('H8');
            rook.placeOnSquare('F8');
        }

        let piece = getPieceAt(Object.keys(move)[0]);
        piece.placeOnSquare(Object.values(move)[0]);
        console.timeEnd('Calculated in');
        await play();
    }
}
