WAGNER.GuidedFullBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FullBoxBlurPass Pass constructor' );
	this.guidedBoxPass = new WAGNER.GuidedBoxBlurPass();

	this.params.tBias = null;
	this.params.invertBiasMap = false;
	this.params.isPacked = 0;
	this.params.amount = 10;
	this.params.from = 0;
	this.params.to = 1;
	this.params.taps = 1;

};

WAGNER.GuidedFullBoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.GuidedFullBoxBlurPass.prototype.isLoaded = function() {

	if( this.guidedBoxPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.GuidedFullBoxBlurPass.prototype.run = function( c ) {

	this.guidedBoxPass.params.invertBiasMap = this.params.invertBiasMap;
	this.guidedBoxPass.params.isPacked = this.params.isPacked;
	this.guidedBoxPass.params.tBias = this.params.tBias;
	this.guidedBoxPass.params.from = this.params.from;
	this.guidedBoxPass.params.to = this.params.to;
	var s = this.params.amount;
	for( var j = 0; j < this.params.taps; j++ ) {
		this.guidedBoxPass.params.delta.set( s, 0 );
		c.pass( this.guidedBoxPass );
		this.guidedBoxPass.params.delta.set( 0, s );
		c.pass( this.guidedBoxPass );
	}

};
