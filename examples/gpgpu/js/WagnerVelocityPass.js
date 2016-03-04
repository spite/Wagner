WAGNER.VelocityPass = function () {

	WAGNER.Pass.call( this );
	WAGNER.log( 'VelocityPass Pass constructor' );

	this.loadShader( 'velocity-fs.glsl', function () {

		this.shader.uniforms.limitToBounce.value = this.params.limitToBounce;

	} );

}

WAGNER.VelocityPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.VelocityPass.prototype.run = function ( c ) {

	this.shader.uniforms.tPos.value = this.params.tPos;
	this.shader.uniforms.tVel.value = c.output;
	c.pass( this.shader );

}