class VoxelEngine {
    constructor(graphicsEngine) {
        /** @type {WebGL2RenderingContext} */
        const gl = graphicsEngine.gl;
        this.voxelShader = new Shader(
            gl,
            graphicsEngine.compileShader(gl.VERTEX_SHADER, VERT_VOXEL_SHADER),
            graphicsEngine.compileShader(gl.FRAGMENT_SHADER, FRAG_VOXEL_SHADER)
        )

        this.chunks = new Map();
        this.chunks.set(new VoxelChunk(gl, [0, 0]));
    }
}

class VoxelChunk {
    constructor(origin) {
        this.origin = origin;
        this.vertexBuffer = new Uint32Array();

        this.voxels = []
        for (let x = 0; x < 32; x++) {
            this.voxels[x] = [];
            for (let y = 0; y < 32; y++) {
                this.voxels[x][y] = 0;
                if (y < 1) {
                    if (x < 10)
                        this.voxels[x][y] = 1;
                    else
                        this.voxels[x][y] = 2;
                }
            }
        }
    }
}

function packVoxel(x, y, z, face, tex) {
    return (
        (x & 31) |
        ((y & 31) << 5) |
        ((z & 31) << 10) |
        ((face & 7) << 15) |
        ((tex & 31) << 18)
    ) >>> 0;
}