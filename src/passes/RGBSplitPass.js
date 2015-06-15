WAGNER.RGBSplitPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'RGBSplitPass Pass constructor' );
	this.loadShader( 'rgb-split-fs.glsl', function() {
	} );

	this.params.delta = new THREE.Vector2();

};

WAGNER.RGBSplitPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.RGBSplitPass.prototype.run = function( c ) {

	this.shader.uniforms.delta.value.copy( this.params.delta );
	c.pass( this.shader );

};
