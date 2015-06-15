WAGNER.SobelEdgeDetectionPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SobelEdgeDetectionPass Pass constructor' );
	this.loadShader( 'sobel-fs' );

};

WAGNER.SobelEdgeDetectionPass.prototype = Object.create( WAGNER.Pass.prototype );
