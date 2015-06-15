WAGNER.Halftone2Pass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Halftone2Pass Pass constructor' );
	this.loadShader( 'halftone2-fs.glsl' );

	this.params.amount = 128;
	this.params.smoothness = .25;

};

WAGNER.Halftone2Pass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.Halftone2Pass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	this.shader.uniforms.smoothness.value = this.params.smoothness;

	c.pass( this.shader );

};
