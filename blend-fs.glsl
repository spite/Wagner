varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDiffuse2;
uniform vec2 resolution;
uniform int mode;

float applyOverlayToChannel( float a, float b ) {

	float result;
	if( a < .5) {
		result = 2. * a * b + a * a - 2. * a * a * b;
	} else {
    	result = 2. * sqrt( a ) * b - sqrt( a ) + 2. * a - 2. * a * b;
	}
	return result;

}

float applySoftLightToChannel( float a, float b ) {

	float result;
	if( b < .5) {
		result = 2. * a * b;
	} else {
		result = 1. - 2. * ( 1. - a) * ( 1. - b);
	}
	return result;

}

void main() {

	vec4 a = texture2D( tDiffuse, vUv );
	vec4 b = texture2D( tDiffuse2, vUv );

	if( mode == 1 ) { // normal

		gl_FragColor = a;
		return;

	}

	if( mode == 2 ) { // dissolve

	}

	if( mode == 3 ) { // darken

		gl_FragColor = min( a, b );
		return;

	}

	if( mode == 4 ) { // multiply

		gl_FragColor = a * b;
		return;

	}

	if( mode == 5 ) { // color burn

	}

	if( mode == 6 ) { // linear burn

	}

	if( mode == 7 ) { // darker color

	}

	if( mode == 8 ) { // lighten

		gl_FragColor = max( a, b );
		return;

	}

	if( mode == 9 ) { // screen

		gl_FragColor = vec4( 1. ) - ( vec4( 1. ) - a ) * ( vec4( 1. ) - b );
		return;
	}

	if( mode == 10 ) { // color dodge

	}

	if( mode == 11 ) { // linear dodge

	}

	if( mode == 12 ) { // lighter color

	}

	if( mode == 13 ) { // overlay

		gl_FragColor = vec4( 
			applyOverlayToChannel( a.r, b.r ),
			applyOverlayToChannel( a.g, b.g ),
			applyOverlayToChannel( a.b, b.b ),
			applyOverlayToChannel( a.a, b.a )
		);
		return;

	}

	if( mode == 14 ) { // soft light

		gl_FragColor = vec4( 
			applySoftLightToChannel( a.r, b.r ),
			applySoftLightToChannel( a.g, b.g ),
			applySoftLightToChannel( a.b, b.b ),
			applySoftLightToChannel( a.a, b.a )
		);
		return;

	}

	if( mode == 15 ) { // hard light

		gl_FragColor = vec4( 
			applyOverlayToChannel( b.r, a.r ),
			applyOverlayToChannel( b.g, a.g ),
			applyOverlayToChannel( b.b, a.b ),
			applyOverlayToChannel( b.a, a.a )
		);
		return;

	}

	if( mode == 16 ) { // vivid light

	}

	if( mode == 17 ) { // linear light

	}

	if( mode == 18 ) { // pin light

	}

	if( mode == 20 ) { // hard mix

	}

	if( mode == 21 ) { // difference

		gl_FragColor = abs( a - b );
		return;

	}

	if( mode == 22 ) { // exclusion

		gl_FragColor = a + b - 2. * a * b;
		
	}

	if( mode == 23 ) { // substract

	}

	if( mode == 24 ) { // divide

	}


	gl_FragColor = vec4( 1., 0., 1., 1. );

}