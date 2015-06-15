(function() {
	'use strict';

	var WAGNER = this.WAGNER || {};

	WAGNER.assetsPath = './assets';

	WAGNER.log = function() {
		// console.log( Array.prototype.slice.call( arguments ).join( ' ' ) );
	};

	require('core/*');
	require('passes/*');

	this.WAGNER = WAGNER;
}).call(this);
