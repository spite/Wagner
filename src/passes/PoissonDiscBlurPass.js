WAGNER.PoissonDiscBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'PoissonDiscBlurPass Pass constructor' );
	this.loadShader( 'poisson-disc-blur-fs' );

};

WAGNER.PoissonDiscBlurPass.prototype = Object.create( WAGNER.Pass.prototype );
