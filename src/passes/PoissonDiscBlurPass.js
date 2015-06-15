WAGNER.PoissonDiscBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'PoissonDiscBlurPass Pass constructor' );
	this.loadShader( 'poisson-disc-blur-fs.glsl' );

};

WAGNER.PoissonDiscBlurPass.prototype = Object.create( WAGNER.Pass.prototype );
