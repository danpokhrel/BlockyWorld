class Camera {
    constructor() {
        /** @type {HTMLCanvasElement} */
        this.canvas = document.getElementById("canvas");

        this.transform = new Matrix4();
        this.projMat = new Matrix4();

        this.position = { x: 0, y: 0, z: 0 };
        this.forwardVec = normalize({ x: 0, y: 0, z: 1 });
        this.fov = 45;

        this.rotateCamera(0, -0.2);
    }

    updateMats() {
        this.projMat.setPerspective(this.fov, (this.canvas.width / this.canvas.height), 0.1, 5000);
        const lookPoint = { x: this.forwardVec.x + this.position.x, y: this.forwardVec.y + this.position.y, z: this.forwardVec.z + this.position.z };
        this.transform.setLookAt(this.position.x, this.position.y, this.position.z, lookPoint.x, lookPoint.y, lookPoint.z, 0, 1, 0);
    }

    rotateCamera(yawDelta, pitchDelta) {
        const worldUp = { x: 0, y: 1, z: 0 };
        // --- YAW (rotate around world up)
        this.forwardVec = rotateAxis(this.forwardVec, worldUp, yawDelta);
        // recompute right axis after yaw
        const right = normalize(cross(this.forwardVec, worldUp));
        // --- PITCH (rotate around camera right axis)
        this.forwardVec = rotateAxis(this.forwardVec, right, pitchDelta);
        // keep direction normalized
        this.forwardVec = normalize(this.forwardVec);

        this.updateMats();
    }

    moveCamera(x, y, z) {
        let forward = this.forwardVec;
        const worldUp = { x: 0, y: 1, z: 0 };
        let right = normalize(cross(forward, worldUp));
        let up = cross(right, forward);

        forward = mult(forward, z);
        right = mult(right, -x);
        up = mult(up, y);

        this.position = add(this.position, forward);
        this.position = add(this.position, right);
        this.position = add(this.position, up);

        this.updateMats();
    }
}

function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function mult(v, s) {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function normalize(v) {
    const len = Math.hypot(v.x, v.y, v.z);
    return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

function rotateAxis(v, axis, angle) {
    const { x, y, z } = v;
    const u = normalize(axis);
    const [ux, uy, uz] = [u.x, u.y, u.z];

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const dot = x * ux + y * uy + z * uz;

    return {
        x: ux * dot * (1 - cos) + x * cos + (-uz * y + uy * z) * sin,
        y: uy * dot * (1 - cos) + y * cos + (uz * x - ux * z) * sin,
        z: uz * dot * (1 - cos) + z * cos + (-uy * x + ux * y) * sin
    };
}