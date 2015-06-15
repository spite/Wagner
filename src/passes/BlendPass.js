WAGNER.BlendPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BlendPass constructor' );
	this.loadShader( 'blend-fs' );

	this.params.mode = 1;
	this.params.opacity = 1;
	this.params.tInput2 = null;
	this.params.resolution2 = new THREE.Vector2();
	this.params.sizeMode = 1;
	this.params.aspectRatio = 1;
	this.params.aspectRatio2 = 1;

};

WAGNER.BlendMode = {
	Normal: 1,
	Dissolve: 2,
	Darken: 3,
	Multiply: 4,
	ColorBurn: 5,
	LinearBurn: 6,
	DarkerColor: 7,
	Lighten: 8,
	Screen: 9,
	ColorDodge: 10,
	LinearDodge: 11,
	LighterColor: 12,
	Overlay: 13,
	SoftLight: 14,
	HardLight: 15,
	VividLight: 16,
	LinearLight: 17,
	PinLight: 18,
	HardMix: 19,
	Difference: 20,
	Exclusion: 21,
	Substract: 22,
	Divide: 23
};

WAGNER.BlendPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.BlendPass.prototype.run = function( c ) {

	this.shader.uniforms.mode.value = this.params.mode;
	this.shader.uniforms.opacity.value = this.params.opacity;
	this.shader.uniforms.tInput2.value = this.params.tInput2;
	this.shader.uniforms.sizeMode.value = this.params.sizeMode;
	this.shader.uniforms.aspectRatio.value = this.params.aspectRatio;
	this.shader.uniforms.aspectRatio2.value = this.params.aspectRatio2;

	c.pass( this.shader );

};
