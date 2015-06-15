WAGNER.SSAOPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SSAOPass Pass constructor' );
	this.loadShader( 'ssao-fs.glsl', function( fs ) {
		
		/*this.shader.uniforms.pSphere.value = [
			new THREE.Vector3(-0.010735935, 0.01647018, 0.0062425877),
			new THREE.Vector3(-0.06533369, 0.3647007, -0.13746321),
			new THREE.Vector3(-0.6539235, -0.016726388, -0.53000957),
			new THREE.Vector3(0.40958285, 0.0052428036, -0.5591124),
			new THREE.Vector3(-0.1465366, 0.09899267, 0.15571679),
			new THREE.Vector3(-0.44122112, -0.5458797, 0.04912532),
			new THREE.Vector3(0.03755566, -0.10961345, -0.33040273),
			new THREE.Vector3(0.019100213, 0.29652783, 0.066237666),
			new THREE.Vector3(0.8765323, 0.011236004, 0.28265962),
			new THREE.Vector3(0.29264435, -0.40794238, 0.15964167)
		];*/
		
	} );

	this.params.texture = null;
	this.params.isPacked = false;
	this.params.onlyOcclusion = false;

	this.blurPass = new WAGNER.FullBoxBlurPass();
	this.blendPass = new WAGNER.BlendPass();
	this.composer = null;

};

WAGNER.SSAOPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.SSAOPass.prototype.run = function( c ) {

	if( !this.composer ) {
		var s = 4;
		this.composer = new WAGNER.Composer( c.renderer, { useRGBA: true } );
		this.composer.setSize( c.width / s, c.height / s );
	}

	this.composer.reset();

	this.composer.setSource( c.output );

	this.shader.uniforms.tDepth.value = this.params.texture;
	//this.shader.uniforms.isPacked.value = this.params.isPacked;
	this.shader.uniforms.onlyOcclusion.value = this.params.onlyOcclusion;
	this.composer.pass( this.shader );

	this.blurPass.params.amount = .1;
	this.composer.pass( this.blurPass );

	if( this.params.onlyOcclusion ) {
		c.setSource( this.composer.output );
	} else {		
		this.blendPass.params.mode = WAGNER.BlendMode.Multiply;
		this.blendPass.params.tInput2 = this.composer.output;

		c.pass( this.blendPass );
	}

};
