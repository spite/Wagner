WAGNER.BoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BoxBlurPass Pass constructor' );
	this.loadShader( 'box-blur2-fs' );
	this.params.delta = new THREE.Vector2( 0, 0 );
	this.params.taps = 1;

};

WAGNER.BoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.BoxBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.delta.value.copy( this.params.delta );
	/*for( var j = 0; j < this.params.taps; j++ ) {
		this.shader.uniforms.delta.value.copy( this.params.delta );
		c.pass( this.shader );
	}*/
	c.pass( this.shader );

};
