function generateDownloadLink (opt) {
  var throwError = function(name) {
    throw new Error('No ' + name + ' provided to generate-download-link.');
  };

  var data = opt.data || throwError('data');
  var title = opt.title || throwError('title');
  var filename = opt.filename || throwError('filename');

  var anchor = document.createElement('a');

  var attachDataAsOctetStream = function(data) {
    var link = 'data:application/octet-stream,' + encodeURIComponent(data);
    anchor.setAttribute('href', link);
  };

  var setFilename = function(filename) {
    anchor.setAttribute('download', filename);
  };

  var setTitle = function(title) {
    anchor.appendChild(document.createTextNode(title));
  };

  // creates
  // <a href="data:application/octet-stream,DATA" download="FILENAME">TITLE</a>

  attachDataAsOctetStream(data);
  setFilename(filename);
  setTitle(title);

  return anchor;
}
