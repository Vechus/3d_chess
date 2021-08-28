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
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.pieceColor = '';
        this.scale = 1.0;

        this.hasTexture = false;
        this._texture = undefined;

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

    setScale(s) {
        this.scale = s;
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

    setSquare(square) {
        this.square = square;
    }

    getPieceColor() {
        return this.pieceColor;
    }

    setPieceColor(color) {
        this.pieceColor = color;
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

    #computeNormalMatrix(worldMatrix) {
        return utils.invertMatrix(utils.transposeMatrix(worldMatrix));
    }

    resetTexture() {
        this.hasTexture = false;
        this._texture = undefined;
    }

    setTexture(gl, textureUri, normalMapUri) {


        //TEXTURE (Unit = 0) ========================================================

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

        //NORMAL MAP  (Unit=1) ========================================================

        let normalMapTexture = gl.createTexture()
        // use texture unit 1
        gl.activeTexture(gl.TEXTURE1);
        // bind to the TEXTURE_2D bind point of texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, normalMapTexture);

        let imageNormalMap = new Image()
        imageNormalMap.src = normalMapUri
        imageNormalMap.onload = function () {
            //Make sure this is the active one
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, normalMapTexture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageNormalMap);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
        };
        this._textureNormalMap = normalMapTexture

        this.hasTexture = true;
    }

    renderPhong(gl, projectionMatrix, viewMatrix, phongShader, eyePosition, LIGHTS, ambientLightV4) {

        //Vertex Shader
        let vsView = gl.getUniformLocation(glProgram, "u_view");
        let vsProjection = gl.getUniformLocation(glProgram, 'u_projection');
        let vsWorld = gl.getUniformLocation(glProgram, 'u_world');
        let vsNormalMatrix = gl.getUniformLocation(glProgram, 'u_nMatrix');

        let u_world = this.#computeWorldMatrix();
        let u_normalMatrix = this.#computeNormalMatrix(u_world);

        gl.uniformMatrix4fv(vsProjection, false, utils.transposeMatrix(projectionMatrix));
        gl.uniformMatrix4fv(vsView, false, utils.transposeMatrix(viewMatrix));
        gl.uniformMatrix4fv(vsWorld, false, utils.transposeMatrix(u_world));
        gl.uniformMatrix4fv(vsNormalMatrix, false, utils.transposeMatrix(u_normalMatrix));

        //Fragment Shader

        let fsSpecularShineF = gl.getUniformLocation(glProgram, 'specularShine');
        gl.uniform1f(fsSpecularShineF, phongShader.specularShineF);

        let fsDiffuseColor4 = gl.getUniformLocation(glProgram, 'diffColor');
        gl.uniform4fv(fsDiffuseColor4, this.color);

        let fsSpecularColor4 = gl.getUniformLocation(glProgram, 'specularColor');
        gl.uniform4fv(fsSpecularColor4, phongShader.specularColorV4);

        let fsEmit4 = gl.getUniformLocation(glProgram, 'emit');
        gl.uniform4fv(fsEmit4, phongShader.emitV4);

        let fsEyeDirection3 = gl.getUniformLocation(glProgram, 'eyePosition');
        gl.uniform3fv(fsEyeDirection3, eyePosition);

        // LIGHTS //

        let fsLightDirection3 = gl.getUniformLocation(glProgram, 'lightDirectionVector');
        gl.uniform3fv(fsLightDirection3, LIGHTS.directionalLight.direction);

        let fsLightColor4 = gl.getUniformLocation(glProgram, 'lightColor');
        gl.uniform4fv(fsLightColor4, LIGHTS.directionalLight.color);

        /*
        uniform vec3 spotLightPosition;
        uniform vec4 spotLightColor;
        uniform float spotLightDecay;
        uniform float cIN, cOUT;
         */

        gl.uniform3fv(gl.getUniformLocation(glProgram, 'spotLightDirection'), LIGHTS.spotLight.direction);
        gl.uniform3fv(gl.getUniformLocation(glProgram, 'spotLightPosition'), LIGHTS.spotLight.position);
        gl.uniform4fv(gl.getUniformLocation(glProgram, 'spotLightColor'), LIGHTS.spotLight.color);
        gl.uniform1f(gl.getUniformLocation(glProgram, 'spotLightDecay'), LIGHTS.spotLight.decay);
        gl.uniform1f(gl.getUniformLocation(glProgram, 'cIN'), LIGHTS.spotLight.cIN);
        gl.uniform1f(gl.getUniformLocation(glProgram, 'cOUT'), LIGHTS.spotLight.cOUT);

        let fsAmbientLight = gl.getUniformLocation(glProgram, 'ambientLight');
        gl.uniform4fv(fsAmbientLight, ambientLightV4);

        //

        gl.uniform1i(gl.getUniformLocation(glProgram,"hasTexture"), 0);

        //Textures
        if (this.hasTexture) {
            //tell the fragment shader that a texture exists
            gl.uniform1i(gl.getUniformLocation(glProgram,"hasTexture"), 1);
            let textLocation = gl.getUniformLocation(glProgram, "u_texture");
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this._texture);
            gl.uniform1i(textLocation, 0);

            let nmapTextLocation = gl.getUniformLocation(glProgram, "u_normalMap");
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this._textureNormalMap);
            gl.uniform1i(nmapTextLocation, 1); //texture unit 1


        }


        ////

        gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);

    }
}

