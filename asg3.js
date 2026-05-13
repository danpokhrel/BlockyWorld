async function main() {
    const game = new Game(tick);
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("canvas");

    var sensitivity = 0.002;
    var moveSpeed = 0.05;
    var moveKeys = { w: false, a: false, s: false, d: false, up: false, down: false, q: false, e: false };

    const positionLabel = document.getElementById("PositionInfo");
    function tick(deltaTime) {
        let z = (moveKeys.w - moveKeys.s) * moveSpeed;
        let x = (moveKeys.a - moveKeys.d) * moveSpeed;
        let y = (moveKeys.up - moveKeys.down) * moveSpeed;
        game.keyMove(x * deltaTime, y * deltaTime, z * deltaTime);

        if (moveKeys.q || moveKeys.e) {
            game.mouseMove((moveKeys.q - moveKeys.e) * 0.5 * sensitivity * deltaTime, 0);
        }

        const pos = game.getPosition();
        positionLabel.innerHTML = `Position: x:${pos.x} y:${pos.y} z:${pos.z}`;
    }

    canvas.addEventListener("click", () => {
        // Locked mouse in game
        canvas.requestPointerLock();
    });
    canvas.addEventListener("mousemove", (e) => {
        // Mouse isn't locked in game
        if (document.pointerLockElement !== canvas) {
            return;
        }
        const yaw = -e.movementX * sensitivity;
        const pitch = -e.movementY * sensitivity;

        game.mouseMove(yaw, pitch);
    });
    document.addEventListener("keydown", (e) => {
        switch (e.code) {
            case "KeyW":
                moveKeys.w = true;
                break;
            case "KeyA":
                moveKeys.a = true;
                break;
            case "KeyS":
                moveKeys.s = true;
                break;
            case "KeyD":
                moveKeys.d = true;
                break;
            case "Space":
                moveKeys.up = true;
                break;
            case "ShiftLeft":
                moveKeys.down = true;
                break;
            case "KeyQ":
                moveKeys.q = true;
                break;
            case "KeyE":
                moveKeys.e = true;
                break;
        };
    });
    document.addEventListener("keyup", (e) => {
        switch (e.code) {
            case "KeyW":
                moveKeys.w = false;
                break;
            case "KeyA":
                moveKeys.a = false;
                break;
            case "KeyS":
                moveKeys.s = false;
                break;
            case "KeyD":
                moveKeys.d = false;
                break;
            case "Space":
                moveKeys.up = false;
                break;
            case "ShiftLeft":
                moveKeys.down = false;
                break;
            case "KeyQ":
                moveKeys.q = false;
                break;
            case "KeyE":
                moveKeys.e = false;
                break;
        };
    });

    const wireframeInput = document.getElementById("wireframe");
    wireframeInput.addEventListener("input", (e) => {
        game.updateWireframe(e.target.checked);
    })

    const pauseInput = document.getElementById("pauseCulling");
    pauseInput.addEventListener("input", (e) => {
        game.pauseFrustum(e.target.checked);
    })

    const senInput = document.getElementById("senInput");
    senInput.addEventListener("input", () => {
        sensitivity = senInput.value / 100 * 0.01;
    })

    const speedInput = document.getElementById("speedInput");
    speedInput.addEventListener("input", () => {
        moveSpeed = speedInput.value / 100 * 0.1;
    });


    const renderDisInput = document.getElementById("renderDisInput");
    const renderDisValue = document.getElementById("renderDisValue");
    updateRenderDisValue()
    renderDisInput.addEventListener("input", updateRenderDisValue);
    function updateRenderDisValue() {
        let dis = renderDisInput.value;
        renderDisValue.innerHTML = dis * 32;
        localStorage.setItem("renderDis", renderDisInput.value);
    }
    renderDisInput.addEventListener("mouseup", () => {
        game.updateRenderDis(renderDisInput.value);
    })

    window.addEventListener("resize", () => {
        game.updateCanvas();
    });
}