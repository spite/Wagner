WAGNER.PixelatePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'PixelatePass Pass constructor' );
	this.loadShader( 'pixelate-fs' );

	this.params.amount = 320;

};

WAGNER.PixelatePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.PixelatePass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	c.pass( this.shader );

};
