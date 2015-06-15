(function() {
	'use strict';

	var WAGNER = this.WAGNER || {};

	WAGNER.shaders = {};

	WAGNER.loadShader = function( id, cb ) {
		var source = WAGNER.shaders[ id ];
		if ( cb ) cb(source);
		return source;
	};

	require('shaders/all');

	this.WAGNER = WAGNER;
}).call(this);
