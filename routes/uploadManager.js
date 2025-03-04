var options = {
    tmpDir:  __dirname + '/../public/uploaded/tmp',
    uploadDir: __dirname + '/../public/uploaded/files',
    uploadUrl:  '/uploaded/files/',
    maxPostSize: 11000000000, // 11 GB
    minFileSize:  1,
    maxFileSize:  10000000000, // 10 GB
    acceptFileTypes:  /.+/i,
    // Files not matched by this regular expression force a download dialog,
    // to prevent executing any scripts in the context of the service domain:
    inlineFileTypes:  /\.(gif|jpe?g|png)/i,
    imageTypes:  /\.(gif|jpe?g|png)/i,
    imageVersions: {
        width:  80,
        height: 80
    },
    accessControl: {
        allowOrigin: '*',
        allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
        allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
    },
    storage : {
        type : 'local'
    }
};

var uploader = require('blueimp-file-upload-expressjs')(options);

module.exports = function (router) {
    router.get('/upload', function (req, res) {
        uploader.get(req, res, function (obj) {
            res.redirect('/files');
        });
    });
 
    router.post('/upload', function (req, res) {
        uploader.post(req, res, function (obj) {
            res.redirect('/files');
        });
    });
 
    router.delete('/uploaded/files/:name', function (req, res) {
        uploader.delete(req, res, function (obj) {
            res.redirect('/files');
        });
    });
    return router;
}
