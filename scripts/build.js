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
var concat = require('concat');
var UglifyJS = require('uglify-js');

var outDir = process.argv[2]; // the first param after 'node scripts/build.js'
if(!outDir)
  outDir = './dist';

var outJs = path.join(outDir, 'app/js/bundle.js');
var mapJs = outJs + '.map';
var outCss = path.join(outDir, 'app/css/bundle.css');

// ensure the paths to outJs and outCss existed
ensureDir(outJs);
ensureDir(outCss);

//packJS();
//packCSS();
symlinkHtml();

function processIndexFile() {
  // TODO: parse index.html file, get a list of .js files and a list of .css files to feed the 'packJS' and 'packCSS' functions
  // then replace the appropriate 'script' and 'link' tags inside index.html file to reflect the new bundled files
}

function packJS() {
  var result = UglifyJS.minify([
    'bower_components/jquery/dist/jquery.js',
    'bower_components/bootstrap/dist/js/bootstrap.js',
    'bower_components/metisMenu/dist/metisMenu.js',
    'bower_components/angular/angular.js',
    'bower_components/angular-ui-router/release/angular-ui-router.js',
    'bower_components/ocLazyLoad/dist/ocLazyLoad.js',
    'bower_components/startbootstrap-sb-admin-2/dist/js/sb-admin-2.js',
    'app/js/main.js'
  ], {
    comments: true,
    outSourceMap: mapJs,
    mangle: false
  });
  fs.writeFileSync(outJs, result.code);
  fs.writeFileSync(mapJs, result.map);
}

function packCSS() {
  concat([
    'bower_components/bootstrap/dist/css/bootstrap.min.css',
    'bower_components/metisMenu/dist/metisMenu.min.css',
    'bower_components/startbootstrap-sb-admin-2/dist/css/timeline.css',
    'bower_components/startbootstrap-sb-admin-2/dist/css/sb-admin-2.css',
    'bower_components/morrisjs/morris.css',
    'bower_components/font-awesome/css/font-awesome.min.css',
    'app/css/main.css'
  ], outCss, function(error) {
    if(error)
      throw error;
  });
}

function ensureDir(target) {
  var dir = path.parse(target)['dir'];
  mkdirp.sync(dir);
}

function symlinkPublic() {
  var execSync = require('child_process').execSync;
  var destPublic = path.resolve(path.join(outDir, 'public'));
  var linkPublic = 'rm -rf ' + destPublic + ' && ln -s ' + path.join(process.cwd(), 'public') + ' ' + destPublic;
  console.log(linkPublic);
  var child = execSync(linkPublic);
}

function symlinkBowerComponents() {
  var execSync = require('child_process').execSync;
  var destBower = path.resolve(path.join(outDir, 'bower_components'));
  var linkBower = 'rm -rf ' + destBower + ' && ln -s ' + path.join(process.cwd(), 'bower_components') + ' ' + destBower;
  console.log(linkBower);
  var child = execSync(linkBower);
}

// here we just symlink the whole app/html directory
// without needing to preprocess any file
function symlinkHtml() {
  var execSync = require('child_process').execSync;
  var dest = path.resolve(path.join(outDir, 'app/html'));
  ensureDir(dest); // it's okay to ensure html/ exists, next we're going to 'rm -rf' it anyway, then put a symlink there
  var cmd = 'rm -rf ' + dest + ' && ln -s ' + path.join(process.cwd(), 'app/html') + ' ' + dest;
  console.log(cmd);
  var child = execSync(cmd);
}