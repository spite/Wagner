WAGNER.BrightnessContrastPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BrightnessContrastPass constructor' );
	this.loadShader( 'brightness-contrast-fs.glsl' );

	this.params.brightness = 1;
	this.params.contrast = 1;

};

WAGNER.BrightnessContrastPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.BrightnessContrastPass.prototype.run = function( c ) {

	this.shader.uniforms.brightness.value = this.params.brightness;
	this.shader.uniforms.contrast.value = this.params.contrast;

	c.pass( this.shader );

};
