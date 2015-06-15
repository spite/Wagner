WAGNER.FXAAPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FXAA Pass constructor' );
	this.loadShader( 'fxaa-fs' );

};

WAGNER.FXAAPass.prototype = Object.create( WAGNER.Pass.prototype );
