WAGNER.FreiChenEdgeDetectionPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FreiChenEdgeDetectionPass Pass constructor' );
	this.loadShader( 'frei-chen-fs.glsl' );

};

WAGNER.FreiChenEdgeDetectionPass.prototype = Object.create( WAGNER.Pass.prototype );
