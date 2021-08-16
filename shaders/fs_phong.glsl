#version 300 es
precision mediump float;

in vec3 fsNormal; //from vertex shader
in vec3 fsPosition;
in vec2 uvFS; //from vertex shader

uniform float specularShine;		// specular coefficient for both Blinn and Phong
uniform vec4 diffColor;		    // diffuse color
uniform vec4 ambColor;		    // material ambient color
uniform vec4 specularColor;		// specular color
uniform vec4 emit;			    // emitted color

uniform vec3 eyePosition;		    // looking direction
uniform vec3 lightDirectionVector;
uniform vec4 lightColor;
uniform vec4 ambientLight;

uniform sampler2D u_texture;
uniform bool hasTexture;

out vec4 outColor;

vec4 lambertDiffuse(vec3 normal, vec3 lightDirection, vec4 lightColor) {
    return lightColor * clamp(dot(normal, lightDirection), 0.0, 1.0);
}


void main() {

    vec3 normal = normalize(fsNormal);

    // AMBIENT //
    vec4 ambientCo = ambientLight * ambColor;

    vec3 eyeDir = normalize(eyePosition - fsPosition);

    // PHONG SPECULAR //
    vec3 reflA = -reflect(lightDirectionVector, normal);
    float LRA = max(dot(reflA, eyeDir), 0.0);
    vec4 specularPhongA = clamp(specularColor * pow(LRA, specularShine), 0.0, 1.0);
    vec4 phongSpecular = lightColor * specularPhongA;

    //DIFFUSE
    vec4 diffContrA = diffColor * lambertDiffuse(normal, lightDirectionVector, lightColor);
    vec4 diffuse = diffContrA;

    //with EMISSION (emit)

    vec4 preOut = (ambientCo + phongSpecular + diffuse + emit);
    if(hasTexture == true) {
        preOut = preOut * texture(u_texture, uvFS); //todo at least nmap
    }


    outColor = clamp( preOut, 0.0, 1.0);
}
