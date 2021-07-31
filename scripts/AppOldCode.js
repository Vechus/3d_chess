void

async function main() {
    // Get A WebGL context
    const canvas = document.getElementById('game-canvas');
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    // Tell the twgl to match position with a_position etc..
    twgl.setAttributePrefix("a_");

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


    // compiles and links the shaders, looks up attribute and uniform locations
    const meshProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const obj = await loader.load_obj('../assets/models/Queen.obj');

    const parts = obj.geometries.map(({data}) => {
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
    });

    function getExtents(positions) {
        const min = positions.slice(0, 3);
        const max = positions.slice(0, 3);
        for (let i = 3; i < positions.length; i += 3) {
            for (let j = 0; j < 3; ++j) {
                const v = positions[i + j];
                min[j] = Math.min(v, min[j]);
                max[j] = Math.max(v, max[j]);
            }
        }
        return {min, max};
    }

    function getGeometriesExtents(geometries) {
        return geometries.reduce(({min, max}, {data}) => {
            const minMax = getExtents(data.position);
            return {
                min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
                max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
            };
        }, {
            min: Array(3).fill(Number.POSITIVE_INFINITY),
            max: Array(3).fill(Number.NEGATIVE_INFINITY),
        });
    }

    const extents = getGeometriesExtents(obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);
    // amount to move the object so its center is at the origin
    const objOffset = m4.scaleVector(
        m4.addVectors(
            extents.min,
            m4.scaleVector(range, 0.5)),
        -1);
    const cameraTarget = [0, 0, 0];
    // figure out how far away to move the camera so we can likely
    // see the object.
    const radius = m4.length(range) * 1.2;
    let cameraPosition = m4.addVectors(cameraTarget, [
        0,
        2,
        radius,
    ]);
    // Set zNear and zFar to something hopefully appropriate
    // for the size of this object.
    const zNear = radius / 100;
    const zFar = radius * 3;

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    function render(time) {
        time *= 0.001;  // convert to seconds

        const INPUT_SCALE = 1;
        //** GET INPUT **//
        let cam_x_pos = document.getElementById("cxpos").value/INPUT_SCALE;
        let cam_y_pos = document.getElementById("cypos").value/INPUT_SCALE;
        let cam_z_pos = document.getElementById("czpos").value/INPUT_SCALE;


        twgl.resizeCanvasToDisplaySize(gl.canvas);
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

        gl.useProgram(meshProgramInfo.program);

        // calls gl.uniform
        twgl.setUniforms(meshProgramInfo, sharedUniforms);

        // compute the world matrix once since all parts
        // are at the same space.
        let u_world = m4.yRotation(time);
        u_world = m4.translate(u_world, ...objOffset);

        for (const {bufferInfo, vao, material} of parts) {
            // set the attributes for this part.
            gl.bindVertexArray(vao);
            // calls gl.uniform
            twgl.setUniforms(meshProgramInfo, {
                u_world,
                u_diffuse: material.u_diffuse,
            });
            // calls gl.drawArrays or gl.drawElements
            twgl.drawBufferInfo(gl, bufferInfo);
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();