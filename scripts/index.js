import {Game} from "./js-chess-engine.mjs";


console.log("Hello Ale, Ali and Luca!")

let whiteAiLevel = 0;
let blackAiLevel = 0;

let game = new Game();

var outWhite = 0;
var outBlack = 0;
let isBeingReset = false;

// describes the control state at the start of the game
let gameControl = {
    gameType: 0,
    gameIALevel: 1,
    gamePlayAs: 0
}

document.getElementById("startGameButton").onclick = async function () {
    // app.js gets killed if restarting the game during animation
    window.isAnimating = false;
    isBeingReset = true;

    //deletes all model except the board
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
        whiteAiLevel = 1;
        blackAiLevel = 1;
    } else if(document.getElementById("optionIA2").checked) {
        gameControl.gameIALevel = 2;
        whiteAiLevel = 2;
        blackAiLevel = 2;
    } else if(document.getElementById("optionIA3").checked) {
        gameControl.gameIALevel = 3;
        whiteAiLevel = 3;
        blackAiLevel = 3;
    } else if(document.getElementById("optionIA4").checked) {
        gameControl.gameIALevel = 4;
        whiteAiLevel = 4;
        blackAiLevel = 4;
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

    // start the game - create pieces - takes time
    for (const [key, value] of Object.entries(game.board.configuration.pieces)) {
        let color = (value === value.toUpperCase()) ? 'w' : 'b';
        await createGamePiece(value, key, color);
    }
    isBeingReset = false;
    await play();
}


async function play () {
    if(isBeingReset) return;
    const status = game.exportJson();
    if (!status.isFinished) {
        console.time('Calculated in');
        const move = await waitForMove(status);
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
                await sleep(200);
            }
        }
        piece.placeOnSquare(moveTo);
        // check castling
        let rookSquare;
        let rook;
        let castling = false;
        if (piece.getPiece() === 'K' || piece.getPiece() === 'k') {
            // white castle queen side
            if (moveFrom === 'E1' && (moveTo === 'C1')) {
                rook = getPieceAt('A1');
                rookSquare = 'D1';
                castling = true;
            }
            // white castle king side
            else if (moveFrom === 'E1' && (moveTo === 'G1')) {
                rook = getPieceAt('H1');
                rookSquare = 'F1';
                castling = true;
            }
            // black castle king side
            else if (moveFrom === 'E8' && (moveTo === 'C8')) {
                rook = getPieceAt('A8');
                rookSquare = 'D8';
                castling = true;
            }
            // black castle queen side
            else if (moveFrom === 'E8' && (moveTo === 'G8')) {
                rook = getPieceAt('H8');
                rookSquare = 'F8';
                castling = true;
            }
            if(castling) {
                await startAnimation(rook, rook.getPosition(), getPositionFromSquare(rookSquare));
                window.isAnimating = true;
                while(window.isAnimating) {
                    await sleep(200);
                }
                rook.placeOnSquare(rookSquare);
            }
        }

        console.timeEnd('Calculated in');
        await play();
    } else {
        console.log(`${status.turn} is in ${status.checkMate ? 'checkmate' : 'draw'}`);
    }
}


async function waitForMove(status) {
    // reset selected square
    selectedSquare = undefined;
    // if it is a IA vs IA game or Human vs IA but it's the IA turn...
    console.log("waitForMove: ", gameControl.gameType, status.turn, gameControl.gamePlayAs);

    if(gameControl.gameType === 0 ||
        (gameControl.gameType === 1 && status.turn === 'black' && gameControl.gamePlayAs === 0) ||
        (gameControl.gameType === 1 && status.turn === 'white' && gameControl.gamePlayAs === 1)) {
        console.log("aiMove");
        return game.aiMove(status.turn === 'black' ? blackAiLevel : whiteAiLevel);
    } else {
        // it is a human turn!
        let oldSelected = selectedSquare;
        let fromSquare, toSquare;
        let validSel = false;
        while(!validSel) {
            console.log(status.moves)
            // first get selected piece - must be of the right color and it has to have the possibility to move
            while (selectedSquare === oldSelected || status.moves[selectedSquare] === undefined) {
                oldSelected = selectedSquare;
                await sleep(200);
            }
            oldSelected = selectedSquare;
            fromSquare = selectedSquare;
            let availableMoves = status.moves[fromSquare];
            console.log(availableMoves);

            while (selectedSquare === oldSelected) {
                oldSelected = selectedSquare;
                await sleep(200);
            }
            if(availableMoves.includes(selectedSquare)) {
                toSquare = selectedSquare;
                validSel = true;
            }
        }

        return game.move(fromSquare, toSquare);
    }
}
