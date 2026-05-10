async function main() {
    const game = new Game(tick);
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("canvas");

    var sensitivity = 0.002;
    var moveSpeed = 0.2;
    var moveKeys = { x: 0, y: 0, z: 0 };

    function tick(deltaTime) {
        game.keyMove(moveKeys.x * moveSpeed * deltaTime,
            moveKeys.y * moveSpeed * deltaTime,
            moveKeys.z * moveSpeed * deltaTime);
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
                moveKeys.z = 1;
                break;
            case "KeyA":
                moveKeys.x = 1;
                break;
            case "KeyS":
                moveKeys.z = -1;
                break;
            case "KeyD":
                moveKeys.x = -1;
                break;
            case "Space":
                moveKeys.y = 0.5;
                break;
            case "ShiftLeft":
                moveKeys.y = -0.5;
                break;
        };
    });
    document.addEventListener("keyup", (e) => {
        switch (e.code) {
            case "KeyW":
                moveKeys.z = 0;
                break;
            case "KeyA":
                moveKeys.x = 0;
                break;
            case "KeyS":
                moveKeys.z = 0;
                break;
            case "KeyD":
                moveKeys.x = 0;
                break;
            case "Space":
                moveKeys.y = 0;
                break;
            case "ShiftLeft":
                moveKeys.y = 0;
                break;
        };
    });

    const wireframeInput = document.getElementById("wireframe");
    wireframeInput.addEventListener("input", (e) => {
        game.updateWireframe(e.target.checked);
    })

    window.addEventListener("resize", () => {
        game.updateCanvas();
    });
}