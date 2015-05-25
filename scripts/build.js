/* This is our build process for SB Admin 2 AngularJS-based by Akakalab R&D
 * The philosophies and standards here might not be the best for all / other front-end
 * projects out there as we try to make it work best for the particular case:
 * combining SB Admin 2 & AngularJS. The general process is as follow:
 *
 * 1. Handpick all .js and .css references in index.html file 
 *    (which should include the bower_components files, app/css/*.css and app/js/*.js), then
 *    concatenate, minify and uglify them all into ./dist/app/js/bundle.js and ./dist/app/css/bundle.css
 * 2. Replace all said references in index.html file with app/js/bundle.js & app/css/bundle.css,
 *    then write this new file into <outDir>/index.html
 * 3. Copy/Symlink ./app/html into <outDir>/app/html
 * 4. Copy/Symlink ./public into <outDir>/public
 * 5. Copy/Symlink ./bower_components into <outDir>/bower_components
 *
 */

var fs = require('fs');
var jsdom = require('jsdom');
var mkdirp = require('mkdirp');
var path = require('path');
var concat = require('concat');
var UglifyJS = require('uglify-js');

var outDir = process.argv[2]; // the first param after 'node scripts/build.js'
if(!outDir)
  outDir = './dist';

// general rule: build script ALWAYS outputs process results, 
// but ONLY outputs certain debug info if verbose is true
// please respect this rule as you develop on top of this build script
var verbose = process.argv[3] || false; // the second param after 'node scripts/build.js'

var outHtml = path.join(outDir, 'index.html'); // path to output index.html file (relative to project root)
var bundledJs = 'app/js/bundle.js';
var outJs = path.join(outDir, bundledJs); // path to output bundle.js file (relative to project root)
var mapJs = outJs + '.map'; // path to output bundle.js.map file (relative to project root)
var bundledCss = 'app/css/bundle.css';
var outCss = path.join(outDir, bundledCss); // path to output bundle.css file (relative to project root)

// ensure the paths to outJs and outCss existed
ensureDir(outHtml);
ensureDir(outJs);
ensureDir(outCss);

processIndexFile(function(err, data) {
  
  if(err)
    throw err;
  
  // TODO: parallelize these (where applicable)

  packJS(data['jsFiles']);
  packCSS(data['cssFiles']);

  symlink('public');
  symlink('bower_components');
  symlink('app/html');

});

/*
 * parse index.html file, get a list of .js files and a list of .css files to feed the 'packJS' and 'packCSS' processes;
 * replace the appropriate 'script' and 'link' tags inside index.html file to reflect the new bundled files
 * then do some more optimizations (minify, uglify) and output the new index.html file to outDir
 *
 * TODO: output proper error messages when jQuery lib cannot be found
 * or any other error reported by jsdom
 */
function processIndexFile(callback) {
  var indexFile = fs.readFileSync('index.html', 'utf-8');
  var jquery = fs.readFileSync('bower_components/jquery/dist/jquery.js', 'utf-8');
  jsdom.env({
    html: indexFile,
    src: [jquery],
    done: function(err, window) {
      if(err)
        throw err;
      
      var $ = window.$;
      var document = window.document.defaultView.document;

      // remove all comments except the HTML5 compatibility hack for IE browsers
      $("*").
      contents().
      filter(function() {return this.nodeType === 8 && this.nodeValue.indexOf('html5shiv.js') === -1;})
      .remove();

      // remove all <link> tags (external CSS files) and place in only 1 file: the bundledCss
      var css = [];
      $("link").each(function(index, stuff, arr) {
        css.push(stuff.href); // place the referenced file path into an array for use later
        $(stuff).remove();
      });
      $("head").append("<link rel='stylesheet' type='text/css' href='"+bundledCss+"'>");
      
      // remove all <script> tags (external JS files) and place in only 1 file: the bundledJs
      var js = [];
      $("script").each(function(index, stuff, arr) {
        js.push(stuff.src); // place the referenced file path into an array for use later
        $(stuff).remove();
      });
      $("head").append("<script type='text/javascript' src='"+bundledJs+"'></script>");
      
      // write the optimized index.html file out into outDir
      var out = jsdom.serializeDocument(document);
      // thanks Jake for taking your time to dig the following out for us :), more info here: http://jaketrent.com/post/remove-whitespace-html-javascript/
      out = out
      .replace(/\n/g, "")
      .replace(/[\t ]+\</g, "<")
      .replace(/\>[\t ]+\</g, "><")
      .replace(/\>[\t ]+$/g, ">");

      if(verbose) {
        console.log('---- Writing optimized index.html ----');
        console.log(out);
        console.log('');
      }
      
      fs.writeFile(outHtml, out, function(err, res) {
        
        // just to save as much memory as possible
        window.close();
        
        // be friendly shall we?
        if(!err)
          console.log('optimized index.html written to '+outHtml+'\r\n');
        
        // now go on with the build process
        callback(err, {
          jsFiles: js,
          cssFiles: css
        });

      });
    }
  }); 
}

