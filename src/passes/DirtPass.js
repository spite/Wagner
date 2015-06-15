WAGNER.DirtPass = function() {

	WAGNER.Pass.call( this );
	this.blendPass = new WAGNER.BlendPass();
	this.dirtTexture = THREE.ImageUtils.loadTexture( WAGNER.assetsPath + '/textures/dirt8.jpg' );

	this.params.blendMode = WAGNER.BlendMode.SoftLight;

};

WAGNER.DirtPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DirtPass.prototype.isLoaded = function() {

	if( this.blendPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.DirtPass.prototype.run = function( c ) {

	this.blendPass.params.sizeMode = 1;
	this.blendPass.params.mode = this.params.blendMode;
	this.blendPass.params.tInput2 = this.dirtTexture;
	if( this.dirtTexture.image ) {
		this.blendPass.params.resolution2.set( this.dirtTexture.image.width, this.dirtTexture.image.height );
		this.blendPass.params.aspectRatio2 = this.dirtTexture.image.width / this.dirtTexture.image.height;
	}
	this.blendPass.params.aspectRatio = c.read.width / c.read.height;
	c.pass( this.blendPass );

};
