var ShaderLoader = function() {
	
	this.loaded = 0;
	this.toLoad = 0;
	this.shaders = {};
	this.queue = [];
	this.onLoadedCallback = function(){};

}

ShaderLoader.prototype.add = function( id, name ) {

	this.toLoad++;
	this.shaders[ id ] = {
		id: id,
		name: name,
		content: '',
		loaded: false
	}
	this.queue.push( this.shaders[ id ] );

}

ShaderLoader.prototype.processQueue = function() {

	var shader = this.queue.pop();

	var oReq = new XMLHttpRequest();
	oReq.onload = function() {
		this.loaded++;
		shader.content = oReq.responseText;
		if( this.loaded != this.toLoad ) {
			this.processQueue();
		} else {
			this.onLoadedCallback();
		}
	}.bind( this );
	oReq.open( 'get', shader.name, true );
	oReq.send();

}

ShaderLoader.prototype.load = function() {

	this.processQueue();

}

ShaderLoader.prototype.onLoaded = function( callback ) {

	if( this.loaded == this.toLoad ) callback();
	else this.onLoadedCallback = callback;

}

ShaderLoader.prototype.get = function( id ) {

	function ShaderLoaderGetException( message ) {
		this.message = 'Cannot find shader "' + id + '".';
		this.name = "ShaderLoaderGetException";
		this.toString = function() {
			return this.message
		};
	}

	var s = this.shaders[ id ];
	if( !s ) {
		throw new ShaderLoaderGetException( id );
		return;
	} 

	return s.content;

}