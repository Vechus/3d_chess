import {Game} from "./js-chess-engine.mjs";
import {downByColor} from "./const/board.mjs";

//Controls the gameplay

console.log("Hello Ale, Ali and Luca!")
let whiteAiLevel = 0;
let blackAiLevel = 0;

let game = new Game();

var outWhite = 0;
var outBlack = 0;
let isBeingReset = false;

var enPassant;

// describes the control state at the start of the game
let gameControl = {
    gameType: 0,
    gameIALevel: 1,
    gamePlayAs: 0
}

document.getElementById("startGameButton").onclick = async function () {
    // app.js gets killed if restarting the game during animation
    window.isAnimating = false;
    outWhite = 0;
    outBlack = 0;
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

    await startGame(); //settings and then start game
}

async function startGame() {
    if(gameControl.gameType === 1) {
        if(gameControl.gamePlayAs === 2) {
            // random between 0 and 1
            gameControl.gamePlayAs = Math.floor(Math.random() * 2);
        }
        // pick the right view for the human
        VIEW = pickView(gameControl.gamePlayAs);
        camera_angles = views.get(VIEW);
    } else if(gameControl.gameType === 2){
        // pick the white view
        VIEW = pickView(0);
        camera_angles = views.get(VIEW);
    }

    // start the game - create pieces - takes time
    for (const [key, value] of Object.entries(game.board.configuration.pieces)) {
        let color = (value === value.toUpperCase()) ? 'w' : 'b';
        await createGamePiece(value, key, color);
    }
    isBeingReset = false;
    await play();
}

//turn controller
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
        //move the piece
        await startAnimation(piece, getPositionFromSquare(moveFrom), getPositionFromSquare(moveTo));
        window.isAnimating = true;
        while(window.isAnimating) {
            await sleep(200);
        }
        //check for en passant
        if(piece.getPiece() === 'P' || piece.getPiece() === 'p') {
            if(moveTo === enPassant) {
                let col = moveTo.split('')[0];
                let row;
                if(status.turn === 'white') {
                    row = (moveTo.split('')[1]) - 1;
                } else {
                    row = parseInt(moveTo.split('')[1]) + 1;
                }
                let square = col.concat(row);
                object = getPieceAt(square);
            }
        }
        enPassant = game.board.configuration.enPassant; //save en passant square for the next move
        //check for taking
        if (typeof object !== "undefined") {
            //variables for the animation of the taken piece
            let takenMoveFrom = object.getSquare();
            let takenMoveTo;
            object.setSquare("A0");
            if (status.turn === 'white') {
                takenMoveTo = [7 + (outBlack / 4) * 2 + Math.random(), yPos, 5 - (outBlack % 4) * 2 - Math.random()];
                outBlack++;
            } else {
                takenMoveTo = [ -7 - (outWhite / 4) * 2 - Math.random(), yPos, -5 + (outWhite % 4) * 2 + Math.random()];
                outWhite++;
            }
            //move the taken piece
            await startAnimation(object, getPositionFromSquare(takenMoveFrom), takenMoveTo);
            window.isAnimating = true;
            while(window.isAnimating) {
                await sleep(200);
            }
        }
        piece.placeOnSquare(moveTo);
        //check for promotion
        if((piece.getPiece() === 'P' || piece.getPiece() === 'p') &&
            (moveTo.split('')[1] === '1' || moveTo.split('')[1] === '8')) {
            if(gameControl.gameType === 0 ||
                (gameControl.gameType === 1 && status.turn === 'black' && gameControl.gamePlayAs === 0) ||
                (gameControl.gameType === 1 && status.turn === 'white' && gameControl.gamePlayAs === 1)) {
                //hey, it is an AI move! This guy always promotes to queen LOL
                for(let i = 0; i < Scene.length; i++) {
                    if(Scene[i] === piece) {
                        Scene.splice(i, 1); //remove the pawn
                    }
                }
                let promotedObject;
                if(status.turn === 'white')
                    promotedObject = createPiece(gl, glProgram, await loadAndInitMesh(getModelPathFromPiece('Q')), moveTo, 'w', 'Q', CURRENT_KIT);
                else
                    promotedObject = createPiece(gl, glProgram, await loadAndInitMesh(getModelPathFromPiece('q')), moveTo, 'b', 'q', CURRENT_KIT);
                Scene.push(promotedObject);
            }
            else {
                //this is a human move
                //display the modal for the promotion
                window.isPromoting = true;
                await $('#promotionModal').modal('show');
                for(let i = 0; i < Scene.length; i++) {
                    if(Scene[i] === piece) {
                        Scene.splice(i, 1); //remove the pawn
                    }
                }
                while(window.isPromoting) { //wait for user choice
                    await sleep(200);
                }
                window.isPromoting = true;
                await promote(moveTo, status.turn);  //wait for the piece to be added in Scene
                while(window.isPromoting) {
                    await sleep(200);
                }
            }
        }
            // check castling
        if (piece.getPiece() === 'K' || piece.getPiece() === 'k') {
            let rookSquare;
            let rook;
            let castling = false;
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
                //move the rook
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
        alert("Checkmate! " + status.turn + " loses.");
        console.log(`${status.turn} is in ${status.checkMate ? 'checkmate' : 'draw'}`);
    }
}

//Waits for a move (AI, Human player)

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
            //console.log(status.moves)
            // first get selected piece - must be of the right color and it has to have the possibility to move
            while (selectedSquare === oldSelected || status.moves[selectedSquare] === undefined) {
                oldSelected = selectedSquare;
                await sleep(200);
            }
            oldSelected = selectedSquare;
            fromSquare = selectedSquare;
            let availableMoves = status.moves[fromSquare];
            //console.log(availableMoves);

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
