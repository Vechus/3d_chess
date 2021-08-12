import {Game} from "./js-chess-engine.mjs";

async function sleepGame(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log("Hello Ale, Ali and Luca!")

const whiteAiLevel = 0;
const blackAiLevel = 0;

const game = new Game();
console.log(game.exportJson());

var outWhite = 0;
var outBlack = 0;


// start the game - create pieces
for (const [key, value] of Object.entries(game.board.configuration.pieces)) {
    let color = (value === value.toUpperCase()) ? 'w' : 'b';
    await createGamePiece(value, key, color);
}

await play()

async function play () {
    await sleepGame(2000);
    const status = game.exportJson();
    if (!status.isFinished) {
        console.time('Calculated in');
        const move = game.aiMove(status.turn === 'black' ? blackAiLevel : whiteAiLevel);
        console.log(`${status.turn.toUpperCase()} move ${JSON.stringify(move)}`);
        //check for taking
        let moveTo = Object.values(move)[0];
        let moveFrom = Object.keys(move)[0];
        let object = getPieceAt(moveTo);
        if (typeof object !== "undefined") {
            object.placeOnSquare("A0");
            if (status.turn === 'white') {
                object.setPosition(7 + (outBlack / 4) * 2 + Math.random(), yPos, 5 - (outBlack % 4) * 2 - Math.random());
                outBlack++;
            } else {
                object.setPosition(-7 - (outWhite / 4) * 2 - Math.random(), yPos, -5 + (outWhite % 4) * 2 + Math.random());
                outWhite++;
            }

        }
        let piece = getPieceAt(moveFrom);
        await startAnimation(piece, moveFrom, moveTo);
        window.isAnimating = true;
        while(window.isAnimating) {
            await sleep(1000);
        }

        piece.placeOnSquare(moveTo);
        // check castling
        if (piece.getPiece() === 'K' || piece.getPiece() === 'k') {
            // white castle queen side
            if (moveFrom === 'E1' && (moveTo === 'C1')) {
                let rook = getPieceAt('A1');
                rook.placeOnSquare('D1');
            }
            // white castle king side
            if (moveFrom === 'E1' && (moveTo === 'G1')) {
                let rook = getPieceAt('H1');
                rook.placeOnSquare('F1');
            }
            // black castle king side
            if (moveFrom === 'E8' && (moveTo === 'C8')) {
                let rook = getPieceAt('A8');
                rook.placeOnSquare('D8');
            }
            // black castle queen side
            if (moveFrom === 'E8' && (moveTo === 'G8')) {
                let rook = getPieceAt('H8');
                rook.placeOnSquare('F8');
            }
        }

        console.timeEnd('Calculated in');
        await play();
    } else {
        console.log(`${status.turn} is in ${status.checkMate ? 'checkmate' : 'draw'}`);
    }
}
