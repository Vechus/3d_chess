class GameObject {
    constructor(gl, glProgram, mesh) {
        this.mesh = mesh
        this.VAO = initVAO(gl, glProgram, this.mesh);
        this.glProgramInfo = (glProgram)

        this.position = [0, 0, 0]
        this.color = [1.0, 1.0, 1.0, 1.0]
        this.scale = 1.0;

        this.mesh = mesh

        this.children = [] //nesting and scene graph
    }

    setProgramInfo(glProgramInfo) {
        this.glProgramInfo = glProgramInfo;
    }

    setPosition(x,y,z) {
        this.position = [x,y,z]
    }

    setDiffuseColor(red, green, blue, alpha) {
        this.color = [red, green, blue, alpha]
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
        let u_world = utils.identityMatrix();
        u_world = utils.multiplyMatrices(u_world, utils.MakeTranslateMatrix(this.position[0], this.position[1], this.position[2])); //from origin to

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