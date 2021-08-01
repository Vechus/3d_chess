#version 300 es

in vec4 a_position; //
in vec3 a_normal;   //
out vec3 fsNormal;

uniform mat4 u_projection; //
uniform mat4 u_view; //
uniform mat4 u_world;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;
  fsNormal = mat3(u_world) * a_normal;
}