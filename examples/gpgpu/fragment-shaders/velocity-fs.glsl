varying vec2 vUv;
uniform sampler2D tVel;
uniform sampler2D tPos;
uniform float limitToBounce;

void main() {

	vec3 pos = texture2D( tPos, vUv ).xyz;
	vec3 vel = texture2D( tVel, vUv ).xyz;

	if ((pos.x > limitToBounce) || (pos.x < -limitToBounce)) {
		vel.x *= -1.0;
	}

	if ((pos.y > limitToBounce) || (pos.y < -limitToBounce)) {
		vel.y *= -1.0;
	}

	if ((pos.z > limitToBounce) || (pos.z < -limitToBounce)) {
		vel.z *= -1.0;
	}

	gl_FragColor = vec4(vel, 1.0);

}