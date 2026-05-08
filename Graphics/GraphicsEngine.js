class GraphicsEngine {
    constructor() {
        /** @type {HTMLCanvasElement} */
        this.canvas = document.getElementById("canvas");
        /** @type {WebGL2RenderingContext} */
        this.gl = this.canvas.getContext("webgl2");
        if (!this.gl) { console.error("Webgl2 not supported."); }

        this.renderObjects = [];

        this.setGlStates(this.gl);
    }

    /**
     * @param {WebGL2RenderingContext} gl 
     */
    setGlStates(gl) {
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    /**
     * @param {Matrix4} viewMat 
     * @param {Matrix4} projMat 
     */
    draw(viewMat, projMat) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        for (const obj of this.renderObjects) {
            this.gl.useProgram(obj.shader.program);
            obj.shader.uploadCameraUniforms(viewMat, projMat);
            this.gl.bindVertexArray(obj.mesh.vao);
            //obj.shader.uploadModelUniforms(obj.modelMat);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, obj.mesh.vertexCount);
        }
    }

    /**
     * @param {String} vert 
     * @param {String} frag 
     */
    newShader(vert, frag) {
        vert = this.compileShader(this.gl.VERTEX_SHADER, vert);
        frag = this.compileShader(this.gl.FRAGMENT_SHADER, frag);
        const shader = new Shader(this.gl, vert, frag);
        return shader;
    }

    newMesh(shader, data) {
        return new Mesh(this.gl, shader, data);
    }

    /**
     * @param {GLenum} type 
     * @param {String} source 
     */
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
        }

        return shader;
    }

    resizeCanvas() {
        const ratio = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width * ratio));
        const height = Math.max(1, Math.round(rect.height * ratio));

        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }
}