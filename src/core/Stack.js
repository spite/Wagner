WAGNER.Stack = function ( shadersPool ) {

	this.passItems = [];
	this.shadersPool = shadersPool;
	this.passes = [];

};

WAGNER.Stack.prototype.addPass = function ( shaderName, enabled, params, index ) {

	var length,
		passItem = {
			shaderName: shaderName,
			enabled: enabled || false
		};

	//todo: use and store params values

	this.passItems.push( passItem );
	length = this.passItems.length;
	
	this.updatePasses();

	if ( index ) {

		return this.movePassToIndex( this.passItems[ length ], index );

	} else {

		return length - 1;

	}

};

WAGNER.Stack.prototype.removePass = function ( index ) {

	this.passItems.splice(index, 1);
	this.updatePasses();

};

WAGNER.Stack.prototype.enablePass = function ( index ) {

	this.passItems[ index ].enabled = true;
	this.updatePasses();

};

WAGNER.Stack.prototype.disablePass = function ( index ) {

	this.passItems[ index ].enabled = false;
	this.updatePasses();

};

WAGNER.Stack.prototype.isPassEnabled = function ( index ) {

	return this.passItems[ index ].enabled;

};

WAGNER.Stack.prototype.movePassToIndex = function ( index, destIndex ) {

	this.passItems.splice( destIndex, 0, this.passItems.splice( index, 1 )[ 0 ] );
	this.updatePasses();
	return destIndex; //TODO: check if destIndex is final index

};

WAGNER.Stack.prototype.reverse = function () {

	this.passItems.reverse();
	this.updatePasses();

};

WAGNER.Stack.prototype.updatePasses = function () {

	this.passes = this.shadersPool.getPasses( this.passItems );

	// init default params for new passItems
	this.passItems.forEach( function ( passItem, index ) {

		if (passItem.params === undefined) {

			passItem.params = JSON.parse(JSON.stringify(this.passes[index].params)); // clone params without reference to the real shader instance params
			// console.log('updatePasses', passItem, passItem.params);

		}

	}.bind(this) );

	// console.log('Updated stack passes list from shaders pool. Stack contains', this.passes.length, 'shaders, and there are', this.shadersPool.availableShaders.length, 'shaders in the pool.');

};

WAGNER.Stack.prototype.getPasses = function () {

	return this.passes;

};
