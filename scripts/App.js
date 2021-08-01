/*
    3D MODELS AND OBJ UTILS
 */

var glProgram;

async function loadAndInitMesh(resourceURI) {
    let objString = await utils.get_objstr(resourceURI);
    return new OBJ.Mesh(objString);
}

function initVAO(gl, program, mesh) {
    let VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);

    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    let normalAttributeLocation = gl.getAttribLocation(program, "a_normal");


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

    /* TODO UVs
    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textures), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.UV_ATTRIBUTE);
    gl.vertexAttribPointer(program.UV_ATTRIBUTE, 2, gl.FLOAT, false, 0, 0); */

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

    return VAO
}

async function main() {
    // Get A WebGL context
    const canvas = document.getElementById('game-canvas');
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    //SHADERS ====================================================================================================================================
    const shaderDir = "../shaders/"
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        glProgram = utils.createProgram(gl, vertexShader, fragmentShader);
    });

    //FETCH ASSETS
    //* ==========================================================================================================================================

    let queenMesh = await loadAndInitMesh('../assets/models/Pawn.obj');
    let queenVAO = initVAO(gl, glProgram, queenMesh);

    //==========================================================================================================================================
    //==========================================================================================================================================

    //GL STUFF
    //* ==========================================================================================================================================

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.86, 0.86, 0.86, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    let fsDiffuseColor4 = gl.getUniformLocation(glProgram, 'u_diffuse');
    let fsLightDirection3 = gl.getUniformLocation(glProgram, 'u_lightDirection');


    //Uniforms of Vertex Shader
    let vsView = gl.getUniformLocation(glProgram, "u_view");
    let vsProjection = gl.getUniformLocation(glProgram, 'u_projection');
    let vsWorld = gl.getUniformLocation(glProgram, 'u_world');
    //==========================================================================================================================================
    //* ==========================================================================================================================================

    function render(time) {
        time *= 0.001;  // convert to seconds

        const INPUT_SCALE = 1;

        let cam_x_pos = document.getElementById("cxpos").value / INPUT_SCALE;
        let cam_y_pos = document.getElementById("cypos").value / INPUT_SCALE;
        let cam_z_pos = document.getElementById("czpos").value / INPUT_SCALE;


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



        let viewProjectionMatrix = utils.multiplyMatrices(projectionMatrix, viewMatrix);

        //* ==========================================================================================================================================
        //* ==========================================================================================================================================


        /**
         * FOR EACH VAO / 3D MODEL IN THE SCENE
         * ==========================================================================================================================================
         */

        for (let i = 0; i < 1; i++) {

            //LIGHT=====================================================================================================================
            let u_lightDirection = m4.normalize([-1, 3, 5]);

            //==========================================================================================================================
            // compute the world matrix for (in this case) the queen
            let u_world = utils.identityMatrix();
            u_world = utils.multiplyMatrices(u_world, utils.MakeTranslateMatrix(0, 0, 0)); //from origin to

            gl.useProgram(glProgram); //TODO pick at every iteration the program info of the rendered object
            //I mean: gl.useProgram(object.drawInfo.programInfo);


            gl.uniformMatrix4fv(vsProjection, false, utils.transposeMatrix(projectionMatrix));
            gl.uniformMatrix4fv(vsView, false, utils.transposeMatrix(viewMatrix));

            gl.uniformMatrix4fv(vsWorld, false, utils.transposeMatrix(u_world));

            gl.bindVertexArray(queenVAO);

            let materialColor = [1, 0.5, 0.8, 1.0]

            gl.uniform4fv(fsDiffuseColor4, materialColor);
            gl.uniform3fv(fsLightDirection3, u_lightDirection);


            gl.drawElements(gl.TRIANGLES, queenMesh.indices.length, gl.UNSIGNED_SHORT, 0);

        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();