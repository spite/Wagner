WAGNER.NoisePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Noise Pass constructor' );
	this.loadShader( 'noise-fs' );

	this.params.amount = 0.1;
	this.params.speed = 0;

};

WAGNER.NoisePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.NoisePass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	this.shader.uniforms.speed.value = this.params.speed;
	c.pass( this.shader );

};
