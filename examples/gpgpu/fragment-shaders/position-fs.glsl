varying vec2 vUv;

uniform float time;
uniform sampler2D tVel;
uniform sampler2D tPos;

void main( void ) {

	vec3 p = texture2D( tPos, vUv ).rgb;
	vec3 v = texture2D( tVel, vUv ).rgb;

	vec3 new_p=p+v;

	gl_FragColor = vec4( new_p, 1.0 );

}