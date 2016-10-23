var gulp = require('gulp');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var del = require('del');
var concat = require('gulp-concat')
var runSequence = require('run-sequence');

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

gulp.task('build:index', function(){
    var mappedPaths = jsNPMDependencies.map(file => {return path.resolve('node_modules', file)}) 
    
    //Let's copy our head dependencies into a dist/libs
    var copyJsNPMDependencies = gulp.src(mappedPaths, {base:'node_modules'})
        .pipe(gulp.dest('dist/libs'))
     
    //Let's copy our index into dist   
    var copyIndex = gulp.src('client/index.html')
        .pipe(gulp.dest('dist'))
    
    var copyIndexDependencies = gulp.src(['client/systemjs.config.js','client/styles.css'])
        .pipe(gulp.dest('dist/libs'))
    
    return [copyJsNPMDependencies, copyIndex,copyIndexDependencies];
});

gulp.task('build:app', function(){
    var tsProject = ts.createProject('client/tsconfig.json');
    var tsResult = gulp.src('client/**/*.ts')
		.pipe(sourcemaps.init())
        .pipe(ts(tsProject))
	return tsResult.js
        .pipe(sourcemaps.write()) 
		.pipe(gulp.dest('dist'))
});

gulp.task('build:server', function(){
    var serverCode = gulp.src('server/**/*')
        .pipe(gulp.dest('dist'))
})
