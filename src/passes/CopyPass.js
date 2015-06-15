WAGNER.CopyPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CopyPass constructor' );
	this.loadShader( 'copy-fs' );

};

WAGNER.CopyPass.prototype = Object.create( WAGNER.Pass.prototype );
