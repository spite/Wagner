varying vec2 vUv;
varying vec3 vPosition;
varying float depth;
varying vec3 vNormal;

uniform float mNear;
uniform float mFar;

void main() {

	vUv = vec2( 1. );//uv;
	vNormal = vec3( 1. );//normalMatrix * normal;

	vec4 viewPos = vec4( modelViewMatrix * vec4( position, 1.0 ) ); // this will transform the vertex into eyespace
    depth = 1. - ( mNear + viewPos.z ) / ( mNear - mFar );

	vPosition = vec4( modelViewMatrix * vec4( position, 1.0 ) ).xyz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

	depth = -viewPos.z;

	depth = (-viewPos.z-mNear)/(mFar-mNear); // will map near..far to 0..1

}