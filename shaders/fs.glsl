#version 300 es
precision highp float;

in vec3 fsNormal;

uniform vec4 u_diffuse;
uniform vec3 u_lightDirection;

out vec4 outColor;

const float ambient = .05;

void main () {
  vec3 normal = normalize(fsNormal);
  float fakeLight = dot(u_lightDirection, normal) * .5 + ambient;
  vec4 diffuse = u_diffuse; //missing *v_color
  outColor = vec4(diffuse.rgb * fakeLight, diffuse.a);
}