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

        this.cameraUBO = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.cameraUBO);
        const camIndex = gl.getUniformBlockIndex(this.program, "Camera");
        const camSize = gl.getActiveUniformBlockParameter(this.program, camIndex, gl.UNIFORM_BLOCK_DATA_SIZE);
        gl.bufferData(gl.UNIFORM_BUFFER, camSize, gl.DYNAMIC_DRAW);

        const camBindingPoint = 0;
        gl.bindBufferBase(gl.UNIFORM_BUFFER, camBindingPoint, this.cameraUBO);
        gl.uniformBlockBinding(this.program, camIndex, camBindingPoint);

        this.chunkUBO = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.chunkUBO);
        const chunkIndex = gl.getUniformBlockIndex(this.program, "Chunk");
        const chunkSize = gl.getActiveUniformBlockParameter(this.program, chunkIndex, gl.UNIFORM_BLOCK_DATA_SIZE);
        gl.bufferData(gl.UNIFORM_BUFFER, chunkSize, gl.STATIC_DRAW);

        const chunkBindingPoint = 1;
        gl.bindBufferBase(gl.UNIFORM_BUFFER, chunkBindingPoint, this.chunkUBO);
        gl.uniformBlockBinding(this.program, chunkIndex, chunkBindingPoint);
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

    /**
     * @param {Matrix4} view
     * @param {Matrix4} proj  
     */
    uploadCameraUBO(view, proj) {
        const mat = new Matrix4(proj);
        mat.multiply(view);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.cameraUBO);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, mat.elements);
        return mat;
    }

    /**
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} z 
     */
    uploadChunkUBO(x, y, z) {
        let mat = new Matrix4();
        mat.setTranslate(x, y, z);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.chunkUBO);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, mat.elements);
    }

    uploadTextures() {
        this.gl.useProgram(this.program);
        this.texture = setupTextures(this.gl);
        const loc = this.gl.getUniformLocation(this.program, "textureArray");
        this.gl.uniform1i(loc, 0);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, this.texture);
    }
}