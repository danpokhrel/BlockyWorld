class Mesh {
    /**
     * @param {WebGL2RenderingContext} gl 
     * @param {Shader} shader
     */
    constructor(gl, shader, data) {
        /** @type {WebGL2RenderingContext} */
        this.gl = gl;
        /** @type {Float32Array} */
        this.positions = data.positions;
        /** @type {Float32Array} */
        this.uvs = data.uvs;
        /** @type {Float32Array} */
        this.normals = data.normals;

        this.vertexCount = data.positions.length / 3;

        this.ids = data.ids;

        this.shader = shader;
        gl.useProgram(shader.program);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.positionBuffer = this.setupBuffer(shader.program, "position", this.positions, 3, gl.FLOAT);
        this.uvBuffer = this.setupBuffer(shader.program, "uv", this.uvs, 2, gl.FLOAT);
        this.texBuffer = this.setupBuffer(shader.program, "textureIndex", this.ids, 1, gl.FLOAT);
        //this.normalBuffer = this.setupBuffer(shader.program, "normal", this.normals, 3, gl.FLOAT);
    }

    /**
     * 
     * @param {WebGLProgram} program 
     * @param {String} attribName 
     * @param {Float32Array} data 
     * @param {Number} size
     * @param {Number} type
     */
    setupBuffer(program, attribName, data, size, type) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, attribName);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, type, false, 0, 0);

        return buffer;
    }
}

class VoxelMesh {
    /**
     * @param {WebGL2RenderingContext} gl 
     * @param {Shader} shader
     */
    constructor(gl, shader) {
        /** @type {WebGL2RenderingContext} */
        this.gl = gl;

        this.engine = new window.WASM.VoxelEngine(gl, shader.program);
        this.engine.init();

        this.vertexData = this.engine.get_bytes();
        this.vertexCount = this.vertexData.length;

        this.shader = shader;
        gl.useProgram(shader.program);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.buffer = this.setupBuffer(shader.program, "voxelData", this.vertexData, 1, gl.UNSIGNED_INT);
    }

    /**
     * 
     * @param {WebGLProgram} program 
     * @param {String} attribName 
     * @param {Float32Array} data 
     * @param {Number} size
     * @param {Number} type
     */
    setupBuffer(program, attribName, data, size, type) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, attribName);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribIPointer(loc, size, type, 0, 0);

        return buffer;
    }
}