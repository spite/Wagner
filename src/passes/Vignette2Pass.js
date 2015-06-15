WAGNER.Vignette2Pass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Vignette Pass constructor' );
	this.loadShader( 'vignette2-fs.glsl' );

	this.params.boost = 2;
	this.params.reduction = 2;

};

WAGNER.Vignette2Pass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.Vignette2Pass.prototype.run = function( c ) {

	this.shader.uniforms.boost.value = this.params.boost;
	this.shader.uniforms.reduction.value = this.params.reduction;
	c.pass( this.shader );

};
