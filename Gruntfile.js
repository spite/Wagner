/*jshint node:true*/
module.exports = function (grunt) {
	'use strict';

	var config = {
		src: 'src/',
		dest: 'dist/'
	};

	require('jit-grunt')(grunt)({
		loadTasks: 'grunt/tasks'
	});

	grunt.initConfig({
		neuter: {
			options: {
				basePath: config.src,
				template: '{%= src %}',
				sourceRoot: '../',
				includeSourceMap: false
			},
			main: {
				src: config.src + 'main.js',
				dest: config.dest + 'wagner.js'
			},
			shaders: {
				src: config.src + 'shaders.js',
				dest: config.dest + 'wagner.shaders.js'
			}
		},

		shaderChunks: {
			all: {
				options: {
					namespace: 'WAGNER.shaders'
				},
				src: config.src + 'shaders/**/*.glsl',
				dest: config.src + 'shaders/all.js'
			}
		},

		uglify: {
			build: {
				src: [
					config.dest + 'wagner.shaders.js',
					config.dest + 'wagner.js'
				],
				dest: config.dest + 'wagner.min.js'
			}
		},

		watch: {
			main: {
				files: [
					config.src + '**/*.js',
					'!' + config.src + 'shaders/all.js'
				],
				tasks: ['neuter:main']
			},
			shaders: {
			  files: [
			  	config.src + 'shaders.js',
			  	config.src + 'shaders/**/*.glsl'
		  	],
			  tasks: ['shaderChunks', 'neuter:shaders']
			}
		},

		connect: {
			server: {
				options: {
					port: 8000,
					hostname: '*',
					base: '',
					open: true
				}
			}
		}
	});

	grunt.registerTask('develop', [
		'shaderChunks',
		'neuter'
	]);

	grunt.registerTask('build', [
		'develop',
		'uglify'
	]);

	grunt.registerTask('server', function (port) {
		grunt.config('connect.server.options.port', port || 8000);
		grunt.task.run([
			'develop',
			'connect',
			'watch'
		]);
	});

	grunt.registerTask('default', 'server');
};
