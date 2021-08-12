#version 300 es
precision highp float;

in vec3 fsNormal;


uniform float specularShine;		// specular coefficient for both Blinn and Phong
uniform vec4 diffColor;		    // diffuse color
uniform vec4 ambColor;		    // material ambient color
uniform vec4 specularColor;		// specular color
uniform vec4 emit;			    // emitted color

uniform vec3 eyedirVec;		    // looking direction
uniform vec3 lightDirectionVector;
uniform vec4 lightColor;
uniform vec4 ambientLight;

out vec4 outColor;

void main() {

    vec3 normal = normalize(fsNormal);

    // AMBIENT //
    vec4 ambientCo = ambientLight * ambColor;

    vec3 eyeDirNorm = normalize(eyedirVec);
    // PHONG SPECULAR //
    vec3 reflA = -reflect(lightDirectionVector, normal);
    float LRA = max(dot(reflA, eyeDirNorm), 0.0);
    vec4 specularPhongA = specularColor * pow(LRA, specularShine);
    vec4 phongSpecular = lightColor * specularPhongA;

    //DIFFUSE
    vec4 diffContrA = diffColor  * dot(lightDirectionVector, normal) * lightColor;
    vec4 diffuse = diffContrA;
    //with EMISSION (emit)
    outColor = clamp( ambientCo + phongSpecular + diffuse + emit, 0.0, 1.0);
}
