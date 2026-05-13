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
        this.camera.position = { x: 0, y: 65, z: 0 };
        this.camera.forwardVec = normalize({ x: 1, y: 0, z: -1 });
        this.updateCanvas();
    }

    tick() {
        let pos = this.engine.voxelEngine.rayCast(-1, this.camera.position, this.camera.forwardVec);
        this.engine.obj.modelMat.setTranslate(pos.x, pos.y, pos.z);
    }

    updateCanvas() {
        this.engine.resizeCanvas();
        this.camera.updateMats();
    }

    getPosition() {
        let x = this.camera.position.x.toFixed(0);
        let y = this.camera.position.y.toFixed(0);
        let z = this.camera.position.z.toFixed(0);
        return { x: x, y: y, z: z };
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

    updateRenderDis(d) {
        this.engine.voxelEngine.updateRenderDis(d);
    }

    pauseFrustum(isChecked) {
        this.engine.voxelEngine.pauseCulling = isChecked;
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