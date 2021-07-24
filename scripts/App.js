
var vertexShaderSource = `#version 300 es

in vec3 a_position;
in vec3 a_color;
out vec3 colorV;

uniform mat4 matrix; 
void main() {
  colorV = a_color;
  gl_Position = matrix * vec4(a_position,1.0);
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;


in vec3 colorV;
out vec4 outColor;

void main() {
  outColor = vec4(colorV,1.0);
}
`;

var canvas;
let speed = 0;
var gl = null,
    program = null;

var projectionMatrix,
    perspectiveMatrix,
    viewMatrix,
    worldMatrix, vao, matrixLocation;
var lastUpdateTime = (new Date).getTime();

//*** GLOBALS ****///

//Scene

let sceneTree = []
//Camera coordinates
var cx = 0.0;
var cy = 0.0;
var cz = 1.0;
var elevation = 0.0;
var angle = 0.0;

var delta = 0.1;
var flag = 0;

//Cube parameters
var cubeTx = 0.0;
var cubeTy = 0.0;
var cubeTz = -1.0;
var cubeRx = 0.0;
var cubeRy = 0.0;
var cubeRz = 0.0;
var cubeS = 0.5;

async function loadObj(pathToModel) {
    //This line must be in an async function
    //var objStr = await utils.get_objstr(pathToModel);
    var objModel = new OBJ.Mesh(pathToModel);
    var modelVertices = objModel.vertices; //Array of vertices
    var modelNormals = objModel.normals; //Array of normals
    var modelIndices = objModel.indices; //Array of indices
    var modelTexCoords = objModel.textures; //Array of uv coordinates

    return (modelVertices, modelNormals, modelIndices, modelTexCoords)
}

function main() {

    //** TRY TO LOAD AN OBJ ** TEST **//
    let carGameObject = loadObj("../aletest/cat.obj")
    // Get a WebGL context
    canvas = document.getElementById("game-canvas");

    gl = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }
    utils.resizeCanvasToDisplaySize(gl.canvas);

    //use this aspect ratio to keep proportions
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // create GLSL shaders, upload the GLSL source, compile the shaders and link them
    let vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    let fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    let program = utils.createProgram(gl, vertexShader, fragmentShader);

    // look up where the vertex data needs to go.
    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    let colorAttributeLocation = gl.getAttribLocation(program, "a_color");
    matrixLocation = gl.getUniformLocation(program, "matrix");


    perspectiveMatrix = utils.MakePerspective(90, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

    // Create a vertex array object (attribute state)
    vao = gl.createVertexArray();

    // and make it the one we're currently working with
    gl.bindVertexArray(vao);
    // Create a buffer and put three 2d clip space points in it
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    drawScene();


    function animate() {
        let currentTime = (new Date).getTime();

        if (lastUpdateTime) {
            //currentTime – lastUpdateTime is the time passed between frames

            let dt = (currentTime - lastUpdateTime);
            var deltaC = (1/2 * dt) / 250.0;
            //build up speed
            deltaC = deltaC + 1/3 * speed;

            speed = speed + 0.01;

            if (flag === 0) cubeTx += deltaC;
            else cubeTx -= deltaC;
            if (cubeTx >= 1.5) {
                flag = 1
                speed = 0;
            }
            else if (cubeTx <= -1.5) {
                flag = 0;
                speed = 0;
            }
        }
        worldMatrix = utils.MakeWorld(cubeTx, cubeTy, cubeTz, cubeRx, cubeRy, cubeRz, cubeS);
        lastUpdateTime = currentTime; //Need to update it for the next frame
    }


    function drawScene() {
        animate();

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.useProgram(program);

        // Bind the attribute/buffer set we want.
        gl.bindVertexArray(vao);

        let viewMatrix = utils.MakeView(cx, cy, cz, elevation, angle);

        projectionMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
        projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, projectionMatrix);

        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        window.requestAnimationFrame(drawScene);
    }

}

window.onload = main;

