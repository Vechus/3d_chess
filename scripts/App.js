/*
    3D MODELS AND OBJ UTILS
 */

var glProgram = 0;
var gl = 0;
var Scene = [];
var timer;

//for the animation
var pieceToMove;
var moveFrom;
var moveTo;
var stepX;
var stepZ;
const frames = 10;

let VIEW

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createGamePiece(pieceName, coordinate, color) {
    // wait for gl to load
    while (gl === 0 || glProgram === 0) {
        await sleep(200);
    }

    let piece = createPiece(gl, glProgram, await loadAndInitMesh(getModelPathFromPiece(pieceName)), coordinate, color, pieceName);
    Scene.push(piece);
}

document.getElementById("view_btn").onclick = function () {
    VIEW = pickNextView()
}

function getPieceAt(square) {
    let obj = undefined;
    Scene.forEach((x) => {
        //console.log(x.getSquare(), square);
        if (x.getSquare() === square) obj = x;
    });
    return obj;
}

async function loadAndInitMesh(resourceURI) {
    let objString = await utils.get_objstr(resourceURI);
    return new OBJ.Mesh(objString);
}

function getPositionFromSquare(square) {
    let tempArray1 = square.split("");
    let col = tempArray1[0];
    let row = tempArray1[1];
    return [coorColumnsMap.get(col), yPos, coorRowsMap.get(row)];
}

async function startAnimation(piece, from, to) {
    console.log("start")
    pieceToMove = piece;
    moveFrom = getPositionFromSquare(from); //get coordinates
    moveTo = getPositionFromSquare(to);
    timer = 0;
    stepX = (moveTo[0] - moveFrom[0]) / frames;
    stepZ = (moveTo[2] - moveFrom[2]) / frames;
    timer++;
}


function animation() {
    if (timer <= frames) {
        let z = pieceToMove.getPosition()[2];
        pieceToMove.setPosition(moveFrom[0] + stepX * timer, yPos, moveFrom[2] + stepZ * timer);
        timer++;
    } else {
        window.isAnimating = false; //animation terminated
        pieceToMove = undefined;
        moveFrom = undefined;
        moveTo = undefined;
    }
}

function initVAO(gl, program, mesh) {
    let VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);

    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    let normalAttributeLocation = gl.getAttribLocation(program, "a_normal");
    let uvAttributeLocation = gl.getAttribLocation(program, "a_uv");

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexNormals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalAttributeLocation);
    gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textures), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

    return VAO
}

async function main() {
    // Get A WebGL context
    const canvas = document.getElementById('game-canvas');
    gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    //SHADERS (PHONG) ====================================================================================================================================
    const shaderDir = "../shaders/"
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs_phong.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        glProgram = utils.createProgram(gl, vertexShader, fragmentShader);
    });

    //FETCH ASSETS
    //* ==========================================================================================================================================

    let boardGameObject = new GameObject(gl, glProgram, await loadAndInitMesh('../assets/models/newboard/NewBoardResized.obj'));
    boardGameObject.setPosition(0, 0, 0);
    boardGameObject.setName("board")
    boardGameObject.setTexture(new Texture(gl, "../assets/models/newboard/Textures/Chess_Board.jpg"))
    boardGameObject.setYaw(45);


    Scene.push(boardGameObject);
    //tempArray.forEach(element => Scene.push(element));
    //Scene.push(boardGameObject, bishopGameObject, kingGameObject, knightGameObject, queenGameObject, rookGameObject);

    VIEW = pickNextView()


    //==========================================================================================================================================
    //==========================================================================================================================================

    //GL STUFF
    //* ==========================================================================================================================================

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.86, 0.86, 0.86, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);


    //==========================================================================================================================================
    //* ==========================================================================================================================================

    function render(time) {
        time *= 0.001;  // convert to seconds

        //const INPUT_SCALE = 1;

        //let cam_x_pos = document.getElementById("cxpos").value / INPUT_SCALE;
        //let cam_y_pos = document.getElementById("cypos").value / INPUT_SCALE;
        //let cam_z_pos = document.getElementById("czpos").value / INPUT_SCALE;

        let cam_x_pos = views.get(VIEW)[0]
        let cam_y_pos = views.get(VIEW)[1]
        let cam_z_pos = views.get(VIEW)[2]

        let lx = document.getElementById("lx").value;
        let ly = document.getElementById("ly").value;
        let lz = document.getElementById("lz").value;

        let infoText = "Camera Position: " + cam_x_pos + " " + cam_y_pos + " " + cam_z_pos +
            "" +
            "" +
            "" +
            ""
        document.getElementById("info-box").innerText = infoText;
        document.getElementById("view_btn").innerText = VIEW

        //INIT CAMERA STUFF * ==========================================================================================================================================
        //* ==========================================================================================================================================

        gl.clearColor(0.0, 0.86, 0.0, 1); //clear the buffers with this color a.k.a. green screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let aspect = gl.canvas.width / gl.canvas.height;

        let cameraPosition = [cam_x_pos, cam_y_pos, cam_z_pos];
        let target = [0.0, 0.0, 0.0];
        let up = [0.0, 1.0, 0.0];
        let cameraMatrix = utils.LookAt(cameraPosition, target, up);
        let viewMatrix = utils.invertMatrix(cameraMatrix);
        let projectionMatrix = utils.MakePerspective(60.0, aspect, 0.01, 20000.0);


        //* ==========================================================================================================================================
        //* ==========================================================================================================================================


        //animation
        if (window.isAnimating) animation();
        console.log("animating " + window.isAnimating);


        /**
         * FOR EACH VAO / 3D MODEL IN THE SCENE
         * ==========================================================================================================================================
         */

            //LIGHT=====================================================================================================================
        let lDirectionVector = [lx, ly, lz]
        let u_lightDirection = (lDirectionVector); //no need to normalize, vector components swing between -1 and 1

        Scene.forEach((sceneObject) => {

            gl.useProgram(sceneObject.glProgramInfo);
            gl.bindVertexArray(sceneObject.VAO);

            //OLD CODE
            // sceneObject.render(gl, projectionMatrix, viewMatrix, u_lightDirection);
            //
            //->introducing phong
            //renderPhong(gl, projectionMatrix, viewMatrix, phongShader, eyeDirectionV3, lightDirectionV3, lightColorV4, ambientLightV4)

            let objPhongShader = new PhongShader(16.0, [0.5, .5, .5, 1.0], [0.5, 0.3, 1.0, 1.0], [0.0, 0.0, 0.0, 1.0])
            sceneObject.renderPhong(gl, projectionMatrix, viewMatrix, objPhongShader, cameraPosition, u_lightDirection, [0.8, .8, .8, 1], [0.1, 0.1, 0.1, 1.0])

        })
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();