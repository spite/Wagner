varying vec2 vUv;
uniform sampler2D tDiffuse;

void main() {

	gl_FragColor = texture2D( tDiffuse, vUv );
	gl_FragColor.rgb = 1. - gl_FragColor.rgb;

}