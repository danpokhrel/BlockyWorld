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
        this.shader.uploadTextures();

        const last = localStorage.getItem("renderDis");
        if (last != null) {
            document.getElementById("renderDisInput").value = last;
        }
        this.renderDistance = document.getElementById("renderDisInput").value;
        console.log(this.renderDistance);
        this.camPlanes = null;
        this.pauseCulling = false;

        this.chunks = new Map();
        this.buildChunks();
    }

    rayCast(mode, origin, direction) {
        let [cx, cy, cz] = [Math.floor(origin.x / 32), Math.floor(origin.y / 32), Math.floor(origin.z / 32)];
        let chunk = this.chunks.get(`${cx},${cy},${cz}`);
        let result = null;
        if (chunk != undefined) {
            result = chunk.rayCast(mode, origin, direction);
            if (result.x !== Number.MAX_SAFE_INTEGER) {
                return result; // hit
            }
        }

        // No hit in current chunk, try the next chunk in ray direction
        let chunkMin = { x: cx * 32, y: cy * 32, z: cz * 32 };
        let chunkMax = { x: (cx + 1) * 32, y: (cy + 1) * 32, z: (cz + 1) * 32 };

        let tx = direction.x !== 0 ? (direction.x > 0 ? (chunkMax.x - origin.x) / direction.x : (chunkMin.x - origin.x) / direction.x) : Infinity;
        let ty = direction.y !== 0 ? (direction.y > 0 ? (chunkMax.y - origin.y) / direction.y : (chunkMin.y - origin.y) / direction.y) : Infinity;
        let tz = direction.z !== 0 ? (direction.z > 0 ? (chunkMax.z - origin.z) / direction.z : (chunkMin.z - origin.z) / direction.z) : Infinity;

        let t_exit = Math.min(tx, ty, tz);
        if (t_exit === Infinity) {
            return { x: Infinity, y: Infinity, z: Infinity };
        }

        let new_origin = {
            x: origin.x + direction.x * t_exit,
            y: origin.y + direction.y * t_exit,
            z: origin.z + direction.z * t_exit
        };

        let [ncx, ncy, ncz] = [Math.floor(new_origin.x / 32), Math.floor(new_origin.y / 32), Math.floor(new_origin.z / 32)];
        let nextChunk = this.chunks.get(`${ncx},${ncy},${ncz}`);
        if (nextChunk != undefined) {
            result = nextChunk.rayCast(mode, origin, direction);
            if (result.x !== Number.MAX_SAFE_INTEGER) {
                return result;
            }
        }

        return { x: Infinity, y: Infinity, z: Infinity };
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

        async function doChunk(x, z) {
            for (let y = 0; y < 5; y++) {
                let [wx, wy, wz] = [x * 32, y * 32, z * 32];
                let chunk = t.chunks.get(`${x},${y},${z}`)
                if (chunk == undefined) {
                    chunk = new ChunkWrapper(t.gl, wx, wy, wz);
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