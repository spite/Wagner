varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec2 distance;

void main() {

	vec4 c1 = texture2D( tDiffuse, vUv - distance );
	vec4 c2 = texture2D( tDiffuse, vUv );
	vec4 c3 = texture2D( tDiffuse, vUv + distance );
	
	gl_FragColor = vec4( c1.r, c2.g, c3.b, c1.a + c2.a + c3.b );
	
}