class PhongShader {

    constructor(specularShineF, specularColorV4, emitV4) {
        this._specularShineF = specularShineF;
        this._specularColorV4 = specularColorV4;
        this._emitV4 = emitV4;
    }

    get specularShineF() {
        return this._specularShineF;
    }

    get specularColorV4() {
        return this._specularColorV4;
    }

    get emitV4() {
        return this._emitV4;
    }
}

const KITS = {PLASTIC: "PLASTIC", WOOD: "WOOD" /*, METAL: "METAL", MARBLE: "MARBLE" */, NEON: "NEON"};

class GameKit {
    get piecesNormalMapURI() {
        return this._piecesNormalMapURI;
    }

    set piecesNormalMapURI(value) {
        this._piecesNormalMapURI = value;
    }
    get whiteTextureURI() {
        return this._whiteTextureURI;
    }

    set whiteTextureURI(value) {
        this._whiteTextureURI = value;
    }

    get blackTextureURI() {
        return this._blackTextureURI;
    }

    set blackTextureURI(value) {
        this._blackTextureURI = value;
    }

    constructor(kitEnum, textureURI, normalMapURI, phong, whiteColor, blackColor) {
        this._textureURI = textureURI;
        this._normalMapURI = normalMapURI;
        this._phong = phong;
        this._whiteColor = whiteColor;
        this._blackColor = blackColor;
        if (!(kitEnum in KITS)) console.error("Give me an enum")
        this.kit = kitEnum

        this._frameTextureURI = "../assets/models/newboard/Textures/Wood.bmp";
        this._frameNormalMapURI = "../assets/models/newboard/Textures/WoodNormalMap.png";

        this._whiteTextureURI = undefined;
        this._blackTextureURI = undefined;
        this._piecesNormalMapURI = undefined;

    }


    get frameTextureURI() {
        return this._frameTextureURI;
    }

    set frameTextureURI(value) {
        this._frameTextureURI = value;
    }

    get frameNormalMapURI() {
        return this._frameNormalMapURI;
    }

    set frameNormalMapURI(value) {
        this._frameNormalMapURI = value;
    }

    get textureURI() {
        return this._textureURI;
    }

    set textureURI(value) {
        this._textureURI = value;
    }

    get normalMapURI() {
        return this._normalMapURI;
    }

    set normalMapURI(value) {
        this._normalMapURI = value;
    }

    get phong() {
        return this._phong;
    }

    set phong(value) {
        this._phong = value;
    }

    get whiteColor() {
        return this._whiteColor;
    }

    set whiteColor(value) {
        this._whiteColor = value;
    }

    get blackColor() {
        return this._blackColor;
    }

    set blackColor(value) {
        this._blackColor = value;
    }

}
