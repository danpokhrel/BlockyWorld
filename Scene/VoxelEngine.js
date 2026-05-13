const BATCH_SIZE = 5;

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
        this.renderDistance = Number(document.getElementById("renderDisInput").value) || 0;
        this.camPlanes = null;
        this.pauseCulling = false;
        this.centerChunk = { x: 0, y: 0, z: 0 };

        this.chunks = new Map();
        this.buildMutex = false;
        this.buildChunks();
    }

    rayCast(mode, origin, direction) {
        let [cx, cy, cz] = [Math.floor(origin.x / 32), Math.floor(origin.y / 32), Math.floor(origin.z / 32)];
        for (let i = 0; i < 3; i++) {
            let chunk = this.chunks.get(`${cx},${cy},${cz}`);

            if (chunk != undefined) {
                let result = chunk.rayCast(mode, origin, direction);
                if (result.idx > 0) {
                    if (result.status > 0) {
                        this._propagatePaddingUpdate(chunk, result, mode, origin, direction, new Set());
                    }
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

            let [nx, ny, nz] = [
                origin.x + direction.x * t_exit,
                origin.y + direction.y * t_exit,
                origin.z + direction.z * t_exit
            ];
            // Move slightly into the next chunk to avoid boundary issues
            nx += direction.x * 0.001;
            ny += direction.y * 0.001;
            nz += direction.z * 0.001;
            cx = Math.floor(nx / 32);
            cy = Math.floor(ny / 32);
            cz = Math.floor(nz / 32);
            origin = { x: nx, y: ny, z: nz };
        }

        return { x: Infinity, y: Infinity, z: Infinity };
    }

    _propagatePaddingUpdate(chunk, result, mode, origin, direction, visited) {
        if (mode < 0 || result.status === 0) {
            return;
        }

        const chunkKey = `${Math.floor(chunk.pos.x / 32)},${Math.floor(chunk.pos.y / 32)},${Math.floor(chunk.pos.z / 32)}`;
        if (visited.has(chunkKey)) {
            return;
        }
        visited.add(chunkKey);

        const modifiedLocal = {
            x: result.modifiedLocalX,
            y: result.modifiedLocalY,
            z: result.modifiedLocalZ,
        };

        const baseCoords = {
            x: Math.floor(chunk.pos.x / 32),
            y: Math.floor(chunk.pos.y / 32),
            z: Math.floor(chunk.pos.z / 32),
        };

        const offsets = {
            x: [0],
            y: [0],
            z: [0],
        };

        if (result.status === 2) {
            if (modifiedLocal.x === 0) offsets.x = [-1];
            else if (modifiedLocal.x === 33) offsets.x = [1];
            if (modifiedLocal.y === 0) offsets.y = [-1];
            else if (modifiedLocal.y === 33) offsets.y = [1];
            if (modifiedLocal.z === 0) offsets.z = [-1];
            else if (modifiedLocal.z === 33) offsets.z = [1];
        } else {
            if (modifiedLocal.x === 1) offsets.x = [0, -1];
            else if (modifiedLocal.x === 32) offsets.x = [0, 1];
            if (modifiedLocal.y === 1) offsets.y = [0, -1];
            else if (modifiedLocal.y === 32) offsets.y = [0, 1];
            if (modifiedLocal.z === 1) offsets.z = [0, -1];
            else if (modifiedLocal.z === 32) offsets.z = [0, 1];
        }

        for (const dx of offsets.x) {
            for (const dy of offsets.y) {
                for (const dz of offsets.z) {
                    if (dx === 0 && dy === 0 && dz === 0) {
                        continue;
                    }

                    const neighborKey = `${baseCoords.x + dx},${baseCoords.y + dy},${baseCoords.z + dz}`;
                    if (visited.has(neighborKey)) {
                        continue;
                    }

                    const neighborChunk = this.chunks.get(neighborKey);
                    if (!neighborChunk) {
                        continue;
                    }

                    const neighborResult = neighborChunk.rayCast(mode, origin, direction);
                    if (neighborResult.idx > 0 && neighborResult.status > 0) {
                        this._propagatePaddingUpdate(neighborChunk, neighborResult, mode, origin, direction, visited);
                    }
                }
            }
        }
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
            // clean chunks
            for (const chunk of this.chunks.values()) {
                let dis = d * 32;
                const x = chunk.pos.x;
                const z = chunk.pos.z;
                if (x * x + z * z > dis * dis) {
                    chunk.clean();
                }
            }
        }

        this.renderDistance = Number(d) || 0;
        if (dirty)
            this.buildChunks();
    }

    async buildChunks() {
        while (this.camPlanes == null || this.buildMutex) {
            await this.yield();
        }
        this.buildMutex = true; // prevent multiple builds happening at the same time
        const t = this;
        let i = 0

        const center = this.centerChunk;
        let r = Number(this.renderDistance) || 0;
        const cells = [];

        for (let z = center.z - r; z <= center.z + r; z++) {
            for (let x = center.x - r; x <= center.x + r; x++) {
                let dx = x - center.x;
                let dz = z - center.z;
                let dist2 = dx * dx + dz * dz;
                if (dist2 > r * r) { continue; }

                // bias generation toward chunks that are within view
                if (this.camPlanes != null) {
                    if (isBoxInFrustum(
                        this.camPlanes,
                        { x: x * 32, y: 0, z: z * 32 },
                        { x: (x + 1) * 32, y: 200, z: (z + 1) * 32 },
                    )) {
                        dist2 /= 2;
                    } else {
                        dist2 *= 2;
                    }
                }

                cells.push([dist2, x, z]);
            }
        }

        cells.sort((a, b) => a[0] - b[0]);

        for (const [, x, z] of cells) {
            await doChunk(x, z);
        }

        async function doChunk(x, z) {
            for (let y = 0; y < 7; y++) {
                let [wx, wy, wz] = [x * 32, y * 32, z * 32];
                let chunk = t.chunks.get(`${x},${y},${z}`)
                if (chunk == undefined) {
                    chunk = new ChunkWrapper(t.gl, wx, wy, wz);
                    t.chunks.set(`${x},${y},${z}`, chunk);
                    t.processChunk(chunk);
                }

                //t.processChunk(chunk);
                i++;
                if (i > BATCH_SIZE) {
                    i = 0;
                    await t.yield();
                }
            }
        }

        this.buildMutex = false;
    }

    async updateCenter(worldPos) {
        const cx = Math.floor(worldPos.x / 32);
        const cy = Math.floor(worldPos.y / 32);
        const cz = Math.floor(worldPos.z / 32);

        if (cx !== this.centerChunk.x || cy !== this.centerChunk.y || cz !== this.centerChunk.z) {
            this.centerChunk = { x: cx, y: cy, z: cz };

            while (performance.now() - this.lastBuildTime < 1000) {
                await this.yield();
            }
            this.buildChunks();
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