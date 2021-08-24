#version 300 es

in vec3 in_position;

out vec3 sampleDir;

void main() {
    // Multiply the position by the matrix.
    gl_Position = vec4(in_position,1.0);

    // Pass a normal. Since the positions are
    // centered around the origin we can just
    // pass the position
    sampleDir = in_position;
}