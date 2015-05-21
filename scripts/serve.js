var superstatic = require('superstatic').server;

var root = process.argv[2]; // first param after 'node test/serve.js'
if(!root)
  root = '../'; // with cwd being __dirname, this will point to the root directory of the project (default serving dir)

var port = process.argv[3]; // second param after 'node test/serve.js'
if(!port)
  port = 3474;

var spec = {
  port: port,
  config: {
    root: root,
    routes: {
      '**': 'index.html'
    }
  },
  cwd: __dirname,
  gzip: true,
  debug: true
};

var app = superstatic(spec);
var server = app.listen(function (err) {
  console.log('Superstatic now serving root '+spec.config.root+' on port '+spec.port+'...');
});
