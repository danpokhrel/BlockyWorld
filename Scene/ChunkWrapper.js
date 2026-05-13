// Uniform Buffer Object Binding Point
const UBO_POINT = 1;

class ChunkWrapper {
    /**
     * @param {WebGL2RenderingContext} gl 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} z 
     */
    constructor(gl, x, y, z) {
        // Rust Chunk Object
        this.chunk = new window.WASM.VoxelChunk(x, y, z);
        this.pos = { x: x, y: y, z: z };
        this.bounds = { x: x + 32, y: y + 32, z: z + 32 };

        // WebGL Objects
        this.gl = gl;
        this.vao = gl.createVertexArray();
        this.ubo = gl.createBuffer();
    }

    generateVoxels() {
        this.chunk.init();
        this.chunk.generate();
    }

    generateMesh() {
        this.chunk.generate_mesh();
        if (this.chunk.is_empty()) {
            this.chunk.free();
        }
    }

    clean() {
        this.chunk.free();
    }

    isEmpty() {
        return this.chunk.is_empty();
    }

    vertCount() {
        return this.chunk.get_vert_len();
    }

    rayCast(mode, origin, direction) {
        let [idx, x, y, z] = this.chunk.ray_cast(mode, origin.x, origin.y, origin.z, direction.x, direction.y, direction.z);
        x += this.pos.x;
        y += this.pos.y;
        z += this.pos.z;

        //if (idx > 0) this.chunk.generate_mesh();

        return { x: x, y: y, z: z };
    }

    /**
     * @param {WebGLProgram} program 
     */
    uploadBuffers(program) {
        if (this.isEmpty()) return;
        const gl = this.gl;

        // VAO
        gl.useProgram(program);
        gl.bindVertexArray(this.vao);
        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.chunk.get_buffer(), gl.STATIC_DRAW);
        let loc = gl.getAttribLocation(program, "voxelData");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribIPointer(loc, 1, gl.UNSIGNED_INT, 0, 0);

        // UBO
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.ubo);
        let uboIndex = gl.getUniformBlockIndex(program, "Chunk");
        let uboSize = this.gl.getActiveUniformBlockParameter(program, uboIndex, this.gl.UNIFORM_BLOCK_DATA_SIZE);
        gl.bufferData(gl.UNIFORM_BUFFER, uboSize, gl.STATIC_DRAW);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, UBO_POINT, this.ubo);
        let mat = new Matrix4();
        mat.setTranslate(this.pos.x, this.pos.y, this.pos.z);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, mat.elements);
    }
}