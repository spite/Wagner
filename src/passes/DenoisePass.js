WAGNER.DenoisePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Denoise Pass constructor' );
	this.loadShader( 'denoise-fs' );

	this.params.exponent = 5;
	this.params.strength = 10;

};

WAGNER.DenoisePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DenoisePass.prototype.run = function( c ) {

	this.shader.uniforms.exponent.value = this.params.exponent;
	this.shader.uniforms.strength.value = this.params.strength;
	c.pass( this.shader );

};
