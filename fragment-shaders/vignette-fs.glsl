uniform sampler2D tDiffuse;
uniform float size;
uniform float amount;
varying vec2 vUv;

void main() {

    vec4 color = texture2D(tDiffuse, vUv);
    
    float dist = distance(vUv, vec2(0.5, 0.5));
    color.rgb *= smoothstep(0.8, size * 0.799, dist * (amount + size));
    
    gl_FragColor = color;

}