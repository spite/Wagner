WAGNER.GuidedBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'GuidedBoxBlurPass Pass constructor' );
	this.loadShader( 'guided-box-blur2-fs.glsl' );

	this.params.tBias = null;
	this.params.delta = new THREE.Vector2( 1., 0 );
	this.params.invertBiasMap = false;
	this.params.isPacked = 0;
	this.params.from = 0;
	this.params.to = 1;

};

WAGNER.GuidedBoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.GuidedBoxBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.tBias.value = this.params.tBias,
	this.shader.uniforms.delta.value.copy( this.params.delta );
	this.shader.uniforms.delta.value.multiplyScalar( .0001 );
	this.shader.uniforms.invertBiasMap.value = this.params.invertBiasMap;
	this.shader.uniforms.isPacked.value = this.params.isPacked;
	this.shader.uniforms.from.value = this.params.from;
	this.shader.uniforms.to.value = this.params.to;
	c.pass( this.shader );

};
