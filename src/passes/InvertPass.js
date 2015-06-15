WAGNER.InvertPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'InvertPass constructor' );
	this.loadShader( 'invert-fs' );

};

WAGNER.InvertPass.prototype = Object.create( WAGNER.Pass.prototype );
