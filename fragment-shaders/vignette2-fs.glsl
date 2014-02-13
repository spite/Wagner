varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec2 resolution;

#define VIG_REDUCTION_POWER 2.05
#define VIG_BOOST 2.1

void main() {

	vec4 color = texture2D( tDiffuse, vUv );

	vec2 center = resolution * 0.5;
	float vignette = distance( center, gl_FragCoord.xy ) / resolution.x;
    vignette = VIG_BOOST - vignette * VIG_REDUCTION_POWER;

    color.rgb *= vignette;
	gl_FragColor = color;

}