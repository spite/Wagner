WAGNER.ASCIIPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ASCIIPass Pass constructor' );
	this.loadShader( 'ascii-fs.glsl', function() {
		this.shader.uniforms.tAscii.value = THREE.ImageUtils.loadTexture( WAGNER.assetsPath + '/ascii/8x16_ascii_font_sorted.gif' );
	} );

};

WAGNER.ASCIIPass.prototype = Object.create( WAGNER.Pass.prototype );
