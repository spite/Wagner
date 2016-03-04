WAGNER.PositionPass = function () {

	WAGNER.Pass.call( this );
	WAGNER.log( 'PositionPass Pass constructor' );

	this.loadShader( 'position-fs.glsl' );

}

WAGNER.PositionPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.PositionPass.prototype.run = function ( c ) {

	this.shader.uniforms.tVel.value = this.params.tVel;
	this.shader.uniforms.tPos.value = c.output;
	c.pass( this.shader );

}