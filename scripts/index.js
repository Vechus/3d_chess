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
    await sleep(3000);
    const status = game.exportJson();
    if (!status.isFinished) {
        console.time('Calculated in');
        const move = game.aiMove(status.turn === 'black' ? blackAiLevel : whiteAiLevel);
        console.log(`${status.turn.toUpperCase()} move ${JSON.stringify(move)}`);
        let moveFrom = Object.keys(move)[0];
        let moveTo =  Object.values(move)[0];
        let object = getPieceAt(moveTo);
        let piece = getPieceAt(moveFrom);
        await startAnimation(piece, getPositionFromSquare(moveFrom), getPositionFromSquare(moveTo));
        window.isAnimating = true;
        while(window.isAnimating) {
            await sleep(200);
        }
        //check for taking
        if (typeof object !== "undefined") {
            //variables for the animation of the taken piece
            let takenMoveFrom = moveTo;
            let takenMoveTo;
            object.setSquare("A0");
            if (status.turn === 'white') {
                takenMoveTo = [7 + (outBlack / 4) * 2 + Math.random(), yPos, 5 - (outBlack % 4) * 2 - Math.random()];
                outBlack++;
            } else {
                takenMoveTo = [ -7 - (outWhite / 4) * 2 - Math.random(), yPos, -5 + (outWhite % 4) * 2 + Math.random()];
                outWhite++;
            }
            await startAnimation(object, getPositionFromSquare(takenMoveFrom), takenMoveTo);
            window.isAnimating = true;
            while(window.isAnimating) {
                await sleep(1000);
            }
        }
        piece.placeOnSquare(moveTo);
        // check castling
        let rookSquare;
        let rook;
        if (piece.getPiece() === 'K' || piece.getPiece() === 'k') {
            // white castle queen side
            if (moveFrom === 'E1' && (moveTo === 'C1')) {
                rook = getPieceAt('A1');
                rookSquare = 'D1';
            }
            // white castle king side
            if (moveFrom === 'E1' && (moveTo === 'G1')) {
                rook = getPieceAt('H1');
                rookSquare = 'F1';
            }
            // black castle king side
            if (moveFrom === 'E8' && (moveTo === 'C8')) {
                rook = getPieceAt('A8');
                rookSquare = 'D8';
            }
            // black castle queen side
            if (moveFrom === 'E8' && (moveTo === 'G8')) {
                rook = getPieceAt('H8');
                rookSquare = 'F8';
            }
            await startAnimation(rook, rook.getPosition(), getPositionFromSquare(rookSquare));
            window.isAnimating = true;
            while(window.isAnimating) {
                await sleep(1000);
            }
            rook.placeOnSquare(rookSquare);
        }

        console.timeEnd('Calculated in');
        await play();
    } else {
        console.log(`${status.turn} is in ${status.checkMate ? 'checkmate' : 'draw'}`);
    }
}
