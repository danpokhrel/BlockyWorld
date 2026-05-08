//------------------Vertex Shader------------------
const VERT_SHADER_CODE = /*glsl*/`#version 300 es

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

in vec3 position;
in vec2 uv;
//in vec3 normal;

//out vec3 vNormal;

void main() {
    //vNormal = normal;
    gl_Position = projection * view * model * vec4(position, 1.0);
}

`
//------------------Fragment Shader------------------
const FRAG_SHADER_CODE = /*glsl*/`#version 300 es
precision highp float;

//in vec3 vNormal;

out vec4 outColor;

void main(){
    outColor = vec4(1, 1, 1, 1);
}

`