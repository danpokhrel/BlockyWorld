class RenderObject {
    constructor(mesh) {
        this.shader = mesh.shader;
        this.mesh = mesh;
        this.modelMat = new Matrix4();
        this.xyz = [0, 0, 0];
    }
}