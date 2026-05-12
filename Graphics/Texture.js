/**
 * @param {WebGL2RenderingContext} gl 
 * @param {Array} urls 
 * @param {Number} width 
 * @param {Number} height 
 * @param {Number} layers 
 * @returns 
 */
function setupTextures(gl) {
    const textures = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, textures);

    const images = window.blockTextures;
    const width = window.bTexWidth;
    const height = window.bTexHeight;
    const layers = images.length;

    gl.texImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        gl.RGBA8,
        width,
        height,
        layers,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );

    for (let i = 0; i < layers; i++) {
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, textures);
        gl.texSubImage3D(
            gl.TEXTURE_2D_ARRAY,
            0,
            0, 0, i,
            width,
            height,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            images[i]
        );
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    }

    return textures;
}