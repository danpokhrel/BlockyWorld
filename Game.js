class Game {
    constructor(tickCallback) {
        const engine = new GraphicsEngine();
        const camera = new Camera();
        const game = this;
        this.engine = engine;
        this.camera = camera;
        this.tickCallback = tickCallback;

        let frameTimes = [];
        let renderTimes = [];
        let lastTime = performance.now();
        const frameLabel = document.getElementById("FrameInfo");
        const posLabel = document.getElementById("PositionInfo");
        const AVG_OVER = 100;

        this.setup();

        requestAnimationFrame(_tick);
        function _tick() {
            //-------- Frame Timing --------//
            const now = performance.now();
            const deltaTime = now - lastTime;
            lastTime = now;
            frameTimes.push(deltaTime);
            if (frameTimes.length > AVG_OVER) { frameTimes.shift(); }

            //-------- Event Tick --------//
            tickCallback(deltaTime);
            game.tick();

            //-------- Render --------//
            engine.draw(camera.transform, camera.projMat);

            //-------- Frame Timing --------//
            renderTimes.push(performance.now() - now);
            if (renderTimes.length > AVG_OVER) { renderTimes.shift(); }
            const fps = 1000 / average(frameTimes);
            const renderTime = average(frameTimes);
            frameLabel.innerHTML = "ms: " + renderTime.toFixed(1) + " fps: " + fps.toFixed(0);

            requestAnimationFrame(_tick);
        }
    }

    setup() {
        this.camera.position = { x: -100, y: 60, z: -100 };
        this.camera.forwardVec = normalize({ x: 1, y: 0, z: 1 });
        this.updateCanvas();

        const engine = this.engine;
        return;

        const shader = new Shader(
            engine.gl,
            engine.compileShader(engine.gl.VERTEX_SHADER, VERT_VOXEL_SHADER),
            engine.compileShader(engine.gl.FRAGMENT_SHADER, FRAG_VOXEL_SHADER)
        );

        const mesh = new VoxelMesh(engine.gl, shader);

        const obj = new RenderObject(mesh);
        engine.renderObjects.push(obj);
    }

    tick() {

    }

    updateCanvas() {
        this.engine.resizeCanvas();
        this.camera.updateMats();
    }

    /**
     * @param {Number} yaw 
     * @param {Number} pitch 
     */
    mouseMove(yaw, pitch) {
        this.camera.rotateCamera(yaw, pitch);
    }

    /**
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} z 
     */
    keyMove(x, y, z) {
        this.camera.moveCamera(x, y, z);
    }

    updateWireframe(isChecked) {
        this.engine.wireFrame = isChecked;
    }
}

function average(array) {
    let total = 0;
    let i = 0;
    for (const x of array) {
        total += x;
        i++;
    }
    return total / i;
}