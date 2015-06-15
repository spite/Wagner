WAGNER.SepiaPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SepiaPass constructor' );
	this.loadShader( 'sepia-fs' );

	this.params.amount = 1;

};

WAGNER.SepiaPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.SepiaPass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	c.pass( this.shader );

};
