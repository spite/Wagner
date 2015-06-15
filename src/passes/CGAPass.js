WAGNER.CGAPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CGA Pass constructor' );
	this.loadShader( 'cga-fs.glsl', function() {
		this.shader.uniforms.pixelDensity.value = window.devicePixelRatio;
	} );

};

WAGNER.CGAPass.prototype = Object.create( WAGNER.Pass.prototype );
