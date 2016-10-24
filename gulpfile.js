var gulp = require('gulp');
var nodemon = require('gulp-nodemon')


// our gulp-nodemon task
gulp.task('nodemon', function (cb) {
	var started = false;
	return nodemon({
	    exec: 'node --inspect=5000 ./server/bin/www',
		script: './server/bin/www',
		ext: 'js jade',
		env: {
			'NODE_ENV': 'development',
			'DEBUG': 'appname:*'
	   }
	}).on('start', function () {
		//avoid nodemon being started multiple times
		if (!started) {
			cb();
			started = true;
		}
	})
	.on('crash', function() {
		// console.log('nodemon.crash');
	})
	.on('restart', function() {
		// console.log('nodemon.restart');
	})
	.once('quit', function () {
		// handle ctrl+c without a big weep
		process.exit();
	});
});


