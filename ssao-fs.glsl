varying vec2 vUv;
uniform sampler2D tDepth;
uniform sampler2D tDiffuse;
uniform vec2 resolution;

float random(vec3 scale,float seed){return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);}

float unpack_depth(const in vec4 color) {
	return ( color.r * 256. * 256. * 256. + color.g * 256. * 256. + color.b * 256. + color.a ) / ( 256. * 256. * 256. );
}

float sampleDepth( vec2 uv ) {
	return unpack_depth( texture2D( tDepth, uv ) );
}

float occlusion = 0.;
float depth = sampleDepth( vUv );

void checkDepth( vec2 uv ) {
	float d = depth - sampleDepth( uv );
	//float t = .075;
	//if( d > 0. && d < t ) occlusion += d;
	//if( d > 0. ) d = 0.; else d = -d;
	//if( d > .05 ) d = 0.;
	if( d > 0. ) occlusion += 1.;
}

void main() {
	
	float xi = 8. / resolution.x;
	float yi = 8. / resolution.y;

	checkDepth( vUv + vec2( - 2. * xi, - 2. * yi ) );
	checkDepth( vUv + vec2(      - xi, - 2. * yi ) );
	checkDepth( vUv + vec2(        0., - 2. * yi ) );
	checkDepth( vUv + vec2(        xi, - 2. * yi ) );
	checkDepth( vUv + vec2(   2. * xi, - 2. * yi ) );

	checkDepth( vUv + vec2( - 2. * xi, - yi ) );
	checkDepth( vUv + vec2(      - xi, - yi ) );
	checkDepth( vUv + vec2(        0., - yi ) );
	checkDepth( vUv + vec2(        xi, - yi ) );
	checkDepth( vUv + vec2(   2. * xi, - yi ) );

	checkDepth( vUv + vec2( - 2. * xi, 0. ) );
	checkDepth( vUv + vec2(      - xi, 0. ) );
	checkDepth( vUv + vec2(        xi, 0. ) );
	checkDepth( vUv + vec2(   2. * xi, 0. ) );

	checkDepth( vUv + vec2( - 2. * xi, yi ) );
	checkDepth( vUv + vec2(      - xi, yi ) );
	checkDepth( vUv + vec2(        0., yi ) );
	checkDepth( vUv + vec2(        xi, yi ) );
	checkDepth( vUv + vec2(   2. * xi, yi ) );

	checkDepth( vUv + vec2( - 2. * xi, 2. * yi ) );
	checkDepth( vUv + vec2(      - xi, 2. * yi ) );
	checkDepth( vUv + vec2(        0., 2. * yi ) );
	checkDepth( vUv + vec2(        xi, 2. * yi ) );
	checkDepth( vUv + vec2(   2. * xi, 2. * yi ) );

	occlusion = .1 * ( occlusion + random( vec3( gl_FragCoord.xy, depth ), length( gl_FragCoord ) ) );
	occlusion = clamp( occlusion, 0., 1. );

	vec3 color = texture2D( tDiffuse, vUv ).rgb;
	color = mix( color, .5 * color, 1. - occlusion );

	//color = vec3( occlusion );
	//color = vec3( occlusion ) *  texture2D( tDiffuse, vUv ).rgb;
	gl_FragColor = vec4( color, 1. );


}