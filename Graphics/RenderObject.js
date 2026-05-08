class RenderObject {
    constructor(mesh) {
        this.shader = mesh.shader;
        this.mesh = mesh;
        this.modelMat = new Matrix4();
    }
}