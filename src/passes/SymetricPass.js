WAGNER.SymetricPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SymetricPass constructor' );
	this.loadShader( 'symetric-fs.glsl' );

	this.params.xReverse = false;
	this.params.yReverse = false;
	this.params.xMirror = false;
	this.params.yMirror = false;
	this.params.mirrorCenter = new THREE.Vector2( 0.5, 0.5);
	this.params.angle = 0;


};

WAGNER.SymetricPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.SymetricPass.prototype.run = function( c ) {

	this.shader.uniforms.xReverse.value = this.params.xReverse;
	this.shader.uniforms.yReverse.value = this.params.yReverse;
	this.shader.uniforms.xMirror.value = this.params.xMirror;
	this.shader.uniforms.yMirror.value = this.params.yMirror;
	this.shader.uniforms.mirrorCenter.value = this.params.mirrorCenter;
	this.shader.uniforms.angle.value = this.params.angle;
	c.pass( this.shader );

};
