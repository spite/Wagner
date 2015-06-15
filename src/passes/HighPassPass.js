WAGNER.HighPassPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'HighPass Pass constructor' );
	this.loadShader( 'high-pass-fs.glsl' );

};

WAGNER.HighPassPass.prototype = Object.create( WAGNER.Pass.prototype );
