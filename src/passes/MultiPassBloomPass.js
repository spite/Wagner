WAGNER.MultiPassBloomPass = function( w, h ) {

	WAGNER.Pass.call( this );
	WAGNER.log( 'MultiPassBloomPass Pass constructor' );

	this.composer = null;

	this.tmpTexture  = this.getOfflineTexture( w, h, true );
	this.blurPass    = new WAGNER.FullBoxBlurPass();
	this.blendPass   = new WAGNER.BlendPass();
	this.zoomBlur    = new WAGNER.ZoomBlurPass();
	this.brightnessContrastPass = new WAGNER.BrightnessContrastPass();

	this.width = w || 512;
	this.height = h || 512;

	this.params.blurAmount = 20;
	this.params.applyZoomBlur = false;
	this.params.zoomBlurStrength = 2;
	this.params.useTexture = false;
	this.params.zoomBlurCenter = new THREE.Vector2( 0,0 );
	this.params.blendMode = WAGNER.BlendMode.Screen;

};

WAGNER.MultiPassBloomPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.MultiPassBloomPass.prototype.isLoaded = function() {

	if( this.blurPass.isLoaded() && 
		this.blendPass.isLoaded() &&
		this.zoomBlur.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.MultiPassBloomPass.prototype.run = function( c ) {

	if( !this.composer ) {
		this.composer = new WAGNER.Composer( c.renderer, { useRGBA: true } );
		this.composer.setSize( this.width, this.height );
		//this.composer.setSize( this.tmpTexture.width, this.tmpTexture.height );
	}

	/*var s = 0.5;
	if( c.width != this.tmpTexture.width / s || c.height != this.tmpTexture.height / s ) {
		this.tmpTexture  = this.getOfflineTexture( c.width * s, c.height * s, true );
		this.composer.setSize( this.tmpTexture.width, this.tmpTexture.height );
	}*/

	this.composer.reset();

	if( this.params.useTexture === true ) {
		this.composer.setSource( this.params.glowTexture );
	} else {
		this.composer.setSource( c.output );
		/*this.brightnessContrastPass.params.brightness = -1;
		this.brightnessContrastPass.params.contrast = 5;
		this.composer.pass( this.brightnessContrastPass );*/
	}

	this.blurPass.params.amount = this.params.blurAmount;
	this.composer.pass( this.blurPass );
	
	if( this.params.applyZoomBlur ) {
		this.zoomBlur.params.center.set( .5 * this.composer.width, .5 * this.composer.height );
		this.zoomBlur.params.strength = this.params.zoomBlurStrength;
		this.composer.pass( this.zoomBlur );
	}

	if( this.params.useTexture === true ) {
		this.blendPass.params.mode = WAGNER.BlendMode.Screen;
		this.blendPass.params.tInput = this.params.glowTexture;
		c.pass( this.blendPass );
	}

	this.blendPass.params.mode = this.params.blendMode;
	this.blendPass.params.tInput2 = this.composer.output;
	c.pass( this.blendPass );
	
};
