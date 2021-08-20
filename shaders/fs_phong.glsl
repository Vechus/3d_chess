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

uniform vec3 spotLightPosition;
uniform vec3 spotLightDirection;
uniform vec4 spotLightColor;
uniform float spotLightDecay;
uniform float cIN, cOUT;

uniform sampler2D u_texture;
uniform sampler2D u_normalMap;

uniform bool hasTexture;

out vec4 outColor;

// SHADING //

/* compute lambert for a single light source with a color and a direction */
vec4 lambertDiffuse(vec3 normal, vec3 lightDirection, vec4 lightColor) {
    return lightColor * clamp(dot(normal, lightDirection), 0.0, 1.0);
}
/* computes light direction given light position and point position in 3d pace*/
vec3 spotLightComputeDirection(vec3 lightPosition, vec3 pointPosition) {
    return normalize(lightPosition - pointPosition);
}
vec4 spotLightComputeColor(vec3 Pos, vec3 fs_pos, float targetDistance, float Decay, float ConeIn, float ConeOut, vec3 Dir) {
    vec3 lightDir =  normalize(Pos - fs_pos); //light direction is computed as the same as for point light
    vec4 lightColor = spotLightColor * pow( ( (targetDistance) / length(Pos - fs_pos) ) , Decay) * clamp(

    (   (dot(normalize(Pos - fs_pos), Dir)   - cos(radians(ConeOut/2.0)) ) / (  cos(radians(ConeIn/2.0))  - cos(radians(ConeOut/2.0))  )
    ) //value to be clamped

    , 0.0, 1.0); //clamp

    return lightColor;
}

vec4 computePhong(vec3 currentLightDirection, vec3 normalVec3, vec3 eyeDirVec3) {
    vec3 refl = -reflect(currentLightDirection, normalVec3);
    float LRA = max(dot(refl, eyeDirVec3), 0.0);
    return clamp(specularColor * pow(LRA, specularShine), 0.0, 1.0);
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

    float tgtDistance = distance(spotLightPosition, fsPosition);
    vec4 spotLightColorIntensity = spotLightComputeColor(spotLightPosition, fsPosition, tgtDistance, spotLightDecay, cIN, cOUT, spotLightDirection);
    // AMBIENT //
    vec4 ambientCo = ambientLight * ambColor;

    vec3 eyeDir = normalize(eyePosition - fsPosition);

    // PHONG SPECULAR //

    vec4 specularPhongDLight = computePhong(lightDirectionVector, normal, eyeDir);
    vec4 specularPhongSLight = computePhong(spotLightDirection, normal, eyeDir);
    vec4 phongSpecular = lightColor * specularPhongDLight
    + spotLightColor * specularPhongSLight * spotLightColorIntensity;

    //DIFFUSE
    vec4 diffContrDLight = diffColor * lambertDiffuse(normal, lightDirectionVector, lightColor);


    vec4 diffContrSpot = diffColor * lambertDiffuse(normal,
                         spotLightDirection,spotLightColorIntensity
                         );

    vec4 diffuse = diffContrDLight + diffContrSpot;

    //with EMISSION (emit)

    vec4 preOut = (ambientCo + phongSpecular + diffuse + emit);
    if(hasTexture == true) {
        preOut = preOut * texture(u_texture, uvFS);
    }


    outColor = clamp( preOut, 0.0, 1.0); //no HDR
}
