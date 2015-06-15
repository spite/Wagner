WAGNER.ShadersPool = function () {

	this.availableShaders = [];

};

WAGNER.ShadersPool.prototype.getPasses = function ( passItems ) {

	var pass,
		passes = [];

	this.availableShaders.forEach( function ( availableShader ) {

		availableShader.used = false;

	} );

	if ( passItems ) {

		passItems.forEach( function ( passItem, index ) {

			if ( passItem.enabled ) {

				pass = this.getShaderFromPool( passItem.shaderName );

				if ( passItem.params ) {

					pass.params = this.extendParams(pass.params, passItem.params)

				}

				passes.push( pass );

			}

		}.bind( this ) );

	}

	return passes;

};

WAGNER.ShadersPool.prototype.getShaderFromPool = function ( shaderName ) {

	var pass,
		shaderItem;

	if ( shaderName && WAGNER[ shaderName ] ) {

		for (var i = this.availableShaders.length - 1; i >= 0; i--) {

			shaderItem = this.availableShaders[i];

			if ( !shaderItem.used && shaderItem.name === shaderName ) {

				shaderItem.used = true;
				pass = shaderItem.pass;
				break;

			}
			
		};

		if ( !pass ) {

			pass = new WAGNER[ shaderName ]();

			shaderItem = {
				pass: pass,
				name: shaderName,
				used: true
			};

			this.availableShaders.push( shaderItem );

		}

		return pass;

	}

};

WAGNER.ShadersPool.prototype.extendParams = function(target, source) {

	var obj = {},
		i = 0,
		il = arguments.length,
		key;

	for (; i < il; i++) {

		for (key in arguments[i]) {

			if (arguments[i].hasOwnProperty(key)) {

				obj[key] = arguments[i][key];

			}
		}
	}

	return obj;
	
};
