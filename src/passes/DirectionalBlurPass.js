WAGNER.DirectionalBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Directional Blur Pass constructor' );
	this.loadShader( 'guided-directional-blur-fs.glsl', function( fs ) {
		
	} );

	this.params.tBias = null;
	this.params.delta = .1;

}

WAGNER.DirectionalBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DirectionalBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.tBias.value = this.params.tBias;
	this.shader.uniforms.delta.value = this.params.delta;

	c.pass( this.shader );

};
