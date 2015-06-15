WAGNER.FreiChenEdgeDetectionPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FreiChenEdgeDetectionPass Pass constructor' );
	this.loadShader( 'frei-chen-fs' );

};

WAGNER.FreiChenEdgeDetectionPass.prototype = Object.create( WAGNER.Pass.prototype );
