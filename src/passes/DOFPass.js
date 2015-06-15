WAGNER.DOFPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'DOFPass Pass constructor' );
	this.loadShader( 'dof-fs' );

	this.params.focalDistance = 0;
	this.params.aperture = .005;
	this.params.tBias = null;
	this.params.blurAmount = 1;

};

WAGNER.DOFPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DOFPass.prototype.run = function( c ) {

	this.shader.uniforms.tBias.value = this.params.tBias;
	this.shader.uniforms.focalDistance.value = this.params.focalDistance;
	this.shader.uniforms.aperture.value = this.params.aperture;
	this.shader.uniforms.blurAmount.value = this.params.blurAmount;

	this.shader.uniforms.delta.value.set( 1, 0 );
	c.pass( this.shader );

	this.shader.uniforms.delta.value.set( 0, 1 );
	c.pass( this.shader );

};
