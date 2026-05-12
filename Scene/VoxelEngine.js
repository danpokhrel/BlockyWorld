const BATCH_SIZE = 10;

class VoxelEngine {
    /**
     * @param {GraphicsEngine} graphics 
     */
    constructor(graphics) {
        this.gl = graphics.gl;
        this.shader = new Shader(
            this.gl,
            graphics.compileShader(this.gl.VERTEX_SHADER, VERT_VOXEL_SHADER),
            graphics.compileShader(this.gl.FRAGMENT_SHADER, FRAG_VOXEL_SHADER)
        );

        this.renderDistance = document.getElementById("renderDisInput").value;
        this.camPlanes = null;
        this.pauseCulling = false;

        this.chunks = new Map();
        this.buildChunks();
    }

    drawVoxels(viewMat, projMat, renderType) {
        this.gl.useProgram(this.shader.program);
        let mat = this.shader.uploadCameraUBO(viewMat, projMat);

        if (this.camPlanes == null || !this.pauseCulling) {
            this.camPlanes = extractFrustumPlanes(mat.elements);
        }

        for (const chunk of this.chunks.values()) {
            if (chunk.isEmpty()) continue;
            if (!isBoxInFrustum(this.camPlanes, chunk.pos, chunk.bounds)) continue;

            this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, UBO_POINT, chunk.ubo);
            this.gl.bindVertexArray(chunk.vao);
            this.gl.drawArrays(renderType, 0, chunk.vertCount());
        }
    }

    async updateRenderDis(d) {
        let dirty = false;
        if (d > this.renderDistance) {
            dirty = true;
        } else if (d < this.renderDistance) {
            for (const chunk of this.chunks.values()) {
                let dis = d * 32;
                const x = chunk.pos.x;
                const z = chunk.pos.z;
                if (x * x + z * z > dis * dis) {
                    chunk.clean();
                }
            }
        }

        this.renderDistance = d;
        if (dirty)
            this.buildChunks();
    }

    async buildChunks() {
        const t = this;
        let i = 0
        let cx = 0, cz = 0;

        let r = this.renderDistance;
        const cells = [];

        for (let y = -r; y <= r; y++) {
            for (let x = -r; x <= r; x++) {
                const dist2 = x * x + y * y;
                if (dist2 > r * r) { continue; }

                cells.push([dist2, x, y]);
            }
        }

        cells.sort((a, b) => a[0] - b[0]);

        for (const [, x, z] of cells) {
            await doChunk(x, z);
        }
        return;

        // Chebyschev distance
        for (let r = 0; r <= 50; r++) {
            for (let x = -r; x <= r; x++) {
                await doChunk(cx + x, cz - r);
                if (r != 0) {
                    await doChunk(cx + x, cz + r);
                }
            }
            for (let z = -r + 1; z <= r - 1; z++) {
                await doChunk(cx - r, cz + z);
                if (r != 0) {
                    await doChunk(cx + r, cz + z);
                }
            }
        }

        async function doChunk(x, z) {
            for (let y = 0; y < 5; y++) {
                let chunk = t.chunks.get(`${x},${y},${z}`)
                if (chunk == undefined) {
                    chunk = new ChunkWrapper(t.gl, x * 32, y * 32, z * 32);
                    t.chunks.set(`${x},${y},${z}`, chunk);
                }

                t.processChunk(chunk);
                i++;
                if (i > BATCH_SIZE) {
                    i = 0;
                    await t.yield();
                }
            }
        }
    }

    async processChunk(chunk) {
        chunk.generateVoxels();
        chunk.generateMesh();
        chunk.uploadBuffers(this.shader.program);
    }

    yield() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }
}

function isBoxOutsidePlane(plane, min, max) {
    const x = plane.a >= 0 ? max.x : min.x;
    const y = plane.b >= 0 ? max.y : min.y;
    const z = plane.c >= 0 ? max.z : min.z;

    return plane.a * x + plane.b * y + plane.c * z + plane.d < 0;
}

function isBoxInFrustum(planes, min, max) {
    for (const p of planes) {
        if (isBoxOutsidePlane(p, min, max)) {
            return false;
        }
    }
    return true;
}

function normalizePlane(p) {
    const len = Math.hypot(p.a, p.b, p.c);
    return {
        a: p.a / len,
        b: p.b / len,
        c: p.c / len,
        d: p.d / len,
    };
}

function extractFrustumPlanes(m) {
    const planes = [];

    // Left  = 4th column + 1st column
    planes.push(createPlane(
        m[3] + m[0],
        m[7] + m[4],
        m[11] + m[8],
        m[15] + m[12]
    ));

    // Right = 4th column - 1st column
    planes.push(createPlane(
        m[3] - m[0],
        m[7] - m[4],
        m[11] - m[8],
        m[15] - m[12]
    ));

    // Bottom = 4th column + 2nd column
    planes.push(createPlane(
        m[3] + m[1],
        m[7] + m[5],
        m[11] + m[9],
        m[15] + m[13]
    ));

    // Top = 4th column - 2nd column
    planes.push(createPlane(
        m[3] - m[1],
        m[7] - m[5],
        m[11] - m[9],
        m[15] - m[13]
    ));

    // Near = 4th column + 3rd column
    planes.push(createPlane(
        m[3] + m[2],
        m[7] + m[6],
        m[11] + m[10],
        m[15] + m[14]
    ));

    // Far = 4th column - 3rd column
    planes.push(createPlane(
        m[3] - m[2],
        m[7] - m[6],
        m[11] - m[10],
        m[15] - m[14]
    ));

    return planes;
}

function createPlane(a, b, c, d) {
    const len = Math.hypot(a, b, c);
    return {
        a: a / len,
        b: b / len,
        c: c / len,
        d: d / len,
    };
}