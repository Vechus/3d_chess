import {Game} from "./js-chess-engine.mjs";

async function sleepGame(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log("Hello Ale, Ali and Luca!")

const whiteAiLevel = 0;
const blackAiLevel = 0;

let game = new Game();

var outWhite = 0;
var outBlack = 0;

// describes the control state at the start of the game
let gameControl = {
    gameType: 0,
    gameIALevel: 1,
    gamePlayAs: 0
}

document.getElementById("startGameButton").onclick = async function () {
    // TODO slice to 1 when unmounting raycast test
    Scene = Scene.slice(0, 2);
    game = new Game();
    if(document.getElementById("optionIAvIA").checked) {
        gameControl.gameType = 0;
    } else if(document.getElementById("optionHvIA").checked) {
        gameControl.gameType = 1;
    } else if(document.getElementById("optionHvH").checked) {
        gameControl.gameType = 2;
    }
    if(document.getElementById("optionIA0").checked) {
        gameControl.gameIALevel = 0;
    } else if(document.getElementById("optionIA1").checked) {
        gameControl.gameIALevel = 1;
    } else if(document.getElementById("optionIA2").checked) {
        gameControl.gameIALevel = 2;
    } else if(document.getElementById("optionIA3").checked) {
        gameControl.gameIALevel = 3;
    } else if(document.getElementById("optionIA4").checked) {
        gameControl.gameIALevel = 4;
    }
    if(document.getElementById("optionWhite").checked) {
        gameControl.gamePlayAs = 0;
    } else if(document.getElementById("optionRandom").checked) {
        gameControl.gamePlayAs = 2;
    } else if(document.getElementById("optionBlack").checked) {
        gameControl.gamePlayAs = 1;
    }
    console.log(gameControl);

    await startGame();
}

async function startGame() {
    if(gameControl.gameType === 1) {
        if(gameControl.gamePlayAs === 0) VIEW = pickView(1);
        if(gameControl.gamePlayAs === 2) {
            // random between 0 and 1
            gameControl.gamePlayAs = Math.floor(Math.random() * 2);
        }
        // pick the right view for the human
        VIEW = pickView(gameControl.gamePlayAs + 1);
    } else {
        // pick the white view
        VIEW = pickView(1);
    }

    // start the game - create pieces
    for (const [key, value] of Object.entries(game.board.configuration.pieces)) {
        let color = (value === value.toUpperCase()) ? 'w' : 'b';
        await createGamePiece(value, key, color);
    }
    await play();
}


async function play () {
    await sleep(3000);
    const status = game.exportJson();
    if (!status.isFinished) {
        console.time('Calculated in');
        const move = await waitForMove(status);
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


async function waitForMove(status) {
    let move = {};
    // if it is a IA vs IA game or Human vs IA but it's the IA turn...
    if(gameControl.gameType === 0 ||
        (gameControl.gameType === 1 && status.turn === 'black' && gameControl.gamePlayAs === 1) ||
        (gameControl.gameType === 1 && status.turn === 'white' && gameControl.gamePlayAs === 0)) {
        return game.aiMove(status.turn === 'black' ? blackAiLevel : whiteAiLevel);
    } else {
        // it is a human turn!
        let oldSelected = selectedSquare;
        let fromSquare, toSquare;
        let validSel = false;
        while(!validSel) {
            // first get selected piece - must be of the right color
            while (selectedSquare === oldSelected || !(status.moves.includes(selectedSquare))) {
                await sleep(200);
                oldSelected = selectedSquare;
            }
            fromSquare = selectedSquare;
            let availableMoves = status.moves[fromSquare];
            console.log(availableMoves);

            while (selectedSquare === oldSelected) {
                await sleep(200);
                oldSelected = selectedSquare;
            }
            if(availableMoves.includes(selectedSquare)) {
                toSquare = selectedSquare;
                move[fromSquare] = toSquare;
                validSel = true;
            }
        }

        return move;
    }
}
