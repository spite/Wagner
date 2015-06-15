WAGNER.BleachPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Bleach Pass constructor' );
	this.loadShader( 'bleach-fs.glsl', function( fs ) {
		
	} );

	this.params.amount = 1;

}

WAGNER.BleachPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.BleachPass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;

	c.pass( this.shader );

};
