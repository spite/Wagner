varying vec2 vUv;
uniform sampler2D tInput;
uniform vec2 resolution;

void main() {

	vec3 luma = vec3( .213, .715, .072 );
	vec4 color = texture2D( tInput, vUv );
	gl_FragColor = vec4( vec3( dot( color.rgb, luma ) ), color.a );

}
