uniform sampler2D tDiffuse;
uniform float amount;
varying vec2 vUv;

float rand(vec2 co) {
	return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {

	vec4 color = texture2D(tDiffuse, vUv);
	
	float diff = (rand(vUv) - 0.5) * amount;
	color.r += diff;
	color.g += diff;
	color.b += diff;
	
	gl_FragColor = color;

}