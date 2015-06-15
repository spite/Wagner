WAGNER.CrossFadePass = function() {

  WAGNER.Pass.call( this );
  WAGNER.log( 'CrossFadePass Pass constructor' );
  this.loadShader( 'crossfade-fs.glsl' );

  this.params.tInput2 = null;
  this.params.tFadeMap = null;
  this.params.amount = 0;

};

WAGNER.CrossFadePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.CrossFadePass.prototype.run = function( c ) {

  this.shader.uniforms.tInput2.value = this.params.tInput2;
  this.shader.uniforms.tFadeMap.value = this.params.tFadeMap;
  this.shader.uniforms.amount.value = this.params.amount;

  c.pass( this.shader );

};
