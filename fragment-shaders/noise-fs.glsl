uniform sampler2D tDiffuse;
uniform float amount;
uniform float time;
varying vec2 vUv;

float random(vec3 scale,float seed){return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);}

void main() {

	vec4 color = texture2D(tDiffuse, vUv);

	color += amount * ( .5 - random( vec3( 1. ), length( gl_FragCoord ) ) );
	
	gl_FragColor = color;

}