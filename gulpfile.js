var gulp = require('gulp');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var del = require('del');
var concat = require('gulp-concat')
var runSequence = require('run-sequence');
var nodemon = require('gulp-nodemon')
var bs = require('browser-sync').create();


// SERVER
gulp.task('clean', function(){
    return del('dist')
});



/*
  jsNPMDependencies, sometimes order matters here! so becareful!
*/
var jsNPMDependencies = [
    'core-js/client/shim.min.js',
    'zone.js/dist/zone.js',
    'reflect-metadata/Reflect.js',
    'systemjs/dist/system.src.js'
] 

gulp.task('dependencies:client', function(){
    var mappedPaths = jsNPMDependencies.map(file => {return path.resolve('node_modules', file)}) 
    
    //Let's copy our head dependencies into a dist/libs
    var copyJsNPMDependencies = gulp.src(mappedPaths, {base:'node_modules'})
        .pipe(gulp.dest('dist/libs'))
        
    var stylesheet = gulp.src('client/styles.css')
	   .pipe(gulp.dest('dist/app'))
	
	var node_modules = gulp.src('node_modules/@angular/**/*.js')
	   .pipe(gulp.dest('dist/node_modules/@angular'))
	   
    node_modules = gulp.src('node_modules/rxjs/**/*.js')
        .pipe(gulp.dest('dist/node_modules/rxjs'))
        

});

gulp.task('deploy:client',function(){
    
    //Let's copy our index into dist   
    var copyIndex = gulp.src('client/index.html')
        .pipe(gulp.dest('dist'))
        
    var tsProject = ts.createProject('client/tsconfig.json');
    var tsResult = gulp.src('client/**/*.ts')
		.pipe(sourcemaps.init())
        .pipe(ts(tsProject))
	return tsResult.js
        .pipe(sourcemaps.write()) 
		.pipe(gulp.dest('dist'))
})

gulp.task('run:source-watch',function(){
    gulp.watch('./client/**/*.ts',['deploy:client'])
    gulp.watch('./server/**/*.js',['deploy:server'])
})

// the real stuff
gulp.task('run:server', ['build','run:source-watch','nodemon'], function () {
	gulp.watch('./dist/app', bs.reload);
	gulp.watch(['./dist/routes/**/*.js', './dist/app.js', './dist/bin/www'], ['bs-delay']);
});

gulp.task('deploy:server', function(){
    var serverCode = gulp.src('server/**/*')
        .pipe(gulp.dest('dist'))
})

// give nodemon time to restart
gulp.task('bs-delay', function () {
  setTimeout(function () {
    bs.reload({ stream: false });
  }, 2000);
});

// our browser-sync config + nodemon chain
gulp.task('browser-sync', ['nodemon'], function() {
	bs.init(null, {
		port: 5000,
	});
});

// our gulp-nodemon task
gulp.task('nodemon', function (cb) {
	var started = false;
	return nodemon({
		script: './dist/bin/www',
		ext: 'js',
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


gulp.task('build', function(callback){
    runSequence('clean','dependencies:client', 'deploy:client', 'deploy:server', callback);
});


