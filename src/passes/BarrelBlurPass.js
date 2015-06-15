WAGNER.BarrelBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BarrelBlurPass Pass constructor' );
	this.loadShader( 'barrel-blur-fs' );

};

WAGNER.BarrelBlurPass.prototype = Object.create( WAGNER.Pass.prototype );
