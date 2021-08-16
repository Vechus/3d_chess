#version 300 es

//ATTRIBUTES

in vec3 a_position; //
in vec3 a_normal;   //
in vec2 a_uv;

//OUT

out vec3 fsNormal;
out vec3 fsPosition;
out vec2 uvFS;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_nMatrix;

void main() {
  gl_Position = u_projection * u_view * u_world * vec4(a_position, 1.0);

  //Normals are transformed by means of the inverse transpose transformation matrix
  fsNormal = mat3(u_nMatrix) * a_normal;

  fsPosition = (u_world * vec4(a_position, 1.0)).xyz;

  uvFS = a_uv; //pass this to the fragment shader
}