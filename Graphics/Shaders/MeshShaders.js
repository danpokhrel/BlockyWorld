//------------------Vertex Shader------------------
const VERT_SHADER_CODE = /*glsl*/`#version 300 es

layout(std140) uniform MeshCamera {
    mat4 cameraMat;
};

layout(std140) uniform Model {
    mat4 model;
};

in vec3 position;
in vec3 normal;

out vec3 vNormal;

void main() {
    vNormal = normal;
    gl_Position = cameraMat * model * vec4(position, 1.0);
}

`
//------------------Fragment Shader------------------
const FRAG_SHADER_CODE = /*glsl*/`#version 300 es
precision highp float;

in vec3 vNormal;

out vec4 outColor;

vec3 lightDir = normalize(vec3(1.0, 1.0, 0.0));

void main(){
    outColor = vec4(0.6, 0.6, 0.6, 1);
    float shadow = dot(vNormal, lightDir)*0.5 + 0.6;
    outColor = vec4(outColor.rg * shadow, outColor.b * (shadow * 0.8 + 0.2), outColor.a);
}

`