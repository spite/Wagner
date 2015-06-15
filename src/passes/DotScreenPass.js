WAGNER.DotScreenPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'DotScreenPass Pass constructor' );
	this.loadShader( 'dot-screen-fs.glsl' );

};

WAGNER.DotScreenPass.prototype = Object.create( WAGNER.Pass.prototype );
