/* jshint node: true */
'use strict';

var path = require('path');

module.exports = function (grunt) {
	grunt.registerMultiTask('shaderChunks', 'Concatenate shader chunks', function () {
		var options = this.options({
			namespace: null
		});

		var context = options.namespace ? options.namespace : 'window';

		function handleFile(file) {
			var out = '';
			var src = path.resolve(file);
			var name = file.split('/').pop().split('.')[0];
			var source = grunt.file.read(src);
			var sourceLines = source.split('\n');

			out += context + '[\'' + name + '\'] = [\n';

			sourceLines.forEach(function (line) {
				line = line.trim();
				if (line.length && line.indexOf('//') !== 0) {
					line = line.split('//')[0].trim();
					out += '\'' + line + '\',\n';
				}
			});

			out += '].join(\'\\n\');';
			return out;
		}

		this.files.forEach(function (files) {
			var contents = files.src.map(handleFile).join('\n');
			grunt.file.write(path.resolve(files.dest), contents, { encoding : 'utf8' });
		});
	});
};
