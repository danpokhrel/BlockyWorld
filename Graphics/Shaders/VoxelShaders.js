//------------------Vertex Shader------------------
const VERT_VOXEL_SHADER = /*glsl*/`#version 300 es

layout(std140) uniform Camera {
    mat4 cameraMat;
};

layout(std140) uniform Chunk {
    mat4 modelMat;
};

// Packed Bytes
in uint voxelData;

flat out uint vTexIndex;

out vec2 vUV;
out vec3 vNormal;
out float vAO;

/**
 * bits  0–5   = x (6 bits)
 * bits  6–11   = y (6 bits)
 * bits 12–17  = z (6 bits)
 * bits 18–20  = face direction (3 bits)
 * bits 21–25  = texture index (5 bits)
 * bits 26–27  = ambient occlusion (2 bits)
 * bits 28–31  = unused / future (4 bits)
 */
void decode(uint d, out vec3 pos, out uint face, out uint tex, out uint ao) {
    pos = vec3(
        float(d & 63u),
        float((d >> 6u) & 63u),
        float((d >> 12u) & 63u)
    );

    face = (d >> 18u) & 7u;
    tex  = (d >> 21u) & 31u;
    ao = (d >> 26u) & 3u;
}

vec2 uvLUT[6] = vec2[6](
    vec2(1,1),
    vec2(1,0),
    vec2(0,1),
    vec2(0,1),
    vec2(1,0),
    vec2(0,0)
);

vec2 getVertexUV(uint vertexIdx, uint face) {
    uint idx = vertexIdx % 6u;
    return uvLUT[idx];
}

/* ---------------------------
   3x2 texture atlas mapping
   Layout:
   Top   Front  Right
   Bottom Back   Left
----------------------------*/
vec2 getAtlasOffset(uint face) {
    if (face == 0u) return vec2(2.0, 1.0); // +X (Left)
    if (face == 1u) return vec2(2.0, 0.0); // -X (Right)
    if (face == 2u) return vec2(0.0, 0.0); // +Y (Top)
    if (face == 3u) return vec2(0.0, 1.0); // -Y (Bottom)
    if (face == 4u) return vec2(1.0, 0.0); // +Z (Front)
    return vec2(1.0, 1.0);                 // -Z (Back)
}

vec2 getFaceUV(uint face, vec2 uv) {
    vec2 tileSize = vec2(1.0 / 3.0, 1.0 / 2.0);

    vec2 offset = getAtlasOffset(face);

    return offset * tileSize + uv * tileSize;
}

vec3 getFaceNorm(uint face) {
    if (face == 0u) return vec3(1.0, 0.0, 0.0); // +X (Left)
    if (face == 1u) return vec3(-1.0, 0.0, 0.0); // -X (Right)
    if (face == 2u) return vec3(0.0, 1.0, 0.0); // +Y (Top)
    if (face == 3u) return vec3(0.0, -1.0, 0.0); // -Y (Bottom)
    if (face == 4u) return vec3(0.0, 0.0, 1.0); // +Z (Front)
    return vec3(0.0, 0.0, -1.0);                 // -Z (Back)
}

void main() {
    vec3 position;
    uint face;
    uint tex;
    uint ao;

    decode(voxelData, position, face, tex, ao);

    vTexIndex = tex;
    vAO = (float(ao)/3.0) * 0.8;

    vec2 uv = getVertexUV(uint(gl_VertexID), face);
    vUV = getFaceUV(face, uv);

    vNormal = getFaceNorm(face);

    gl_Position = cameraMat * modelMat * vec4(position, 1.0);
}

`
//------------------Fragment Shader------------------
const FRAG_VOXEL_SHADER = /*glsl*/`#version 300 es
precision mediump float;
precision mediump sampler2DArray;

uniform sampler2DArray textureArray;
flat in uint vTexIndex;

in vec2 vUV;
in vec3 vNormal;
in float vAO;

out vec4 outColor;

vec3 lightDir = normalize(vec3(1.0, 1.0, 0.0));

void main(){
    outColor = texture(textureArray, vec3(vUV, float(vTexIndex)));
    float shadow = dot(vNormal, lightDir)*0.5 + 0.6;
    outColor = vec4(outColor.rg * shadow, outColor.b * (shadow * 0.8 + 0.2), outColor.a);

    outColor.rgb *= 1.0-vAO;

    vec3 color = outColor.rgb;
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    float fogFactor = exp(-0.001 * depth);
    vec3 fogColor = vec3(0.2, 0.5, 1.0);
    color = mix(fogColor, color, fogFactor);
    outColor.rgb = color;
}

`