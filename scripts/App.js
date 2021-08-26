/*
    3D MODELS AND OBJ UTILS
 */

let CURRENT_KIT, NEXT_KIT;


var glProgram = 0;
var gl = 0;
var Scene = [];
var timer;
var skyboxProgram;

var currentSkybox = 'beach';

//for the animation
var pieceToMove;
var moveFrom;
var moveTo;
var stepX;
var stepZ;
const frames = 10;

let VIEW;

var clipX = 0, clipY = 0;
var ray_nds = [0, 0, 0];
var boardBounds = {x: [-6, 6], z: [-6, 6]};

// camera diff vector: updated at event keydown/up and read at each frame
var camera_diff = { x: 0, y: 0};
// camera angles
var camera_angles = { phi: 0, omega: 30 };

var camera_depth = 1;

var selectedSquare = undefined;

/* CLIENT EVENTS */
document.getElementById("view_btn").onclick = function () {
    VIEW = pickNextView();
    camera_angles = views.get(VIEW);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createGamePiece(pieceName, coordinate, color) {
    // wait for gl to load
    while (gl === 0 || glProgram === 0) {
        await sleep(200);
    }

    let piece = createPiece(gl, glProgram, await loadAndInitMesh(getModelPathFromPiece(pieceName)), coordinate, color, pieceName, CURRENT_KIT);
    Scene.push(piece);
}

function getClosestSquare(planeCoordinate) {
    // if the click is out of bounds return undefined
    if(planeCoordinate[0] < boardBounds.x[0] || planeCoordinate[0] > boardBounds.x[1] ||
    planeCoordinate[2] < boardBounds.z[0] || planeCoordinate[2] > boardBounds.z[1]) {
        return undefined;
    }
    let closestX = coorColumnsMap.get('A'), closestY = coorRowsMap.get('1');
    for (let item of coorColumnsMap.values()) {
        if(Math.abs(item - planeCoordinate[0]) < Math.abs(closestX - planeCoordinate[0])) {
            closestX = item;
        }
    }
    for (let item of coorRowsMap.values()) {
        if(Math.abs(item - planeCoordinate[2]) < Math.abs(closestY - planeCoordinate[2])) {
            closestY = item;
        }
    }
    let closestSquare = '';
    coorColumnsMap.forEach(function (value, key) {
        if(value === closestX) closestSquare += key;
    });
    coorRowsMap.forEach(function (value, key) {
        if(value === closestY) closestSquare += key;
    });

    return closestSquare;
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
    console.log(piece);

    pieceToMove = piece;
    moveFrom = from;
    moveTo = to;
    timer = 0;
    stepX = (moveTo[0] - moveFrom[0]) / frames;
    stepZ = (moveTo[2] - moveFrom[2]) / frames;
    timer++;
}


function animation() {
    if (timer <= frames) {
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

// MAIN ============================================
//==================================================
async function main() {
    // Get A WebGL context
    const canvas = document.getElementById('game-canvas');
    gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    const nearPlane = 0.01;
    const farPlane = 20000;

    //SHADERS (PHONG) ====================================================================================================================================
    const shaderDir = "../shaders/"
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs_phong.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        glProgram = utils.createProgram(gl, vertexShader, fragmentShader);
    });

    //SHADERS (SKYBOX) ====================================================================================================================================
    await utils.loadFiles([shaderDir + 'skybox-vs.glsl', shaderDir + 'skybox-fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);

        skyboxProgram = utils.createProgram(gl, vertexShader, fragmentShader);
    });

    let skyboxVertPos;
    let skyboxTexture;
    let skyboxVao;
    let skyboxVertPosAttr;
    let skyboxTexHandle;
    let inverseViewProjMatrixHandle;
    function loadSkyBox() {
        skyboxVertPos = new Float32Array(
            [
                -1, -1, 1.0,
                1, -1, 1.0,
                -1,  1, 1.0,
                -1,  1, 1.0,
                1, -1, 1.0,
                1,  1, 1.0,
            ]);

        skyboxVao = gl.createVertexArray();
        gl.bindVertexArray(skyboxVao);

        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, skyboxVertPos, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(skyboxVertPosAttr);
        gl.vertexAttribPointer(skyboxVertPosAttr, 3, gl.FLOAT, false, 0, 0);

        skyboxTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0+3);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);

        let envTexDir = "../assets/skybox/" + currentSkybox + '/';

        const faceInfos = [
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                url: envTexDir+'posx.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                url: envTexDir+'negx.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                url: envTexDir+'posy.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                url: envTexDir+'negy.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                url: envTexDir+'posz.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                url: envTexDir+'negz.jpg',
            },
        ];
        faceInfos.forEach((faceInfo) => {
            const {target, url} = faceInfo;

            // Upload the canvas to the cubemap face.
            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 512;
            const height = 512;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;

            // setup each face so it's immediately renderable
            gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

            // Asynchronously load an image
            const image = new Image();
            image.src = url;
            image.addEventListener('load', function() {
                // Now that the image has loaded upload it to the texture.
                gl.activeTexture(gl.TEXTURE0+3);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
                gl.texImage2D(target, level, internalFormat, format, type, image);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            });


        });
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }

    function getSkyboxAttributesAndUniforms() {
        skyboxTexHandle = gl.getUniformLocation(skyboxProgram, "u_texture");
        inverseViewProjMatrixHandle = gl.getUniformLocation(skyboxProgram, "inverseViewProjMatrix");
        skyboxVertPosAttr = gl.getAttribLocation(skyboxProgram, "in_position");
    }

    // KITS ===============================================================================================================================================

    /* < DEFINITION > */
    let plasticPhong = new PhongShader(6.0, [0.5, .5, .5, 1.0],
        [0.5, 0.5, 0.5, 1.0], [0.0, 0.0, 0.0, 1.0]);

    let woodPhong = new PhongShader(1.0, [0.5, .5, .5, 1.0],
        [0.1, 0.1, 0.1, 1.0], [0.0, 0.0, 0.0, 1.0]);

    let silverPhong = new PhongShader(1.0, [0.3, .3, .3, 1.0],
        [0.26, .27, .29, 1.0], [0.0, 0.0, 0.0, 1.0]);

    let marblePhong = new PhongShader(1.0, [0.5, .5, .5, 1.0],
        [0.1, 0.1, 0.1, 1.0], [0.0, 0.0, 0.0, 1.0]);

    let glassPhong = new PhongShader(1.0, [0.3, .3, .3, 1.0],
        [0.26, .27, .29, 1.0], [0.0, 0.0, 0.0, 1.0]);

    /* GAME KITS */
    let GameKits = {};

    /* PLASTIC */
    let PLASTIC_KIT = new GameKit(KITS.PLASTIC, "../assets/models/newboard/Textures/512-chess-bw-diffuse.jpeg",
        "../assets/models/newboard/Textures/512-chess-bw-nmap.jpeg", plasticPhong,
        [1.0, 1.0, 1.0, 1.0], [0.1, 0.1001, 0.1, 1.0]);
    PLASTIC_KIT.frameTextureURI = "../assets/models/newboard/Textures/computer-plastic.jpeg";
    PLASTIC_KIT.frameNormalMapURI = "../assets/models/newboard/Textures/computer-plastic-normal.jpeg";
    GameKits[KITS.PLASTIC] = PLASTIC_KIT;

    /* WOOD */
    let WOOD_KIT = new GameKit(KITS.WOOD, "../assets/models/newboard/Textures/512-chess-bw-diffuse.jpeg",
        "../assets/models/newboard/Textures/512-chess-bw-nmap.jpeg", woodPhong,
        [1.0, 1.0, 1.0, 1.0], [0.1, 0.1001, 0.1, 1.0]);
    WOOD_KIT.frameTextureURI = "../assets/models/newboard/Textures/WoodPieces.jpeg";
    WOOD_KIT.frameNormalMapURI = "../assets/models/newboard/Textures/WoodPiecesNormalMap.png";
    WOOD_KIT.whiteTextureURI = "../assets/models/newboard/Textures/WoodPieces.jpeg";
    WOOD_KIT.blackTextureURI = "../assets/models/newboard/Textures/WoodPieces.jpeg";
    WOOD_KIT.piecesNormalMapURI = "../assets/models/newboard/Textures/WoodPiecesNormalMap.png";
    GameKits[KITS.WOOD] = WOOD_KIT;

    /* METAL */
    let METAL_KIT = new GameKit(KITS.METAL, "../assets/models/newboard/Textures/512-chess-bw-diffuse.jpeg",
        "../assets/models/newboard/Textures/512-chess-bw-nmap.jpeg", silverPhong,
        [1.0, 1.0, 1.0, 1.0], [0.1, 0.1001, 0.1, 1.0]);
    METAL_KIT.frameTextureURI = "../assets/models/newboard/Textures/metal.jpg";
    METAL_KIT.frameNormalMapURI = "../assets/models/newboard/Textures/metalNormalMap.png";
    METAL_KIT.whiteTextureURI = "../assets/models/newboard/Textures/metal.jpg";
    METAL_KIT.blackTextureURI = "../assets/models/newboard/Textures/metal.jpg";
    METAL_KIT.piecesNormalMapURI = "../assets/models/newboard/Textures/metalNormalMap.png";
    GameKits[KITS.METAL] = METAL_KIT;

    /* MARBLE */
    let MARBLE_KIT = new GameKit(KITS.MARBLE, "../assets/models/newboard/Textures/512-chess-bw-diffuse.jpeg",
        "../assets/models/newboard/Textures/512-chess-bw-nmap.jpeg", marblePhong,
        [1.0, 1.0, 1.0, 1.0], [0.1, 0.1001, 0.1, 1.0]);
    MARBLE_KIT.frameTextureURI = "../assets/models/newboard/Textures/marble.jpg";
    MARBLE_KIT.frameNormalMapURI = "../assets/models/newboard/Textures/marbleNormalMap.jfif";
    MARBLE_KIT.whiteTextureURI = "../assets/models/newboard/Textures/marblePieces.jpg";
    MARBLE_KIT.blackTextureURI = "../assets/models/newboard/Textures/marbleGlass.png";
    MARBLE_KIT.piecesNormalMapURI = "../assets/models/newboard/Textures/marbleNormalMap.jfif";
    GameKits[KITS.MARBLE] = MARBLE_KIT;

    /* MARBLE */
    let GLASS_KIT = new GameKit(KITS.GLASS, "../assets/models/newboard/Textures/512-chess-bw-diffuse.jpeg",
        "../assets/models/newboard/Textures/512-chess-bw-nmap.jpeg", glassPhong,
        [1.0, 1.0, 1.0, 1.0], [0.1, 0.1001, 0.1, 1.0]);
    GLASS_KIT.frameTextureURI = "../assets/models/newboard/Textures/glassPieces.jpg";
    GLASS_KIT.frameNormalMapURI = "../assets/models/newboard/Textures/glassNormalMap.jpg";
    GLASS_KIT.whiteTextureURI = "../assets/models/newboard/Textures/glassPieces.jpg";
    GLASS_KIT.blackTextureURI = "../assets/models/newboard/Textures/glassBlack.jpg";
    GLASS_KIT.piecesNormalMapURI = "../assets/models/newboard/Textures/glassNormalMap.jpg";
    GameKits[KITS.GLASS] = GLASS_KIT;

    /* < ASSIGNMENT > */
    for (const [key, value] of Object.entries(KITS)) {
        const header = document.createElement('a');
        header.className = "dropdown-item";
        header.textContent = value;
        header.addEventListener("click", async function(){
            CURRENT_KIT = GameKits[Object.keys(KITS).find(key => KITS[key] === header.textContent)];
            await spawnBoards();
            for(let i = 2; i < Scene.length; i++) {
                let obj = Scene[i];
                updatePieceKit(obj, CURRENT_KIT);
            }
            document.getElementById("dropdownMenuButton").innerText = header.textContent;
        });
        document.getElementById("dropdownElements").append(header);
    }


    CURRENT_KIT = PLASTIC_KIT;

    //=============================================================================================================================================


    //FETCH ASSETS
    //* ==========================================================================================================================================

    loadSkyBox();

    const boardPlane = {
        p0: [0, 0.7, 0],
        p1: [1, 0.7, 1],
        p2: [1, 0.7, -1]
    };

    async function spawnBoards() {
        //Squared board top (Black and white)
        let boardGameObject = new GameObject(gl, glProgram, await loadAndInitMesh('../assets/models/newboard/AleBoard.obj'));
        boardGameObject.setPosition(0, 0, 0);

        boardGameObject.setName("board")
        boardGameObject.setTexture(gl, CURRENT_KIT.textureURI.toString(),
            CURRENT_KIT.normalMapURI.toString())
        boardGameObject.setYaw(45);
        boardGameObject.setScale(1.02);
        Scene[0] = boardGameObject;

        let boardFrameGameObject = new GameObject(gl, glProgram, await loadAndInitMesh('../assets/models/newboard/BoardFrame.obj'));
        boardFrameGameObject.setPosition(0, 0.1, 0);
        boardFrameGameObject.setName("board-frame")
        boardFrameGameObject.setTexture(gl, CURRENT_KIT.frameTextureURI.toString(),CURRENT_KIT.frameNormalMapURI.toString()
            );
        boardFrameGameObject.setYaw(45);
        boardFrameGameObject.setScale(1);
        Scene[1] = boardFrameGameObject;
    }

    await spawnBoards();


    VIEW = pickNextView();


    //==========================================================================================================================================
    //==========================================================================================================================================

    //GL STUFF
    //* ==========================================================================================================================================

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    let COLOR_OF_THE_UNIVERSE = [0.0, 0.0, 0.0, 0.0]
    gl.clearColor(COLOR_OF_THE_UNIVERSE[0],COLOR_OF_THE_UNIVERSE[1],COLOR_OF_THE_UNIVERSE[2],COLOR_OF_THE_UNIVERSE[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    getSkyboxAttributesAndUniforms();


    //==========================================================================================================================================
    //* ==========================================================================================================================================

    let clickedState = false;
    function render(time) {
        time *= 0.001;  // convert to seconds

        computeCameraDiff();
        camera_angles.phi += camera_diff.x;
        camera_angles.omega += camera_diff.y;
        if(camera_angles.omega < CAMERA_BOTTOM_OMEGA) camera_angles.omega = CAMERA_BOTTOM_OMEGA;
        if(camera_angles.omega > CAMERA_TOP_OMEGA) camera_angles.omega = CAMERA_TOP_OMEGA;
        radius = CAMERA_SPHERE_RADIUS/camera_depth;
        let cam_x_pos = radius * Math.sin(utils.degToRad(camera_angles.omega)) * Math.cos(utils.degToRad(camera_angles.phi));
        let cam_z_pos = radius * Math.sin(utils.degToRad(camera_angles.omega)) * Math.sin(utils.degToRad(camera_angles.phi));
        let cam_y_pos = radius * Math.cos(utils.degToRad(camera_angles.omega));

        let lx = document.getElementById("lx").value;
        let ly = document.getElementById("ly").value;
        let lz = document.getElementById("lz").value;

        let inputSpotLightDirection = [document.getElementById("lxs").value,
            document.getElementById("lys").value,
            document.getElementById("lzs").value]

        /*document.getElementById("info-box").innerText = "Camera Position: " + cam_x_pos + " " + cam_y_pos + " " + cam_z_pos +
            "" +
            "" +
            "" +
            "";*/
        document.getElementById("view_btn").innerText = VIEW;

        //INIT CAMERA STUFF * ==========================================================================================================================================
        //* ==========================================================================================================================================

        gl.clearColor(COLOR_OF_THE_UNIVERSE[0],COLOR_OF_THE_UNIVERSE[1],COLOR_OF_THE_UNIVERSE[2],COLOR_OF_THE_UNIVERSE[3]);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let aspect = gl.canvas.width / gl.canvas.height;

        let cameraPosition = [cam_x_pos, cam_y_pos, cam_z_pos];
        let target = [0.0, 0.0, 0.0];
        let up = [0.0, 1.0, 0.0];
        let cameraMatrix = utils.LookAt(cameraPosition, target, up);
        let viewMatrix = utils.invertMatrix(cameraMatrix);
        let projectionMatrix = utils.MakePerspective(60.0, aspect, nearPlane, farPlane);



        //* ==========================================================================================================================================
        // draw skybox
        gl.useProgram(skyboxProgram);

        gl.activeTexture(gl.TEXTURE0+3);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
        gl.uniform1i(skyboxTexHandle, 3);

        let viewProjMat = utils.multiplyMatrices(projectionMatrix, viewMatrix);
        let inverseViewProjMatrix = utils.invertMatrix(viewProjMat);
        gl.uniformMatrix4fv(inverseViewProjMatrixHandle, gl.FALSE, utils.transposeMatrix(inverseViewProjMatrix));

        gl.bindVertexArray(skyboxVao);
        gl.depthFunc(gl.LEQUAL);
        gl.drawArrays(gl.TRIANGLES, 0, 1*6);

        //* ==========================================================================================================================================

        // raycasting transformations: from pixel to position
        if(clickedState) {
            let ray_clip = [ray_nds[0], ray_nds[1], -1, 1];
            let ray_eye = utils.multiplyMatrixVector(m4.inverse(projectionMatrix), ray_clip);
            ray_eye = [ray_eye[0], ray_eye[1], -1, 0];
            let ray_wor = utils.multiplyMatrixVector(utils.invertMatrix(viewMatrix), ray_eye).slice(0, 3);
            utils.normalize(ray_wor, ray_wor);

            // coordinate on the board plane
            const intersection = raycast.linePlaneIntersection(boardPlane, cameraPosition, ray_wor);
            selectedSquare = getClosestSquare(intersection);

            //testPawn.setPosition(intersection[0], intersection[1], intersection[2]);
            clickedState = false;
            console.log(selectedSquare);
        }

        //animation
        if (window.isAnimating) animation();
        //console.log("animating " + window.isAnimating);


        /**
         * FOR EACH VAO / 3D MODEL IN THE SCENE
         * ==========================================================================================================================================
         */

        //LIGHT=====================================================================================================================
        let lDirectionVector = [lx, ly, lz]
       // let u_lightDirection = (lDirectionVector); //no need to normalize, vector components swing between -1 and 1

        let directionalLight = { direction : lDirectionVector, color : [.9, .9, .9, 1] }
        let spotLight = { position: [0, 13, 1], direction: inputSpotLightDirection, color : [1, 1, 1, 1], decay : 0.5, cIN : 20, cOUT: 56 }

        let LIGHTS = {directionalLight, spotLight}

        Scene.forEach((sceneObject) => {

            gl.useProgram(sceneObject.glProgramInfo);
            gl.bindVertexArray(sceneObject.VAO);

            //OLD CODE
            // sceneObject.render(gl, projectionMatrix, viewMatrix, u_lightDirection);
            //
            //->introducing phong
            //renderPhong(gl, projectionMatrix, viewMatrix, phongShader, eyeDirectionV3, lightDirectionV3, lightColorV4, ambientLightV4)
            let ambientLight = [0.21, 0.21, 0.21, 1.0];

            sceneObject.renderPhong(gl, projectionMatrix, viewMatrix, CURRENT_KIT.phong, cameraPosition, LIGHTS, ambientLight)

        })
        requestAnimationFrame(render);
    }
    gl.canvas.addEventListener('mousedown', (e) => {
        const canvas = gl.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        clipX = x / rect.width * 2 - 1;
        clipY = 1 - y / rect.height * 2;
        ray_nds = [clipX, clipY, 1];
        clickedState = true;
    });
    requestAnimationFrame(render);
}

main();