uniform float mNear;
uniform float mFar;

vec4 pack_depth( const in float f ) {
	vec4 color;
	color.r = floor( f / ( 256. * 256. * 256. ) );
	color.g = floor( ( mod( f,  256. * 256. * 256. ) ) / ( 256. * 256. ) );
	color.b = floor( ( mod( f,  256. * 256. ) ) / 256. );
	color.a = floor( mod( f, 256.)  );
	return color / 256.0;
}

void main() {
	float depth = gl_FragCoord.z / gl_FragCoord.w;
	float color = 1. - ( depth - mNear ) / ( mFar - mNear ); //
	color *= 256. * 256. * 256. * 256.;
	gl_FragColor = pack_depth( color );
}