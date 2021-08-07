const coorColumnsMap = new Map([
    ['a', -5.2],
    ['b', -3.7],
    ['c', -2.2],
    ['d', -0.7],
    ['e', 0.7],
    ['f', 2.2],
    ['g', 3.7],
    ['h', 5.2]
]);

const coorRowsMap = new Map([
    [1, 5.2],
    [2, 3.7],
    [3, 2.2],
    [4, 0.7],
    [5, -0.7],
    [6, -2.2],
    [7, -3.7],
    [8, -5.2]
]);

const zPos = 0.7;

class GameObject {
    constructor(gl, glProgram, mesh) {
        this.mesh = mesh;
        this.VAO = initVAO(gl, glProgram, this.mesh);
        this.glProgramInfo = (glProgram);

        this.position = [0, 0, 0];
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.color = [1.0, 1.0, 1.0, 1.0]
        this.scale = 1.0;

        this.mesh = mesh;

        this.children = []; //nesting and scene graph

    }

    setProgramInfo(glProgramInfo) {
        this.glProgramInfo = glProgramInfo;
    }

    setPosition(x,y,z) {
        this.position = [x,y,z];
    }

    setPitch(p) {
        this.pitch = p;
    }

    setYaw(y) {
        this.yaw = y;
    }

    setRoll(r) {
        this.roll = r;
    }

    setDiffuseColor(red, green, blue, alpha) {
        this.color = [red, green, blue, alpha];
    }
 

    /*
    placeOnSquare(square) {
        let tempArray1 = square.split("");
        let col = tempArray1[0];
        let row = tempArray1[1];
            this.setPosition(coorColumnsMap.get(col), zPos, coorRowsMap.get(row));    
    }
    */
  

    #computeWorldMatrix() {
        let scaleMatrix = utils.MakeScaleMatrix(this.scale);
        let rotateXMatrix = utils.MakeRotateXMatrix(this.pitch);
        let rotateYMatrix = utils.MakeRotateYMatrix(this.yaw);
        let rotateZMatrix = utils.MakeRotateZMatrix(this.roll);
        let translateMatrix = utils.MakeTranslateMatrix(this.position[0], this.position[1], this.position[2]);
        return utils.multiplyMatrices(
            translateMatrix,
            utils.multiplyMatrices(
                rotateYMatrix,
                utils.multiplyMatrices(
                    rotateXMatrix,
                    utils.multiplyMatrices(
                        rotateZMatrix,
                        scaleMatrix
                    )
                )
            )
        );
    }

    render(gl, projectionMatrix, viewMatrix, lightDirection) {

        let fsDiffuseColor4 = gl.getUniformLocation(glProgram, 'u_diffuse');
        let fsLightDirection3 = gl.getUniformLocation(glProgram, 'u_lightDirection');

        //Uniforms of Vertex Shader
        let vsView = gl.getUniformLocation(glProgram, "u_view");
        let vsProjection = gl.getUniformLocation(glProgram, 'u_projection');
        let vsWorld = gl.getUniformLocation(glProgram, 'u_world');

        //==========================================================================================================================
        // compute the world matrix for (in this case) the queen
        let u_world = this.#computeWorldMatrix();

        gl.uniformMatrix4fv(vsProjection, false, utils.transposeMatrix(projectionMatrix));
        gl.uniformMatrix4fv(vsView, false, utils.transposeMatrix(viewMatrix));

        gl.uniformMatrix4fv(vsWorld, false, utils.transposeMatrix(u_world));

        let materialColor = this.color

        gl.uniform4fv(fsDiffuseColor4, materialColor);
        gl.uniform3fv(fsLightDirection3, lightDirection);

        gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}

/*

// Defining class using es6
class Vehicle {
  constructor(name, maker, engine) {
    this.name = name;
    this.maker =  maker;
    this.engine = engine;
  }
  getDetails(){
      return (`The name of the bike is ${this.name}.`)
  }
}
 */