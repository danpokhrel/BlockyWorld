//------------------Vertex Shader------------------
const VERT_SKY_SHADER = /*glsl*/`#version 300 es

out vec2 vUV;

vec2 verts[3] = vec2[](
    vec2(-1.0, -1.0),
    vec2(3.0, -1.0),
    vec2(-1.0, 3.0)
);

void main() {
    gl_Position = vec4(verts[gl_VertexID], 1.0, 1.0);
    vUV = verts[gl_VertexID];
}

`
//------------------Fragment Shader------------------
const FRAG_SKY_SHADER = /*glsl*/`#version 300 es
precision highp float;

layout(std140) uniform skyCam {
    mat4 cameraMat; // projection * view
};

in vec2 vUV;

out vec4 outColor;

vec3 skyGradient(float y) {
    vec3 topColor = vec3(0.2, 0.4, 0.8);
    vec3 horizonColor = vec3(0.8, 0.9, 1.0);
    return mix(horizonColor, topColor, pow(max(y, 0.0), 0.5));
}

void main() {

    vec4 clip = vec4(vUV, 1.0, 1.0);

    // world-space position on projected plane
    vec4 world = inverse(cameraMat) * clip;
    world /= world.w;

    // treat as ray direction (camera assumed at origin after unprojection)
    vec3 rayDir = normalize(world.xyz);

    float y = rayDir.y * 0.5 + 0.5;

    vec3 sky = skyGradient(y);

    outColor = vec4(sky, 1.0);
}

`