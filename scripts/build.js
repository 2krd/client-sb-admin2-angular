/* this will be our build process for the particular Bootstrap Angular Style by Akakalab
 *
 * 1. Handpick all .js and .css references in index.html file 
 *    and app/css/*.css and app/js/*.js,
 *    concatenate, minify and uglify them all into dist/app/js/bundle.js and dist/app/css/bundle.css
 * 2. Replace all references in index.html file (where appropriate)
 *    so that there will be only 2 entries left (app/js/bundle.js & app/css/bundle.css),
 *    then write this new file into dist/index.html
 * 3. Copy app/html into dist/app/html
 * 4. Copy public into dist/public
 */

var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var exorcist = require('exorcist');
var browserify = require('browserify');
var concat = require('concat');

var outDir = process.argv[2]; // the first param after 'node scripts/build.js'
if(!outDir)
  outDir = './dist';

var outJs = path.join(outDir, 'app/js/bundle.js');
var mapJs = outJs + '.map';
var outCss = path.join(outDir, 'app/css/bundle.css');

// ensure the paths to outJs and outCss existed
ensureDir(outJs);
ensureDir(outCss);

var browserifyOpts = {
  bundleExternal: false,
  detectGlobals: false,
  debug: true,
  commondir: false
};

packJS();
packCSS();

function processIndexFile() {
  // TODO: parse index.html file, get a list of .js files and a list of .css files to feed the 'packJS' and 'packCSS' functions
  // then replace the appropriate 'script' and 'link' tags inside index.html file to reflect the new bundled files
}

function packJS() {
  browserify([
    'bower_components/jquery/dist/jquery.min.js',
    'bower_components/bootstrap/dist/js/bootstrap.min.js',
    'bower_components/metisMenu/dist/metisMenu.js', // TODO: minify this first
    'bower_components/angular/angular.js',
    'bower_components/angular-ui-router/release/angular-ui-router.js',
    'bower_components/ocLazyLoad/dist/ocLazyLoad.js',
    'bower_components/startbootstrap-sb-admin-2/dist/js/sb-admin-2.js',
    'app/js/main.js'
  ], browserifyOpts)
  .bundle()
  .pipe(exorcist(mapJs))
  .pipe(fs.createWriteStream(outJs, 'utf8'));
}

function packCSS() {
  concat([
    'bower_components/bootstrap/dist/css/bootstrap.min.css',
    'bower_components/metisMenu/dist/metisMenu.min.css',
    'bower_components/startbootstrap-sb-admin-2/dist/css/timeline.css',
    'bower_components/startbootstrap-sb-admin-2/dist/css/sb-admin-2.css',
    'bower_components/morrisjs/morris.css',
    'bower_components/font-awesome/css/font-awesome.min.css'
  ], outCss, function(error) {
    if(error)
      throw error;
  });
}

function ensureDir(target) {
  var dir = path.parse(target)['dir'];
  mkdirp.sync(dir);
}