(function() {
	'use strict';

	var WAGNER = WAGNER || {};

	WAGNER.vertexShadersPath = './vertex-shaders';
	WAGNER.fragmentShadersPath = './fragment-shaders';
	WAGNER.assetsPath = './assets';

	WAGNER.log = function() {
		console.log( Array.prototype.slice.call( arguments ).join( ' ' ) );
	};

	this.WAGNER = WAGNER;
}).call(this);
