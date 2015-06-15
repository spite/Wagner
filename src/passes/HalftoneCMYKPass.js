WAGNER.HalftoneCMYKPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'HalftoneCMYKPass Pass constructor' );
	this.loadShader( 'halftone-cmyk-fs.glsl', function() {

	} );

};

WAGNER.HalftoneCMYKPass.prototype = Object.create( WAGNER.Pass.prototype );
