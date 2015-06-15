WAGNER.HighPassPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'HighPass Pass constructor' );
	this.loadShader( 'high-pass-fs' );

};

WAGNER.HighPassPass.prototype = Object.create( WAGNER.Pass.prototype );
