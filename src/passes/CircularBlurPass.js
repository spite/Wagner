WAGNER.CircularBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CircularBlurPass Pass constructor' );
	this.loadShader( 'circular-blur-fs' );

};

WAGNER.CircularBlurPass.prototype = Object.create( WAGNER.Pass.prototype );
