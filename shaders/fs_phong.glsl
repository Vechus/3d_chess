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
uniform sampler2D u_normalMap;

uniform bool hasTexture;

out vec4 outColor;

// SHADING //
vec4 lambertDiffuse(vec3 normal, vec3 lightDirection, vec4 lightColor) {
    return lightColor * clamp(dot(normal, lightDirection), 0.0, 1.0);
}

//NORMALS

mat3 computeTBNMatrix(vec3 pos, vec2 uv, vec3 n_norm) {
    vec3 p_dx = dFdx(pos);
    vec3 p_dy = dFdy(pos);
    vec2 tc_dx = dFdx(uv);
    vec2 tc_dy = dFdy(uv);
    vec3 t = (tc_dy.y * p_dx - tc_dx.y * p_dy) / (tc_dx.x*tc_dy.y - tc_dy.x*tc_dx.y);
    t = normalize(t - n_norm * dot(n_norm, t));
    vec3 b = normalize(cross(n_norm,t));
    return mat3(t, b, n_norm);
}


vec3 lookupNormalMap() {

    // map to the right range -1 + 1

    // obtain normal from normal map in range [0,1]
    vec3 normalLookup = texture(u_normalMap, uvFS).rgb;
    vec3 m = normalize(normalLookup * 2.0 - 1.0);

    mat3 tbn = computeTBNMatrix(fsPosition, uvFS, normalize(fsNormal));
    return normalize(tbn * m);
}


void main() {

    vec3 X = dFdx(fsPosition);
    vec3 Y = dFdy(fsPosition);

    // introducing normal maps:

    //having a texture means having a normal map too
    vec3 normal = normalize(fsNormal);

    if(hasTexture == true) {
       normal =  lookupNormalMap();
    }

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
        preOut = preOut * texture(u_texture, uvFS);
    }


    outColor = clamp( preOut, 0.0, 1.0);
}
