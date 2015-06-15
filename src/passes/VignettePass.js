WAGNER.VignettePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Vignette Pass constructor' );
	this.loadShader( 'vignette-fs' );

	this.params.amount = 1;
	this.params.falloff = 0.1;

};

WAGNER.VignettePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.VignettePass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	this.shader.uniforms.falloff.value = this.params.falloff;
	c.pass( this.shader );

};
