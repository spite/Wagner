uniform sampler2D tDiffuse;
uniform sampler2D tDiffuse2;
uniform sampler2D tFadeMap;
uniform vec2 resolution;
uniform float time;
uniform float threshold;

varying vec2 vUv;

void main( void ) {

	float range = .2;
	vec4 from = texture2D( tDiffuse, vUv );
	vec4 to = texture2D( tDiffuse2, vUv );
	vec3 luma = vec3( .299, 0.587, 0.114 );
	float v = clamp( dot( luma, texture2D( tFadeMap, vUv ).rgb ), 0., 1. - range );

	if( v < threshold ){
		 gl_FragColor = mix( from, to, smoothstep( 1. - range, 1., v / threshold ) );
	} else {
		gl_FragColor = to;
	}

}
