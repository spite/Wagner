/*

https://www.shadertoy.com/view/XssGz8

Simulates Chromatic Aberration by linearly interpolating blur-weights from red to green to blue.
Original idea by Kusma: https://github.com/kusma/vlee/blob/master/data/postprocess.fx
Barrel Blur forked from https://www.shadertoy.com/view/XslGz8

*/

WAGNER.ChromaticAberrationPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ChromaticAberrationPass Pass constructor' );
	this.loadShader( 'chromatic-aberration-fs.glsl' );

};

WAGNER.ChromaticAberrationPass.prototype = Object.create( WAGNER.Pass.prototype );
