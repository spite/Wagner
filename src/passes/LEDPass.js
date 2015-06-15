WAGNER.LEDPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'LEDPass Pass constructor' );
	this.loadShader( 'led-fs.glsl', function() {
		
		//this.shader.uniforms.noiseTexture.value = 1;
	} );

	this.params.pixelSize = 10;
	this.params.tolerance = .25;
	this.params.pixelRadius = .25;
	this.params.luminanceSteps = 100;
	this.params.luminanceBoost = .2;
	this.params.colorBoost = .01;
	this.params.burntOutPercent = 50;
};

WAGNER.LEDPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.LEDPass.prototype.run = function( c ) {

	this.shader.uniforms.pixelSize.value = this.params.pixelSize;
	this.shader.uniforms.tolerance.value = this.params.tolerance;
	this.shader.uniforms.pixelRadius.value = this.params.pixelRadius;
	this.shader.uniforms.luminanceSteps.value = this.params.luminanceSteps;
	this.shader.uniforms.luminanceBoost.value = this.params.luminanceBoost;
	this.shader.uniforms.colorBoost.value = this.params.colorBoost;
	this.shader.uniforms.burntOutPercent.value = this.params.burntOutPercent;

	c.pass( this.shader );

};
