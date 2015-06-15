WAGNER.OldVideoPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'OldVideoPass Pass constructor' );
	this.loadShader( 'old-video-fs.glsl' );

};

WAGNER.OldVideoPass.prototype = Object.create( WAGNER.Pass.prototype );
