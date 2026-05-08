class Shader {
    /**
     * @param {WebGL2RenderingContext} gl 
     * @param {WebGLShader} vertex
     * @param {WebGLShader} fragment 
     */
    constructor(gl, vertex, fragment) {
        this.gl = gl;
        this.vertShader = vertex;
        this.fragShader = fragment;

        this.program = this.createProgram();
        if (!this.program) { return; }

        this.uploadTextures();

        this.projAttribLoc = gl.getUniformLocation(this.program, "projection");
        this.viewAttribLoc = gl.getUniformLocation(this.program, "view");
        this.modelAttribLoc = gl.getUniformLocation(this.program, "model");

        this.modelAttribLoc = gl.getUniformLocation(this.program, "model");
    }

    createProgram() {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, this.vertShader);
        this.gl.attachShader(program, this.fragShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    uploadTextures() {
        this.gl.useProgram(this.program);
        this.texture = setupTextures(this.gl, ["Assets/grass.png", "Assets/cactus.png"], 128 * 3, 128 * 2);
        const loc = this.gl.getUniformLocation(this.program, "textureArray");
        this.gl.uniform1i(loc, 0);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, this.texture);
    }

    /** 
     * @param {Matrix4} viewMat 
     * @param {Matrix4} projMat 
     */
    uploadCameraUniforms(viewMat, projMat) {
        this.gl.uniformMatrix4fv(this.viewAttribLoc, false, viewMat.elements);
        this.gl.uniformMatrix4fv(this.projAttribLoc, false, projMat.elements);
    }
    /**
     * @param {Matrix4} modelMat 
     */
    uploadModelUniforms(modelMat) {
        this.gl.uniformMatrix4fv(this.modelAttribLoc, false, modelMat.elements);
    }
}