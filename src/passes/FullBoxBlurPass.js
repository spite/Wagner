WAGNER.FullBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FullBoxBlurPass Pass constructor' );
	this.boxPass = new WAGNER.BoxBlurPass();
	this.params.amount = 20;
	this.params.taps = 1;

};

WAGNER.FullBoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.FullBoxBlurPass.prototype.isLoaded = function() {

	if( this.boxPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.FullBoxBlurPass.prototype.run = function( c ) {

	var s = this.params.amount;
	this.boxPass.params.delta.set( s, 0 );
	this.boxPass.params.taps = this.params.taps;
	c.pass( this.boxPass );
	this.boxPass.params.delta.set( 0, s );
	c.pass( this.boxPass );

};
