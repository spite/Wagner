WAGNER.HalftonePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'HalftonePass Pass constructor' );
	this.loadShader( 'halftone-fs.glsl', function() {
		this.shader.uniforms.pixelSize.value = 6;
	} );

};

WAGNER.HalftonePass.prototype = Object.create( WAGNER.Pass.prototype );
