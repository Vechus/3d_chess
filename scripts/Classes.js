const coorColumnsMap = new Map([
    ['A', -5.2],
    ['B', -3.7],
    ['C', -2.2],
    ['D', -0.7],
    ['E', 0.7],
    ['F', 2.2],
    ['G', 3.7],
    ['H', 5.2]
]);

const coorRowsMap = new Map([
    ['1', 5.2],
    ['2', 3.7],
    ['3', 2.2],
    ['4', 0.7],
    ['5', -0.7],
    ['6', -2.2],
    ['7', -3.7],
    ['8', -5.2]
]);

const yPos = 0.7;

class GameObject {
    constructor(gl, glProgram, mesh) {
        this.mesh = mesh;
        this.VAO = initVAO(gl, glProgram, this.mesh);
        this.glProgramInfo = (glProgram);

        this.position = [0, 0, 0];
        this.square = 'A0';
        this.piece = 'NULL';
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.color = [1.0, 1.0, 1.0, 1.0]
        this.scale = 1.0;

        this.mesh = mesh;

        this.children = []; //nesting and scene graph

    }

    setName(name) {
        this._name = name;
    }

    setProgramInfo(glProgramInfo) {
        this.glProgramInfo = glProgramInfo;
    }

    setPosition(x,y,z) {
        this.position = [x,y,z];
    }

    getPosition() {
        return this.position;
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

    setPiece(piece) {
        this.piece = piece;
    }

    getPiece() {
        return this.piece;
    }
    
    placeOnSquare(square) {
        let tempArray1 = square.split("");
        let col = tempArray1[0];
        let row = tempArray1[1];
        this.setPosition(coorColumnsMap.get(col), yPos, coorRowsMap.get(row));
        this.square = square;
    }

    getSquare() {
        return this.square;
    }

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

    setTexture(gl, textureUri) {
        let texture = gl.createTexture()
        // use texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        // bind to the TEXTURE_2D bind point of texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        let image = new Image()
        image.src = textureUri
        image.onload = function () {
            //Make sure this is the active one
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.generateMipmap(gl.TEXTURE_2D);
        };
        this._texture = texture
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

    renderPhong(gl, projectionMatrix, viewMatrix, phongShader, eyeDirectionV3, lightDirectionV3, lightColorV4, ambientLightV4) {

        //Vertex Shader
        let vsView = gl.getUniformLocation(glProgram, "u_view");
        let vsProjection = gl.getUniformLocation(glProgram, 'u_projection');
        let vsWorld = gl.getUniformLocation(glProgram, 'u_world');

        let u_world = this.#computeWorldMatrix();
        gl.uniformMatrix4fv(vsProjection, false, utils.transposeMatrix(projectionMatrix));
        gl.uniformMatrix4fv(vsView, false, utils.transposeMatrix(viewMatrix));
        gl.uniformMatrix4fv(vsWorld, false, utils.transposeMatrix(u_world));

        //Fragment Shader

        let fsSpecularShineF = gl.getUniformLocation(glProgram, 'specularShine');
        gl.uniform1f(fsSpecularShineF, phongShader.specularShineF);

        let fsDiffuseColor4 = gl.getUniformLocation(glProgram, 'diffColor');
        gl.uniform4fv(fsDiffuseColor4, this.color);

        let fsAmbientColor4 = gl.getUniformLocation(glProgram, 'ambColor');
        gl.uniform4fv(fsAmbientColor4, phongShader.ambColorV4);

        let fsSpecularColor4 = gl.getUniformLocation(glProgram, 'specularColor');
        gl.uniform4fv(fsSpecularColor4, phongShader.specularColorV4);

        let fsEmit4 = gl.getUniformLocation(glProgram, 'emit');
        gl.uniform4fv(fsEmit4, phongShader.emitV4);

        let fsEyeDirection3 = gl.getUniformLocation(glProgram, 'eyedirVec');
        gl.uniform3fv(fsEyeDirection3, eyeDirectionV3);

        let fsLightDirection3 = gl.getUniformLocation(glProgram, 'lightDirectionVector');
        gl.uniform3fv(fsLightDirection3, lightDirectionV3);

        let fsLightColor4 = gl.getUniformLocation(glProgram, 'lightColor');
        gl.uniform4fv(fsLightColor4, lightColorV4);

        let fsAmbientLight = gl.getUniformLocation(glProgram, 'ambientLight');
        gl.uniform4fv(fsAmbientLight, ambientLightV4);


        //Textures
        if (this._activeTexture !== undefined) {
            let textLocation = gl.getUniformLocation(glProgram, "u_texture");
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this._activeTexture._texture);
            gl.uniform1i(textLocation, 0);
        }


        ////

        gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);

    }
}

/**
 uniform float specularShine;		// specular coefficient for both Blinn and Phong
 uniform vec4 diffColor;		    // diffuse color
 uniform vec4 ambColor;		    // material ambient color
 uniform vec4 specularColor;		// specular color
 uniform vec4 emit;			    // emitted color

 uniform vec3 eyedirVec;		    // looking direction
 uniform vec3 lightDirectionVector;
 uniform vec4 lightColor;
 uniform vec4 ambientLight;
 */
class PhongShader {

    constructor(specularShineF, ambColorV4, specularColorV4, emitV4) {
        this.specularShineF = specularShineF;
        this.ambColorV4 = ambColorV4;
        this.specularColorV4 = specularColorV4;
        this.emitV4 = emitV4;
    }
}

class Texture {

    constructor(gl, imageUrl) {



        this._texture = texture;
    }
}
