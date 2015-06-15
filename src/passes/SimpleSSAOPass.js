WAGNER.SimpleSSAOPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SimpleSSAOPass Pass constructor' );
	this.loadShader( 'ssao-simple-fs.glsl', function( fs ) {
	} );

	this.params.texture = null;
	this.params.onlyOcclusion = 0;
	this.params.zNear = 1;
	this.params.zFar = 10000;
	this.params.strength = 1;

};

WAGNER.SimpleSSAOPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.SimpleSSAOPass.prototype.run = function( c ) {

	this.shader.uniforms.tDepth.value = this.params.texture;
//	this.shader.uniforms.onlyOcclusion.value = this.params.onlyOcclusion;
	this.shader.uniforms.zNear.value = this.params.zNear;
	this.shader.uniforms.zFar.value = this.params.zFar;
	this.shader.uniforms.strength.value = this.params.strength;

	c.pass( this.shader );

};
