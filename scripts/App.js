/*
    3D MODELS AND OBJ UTILS
 */
async function loadAndInitMesh(resourceURI) {
    let objString = await utils.get_objstr(resourceURI);
    return new OBJ.Mesh(objString);
}
function initVAO(gl, program, mesh) {
    let VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.POSITION_ATTRIBUTE);
    gl.vertexAttribPointer(program.POSITION_ATTRIBUTE, 3, gl.FLOAT, false, 0, 0);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexNormal), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.NORMAL_ATTRIBUTE);
    gl.vertexAttribPointer(program.NORMAL_ATTRIBUTE, 3, gl.FLOAT, false, 0, 0);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textures), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.UV_ATTRIBUTE);
    gl.vertexAttribPointer(program.UV_ATTRIBUTE, 2, gl.FLOAT, false, 0, 0);

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

    const vs = `#version 300 es
  in vec4 a_position;
  in vec3 a_normal;
  in vec4 a_color;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;

  out vec3 v_normal;
  out vec4 v_color;

  void main() {
    gl_Position = u_projection * u_view * u_world * a_position;
    v_normal = mat3(u_world) * a_normal;
    v_color = a_color;
  }
  `;

    const fs = `#version 300 es
  precision highp float;

  in vec3 v_normal;
  in vec4 v_color;

  uniform vec4 u_diffuse;
  uniform vec3 u_lightDirection;

  out vec4 outColor;

  void main () {
    vec3 normal = normalize(v_normal);
    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    vec4 diffuse = u_diffuse * v_color;
    outColor = vec4(diffuse.rgb * fakeLight, diffuse.a);
  }
  `;

    let vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, vs);
    let fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, fs);

    //info on how to render by binding the two shaders (DELETE THIS BEFORE THE EXAM) TODO
    const glProgram = utils.createProgram(gl, vertexShader, fragmentShader);

    // compiles and links the shaders, looks up attribute and uniform locations
    // const meshProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // const obj = await loader.load_obj('../assets/models/Queen.obj');

    /* const parts = obj.geometries.map(({data}) => {
         // Because data is just named arrays like this
         //
         // {
         //   position: [...],
         //   texcoord: [...],
         //   normal: [...],
         // }
         //
         // and because those names match the attributes in our vertex
         // shader we can pass it directly into `createBufferInfoFromArrays`
         // from the article "less code more fun".

         if (data.color) {
             if (data.position.length === data.color.length) {
                 // it's 3. The our helper library assumes 4 so we need
                 // to tell it there are only 3.
                 data.color = { numComponents: 3, data: data.color };
             }
         } else {
             // there are no vertex colors so just use constant white
             data.color = { value: [1, 1, 1, 1] };
         }

         // create a buffer for each array by calling
         // gl.createBuffer, gl.bindBuffer, gl.bufferData
         const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
         const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
         return {
             material: {
                 u_diffuse: [1, 1, 1, 1],
             },
             bufferInfo,
             vao,
         };
     }); */

    const cameraTarget = [0, 0, 0];
    // figure out how far away to move the camera so we can likely

    const radius = 3
    let cameraPosition = m4.addVectors(cameraTarget, [
        0,
        2,
        radius,
    ]);
    // Set zNear and zFar to something hopefully appropriate
    // for the size of this object.
    const zNear = radius / 100;
    const zFar = radius * 3;

    //FETCH ASSETS

    let queenMesh = await loadAndInitMesh('../assets/models/Queen.obj');
    let queenVAO = initVAO(gl, glProgram, queenMesh);

    function render(time) {
        time *= 0.001;  // convert to seconds

        const INPUT_SCALE = 1;
        //** GET INPUT **//
        let cam_x_pos = document.getElementById("cxpos").value / INPUT_SCALE;
        let cam_y_pos = document.getElementById("cypos").value / INPUT_SCALE;
        let cam_z_pos = document.getElementById("czpos").value / INPUT_SCALE;

        //for each elements: render its triangles, with the amount of indexed triangles

        /**
         * FOR EACH VAO / 3D MODEL IN THE SCENE
         */
        gl.bindVertexArray(queenVAO);
        gl.drawElements(gl.TRIANGLES, queenMesh.indices.length, gl.UNSIGNED_SHORT, 0);

        /*twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);

        const fieldOfViewRadians = degToRad(70);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        const up = [0, 1, 0];
        // Compute the camera's matrix using look at.
        cameraPosition[0] = cam_x_pos;
        cameraPosition[1] = cam_y_pos;
        cameraPosition[2] = cam_z_pos;
        let camera = m4.lookAt(cameraPosition, cameraTarget, up);
        //translate the M_c matrix, camera matrix, which inverse is the View Matrix

        document.getElementById("camera-info-box").innerText = "Camera: (" + cam_x_pos + "," + cam_y_pos + "," + cam_z_pos + ") "

        // Make a view matrix from the camera matrix.
        const view = m4.inverse(camera);

        const sharedUniforms = {
            u_lightDirection: m4.normalize([-1, 3, 5]),
            u_view: view,
            u_projection: projection,
        };
 */


        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();