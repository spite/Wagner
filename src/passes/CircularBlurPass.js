WAGNER.CircularBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CircularBlurPass Pass constructor' );
	this.loadShader( 'circular-blur-fs.glsl' );

};

WAGNER.CircularBlurPass.prototype = Object.create( WAGNER.Pass.prototype );
