WAGNER.ZoomBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ZoomBlurPass Pass constructor' );
	this.loadShader( 'zoom-blur-fs' );

	this.params.center = new THREE.Vector2( 0.5, 0.5 );
	this.params.strength = 2;

};

WAGNER.ZoomBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.ZoomBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.center.value.copy ( this.params.center );
	this.shader.uniforms.strength.value = this.params.strength;
	c.pass( this.shader );

};
