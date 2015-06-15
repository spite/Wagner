WAGNER.ToonPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ToonPass Pass constructor' );
	this.loadShader( 'toon-fs' );

};

WAGNER.ToonPass.prototype = Object.create( WAGNER.Pass.prototype );