// TODO: mangle without causing angular (and related) errors
function packJS(jsFiles) {
  
  if(!jsFiles)
    throw new Error('Supplied .js files cannot be null');
  if(jsFiles.length == 0)
    console.log('++++ Warning: no .js files were marked for bundling ++++');
  
  var result = UglifyJS.minify(jsFiles, {
    comments: false,
    outSourceMap: mapJs,
    mangle: false
  });
  fs.writeFile(outJs, result.code, function(err, res) {
    if(err)
      throw err;
    fs.writeFile(mapJs, result.map, function(err, res) {
      if(err)
        throw err;
      console.log('js files packed into '+outJs+' and '+mapJs+'\r\n');
    });
  });
}

// TODO: cssmin these
function packCSS(cssFiles) {
  
  if(!cssFiles)
    throw new Error('Supplied .css files cannot be null');
  if(cssFiles.length == 0)
    console.log('++++ Warning: no .css files were marked for bundling ++++');
  
  concat(cssFiles, outCss, function(error) {
    if(error)
      throw error;
    // special handing of FontAwesome loading
    var exec = require('child_process').exec;
    var cmd = "sed -i '' 's#../fonts/fontawesome-webfont#/bower_components/font-awesome/fonts/fontawesome-webfont#g' " + outCss;
    
    if(verbose) {
      console.log('---- Handling fontawesome references in bundled css ----');
      console.log(cmd);
      console.log('');
    }
    
    var child = exec(cmd, null, function(err, res) {
      if(err)
        throw err;
      console.log('css files packed into '+outCss+'\r\n');
    });
  });
}

/*
 * helper function to make sure the target
 * directory always exists
 * (this will work if the target is a file too)
 */
function ensureDir(target) {
  var dir = path.parse(target)['dir'];
  mkdirp.sync(dir);
}

/*
 * this will simply put a symlink inside outDir that points
 * to the target being passed in as the parameter
 * for example it would point ./dist/app/html to ./app/html
 * we do this ONLY if we don't want any preprocessing
 *
 * @param target string path to directory/file we want to symlink
 * for example: 'app/html' or 'public' or 'bower_components'
 */
function symlink(target) {
  var exec = require('child_process').exec;
  var dest = path.resolve(path.join(outDir, target));
  ensureDir(dest); // it's okay to ensure target exists, next we're going to 'rm -rf' it anyway, then put an actual symlink there
  var cmd = 'rm -rf ' + dest + ' && ln -s ' + path.join(process.cwd(), target) + ' ' + dest;
  
  if(verbose) {
    console.log('---- Removing old symlink ----');
    console.log(cmd);
    console.log('');
  }
  
  var child = exec(cmd, null, function(err, res) {
    if(err)
      throw err;
    console.log('symlink to '+target+' created\r\n');
  });
}