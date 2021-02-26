const Metalsmith = require('metalsmith');
const markdown = require('metalsmith-markdown');
const layouts = require('metalsmith-layouts');
var extname = require('path').extname;

function prepare(files, metalsmith, done) {
    setImmediate(done);
    for (const [file, data] of Object.entries(files)) {
        const { title } = data;

        if (title && ['D', 'T'].includes(title[0]) && !Number.isNaN(title.substring(1))) {
            data.layout = 'base.njk';
            delete files[file];
            files[title + '/index' + extname(file)] = data;
        }
    }
}

Metalsmith(__dirname)
    .use(prepare)
    .use(markdown())
    .use(layouts())
    .build(function (err, files) {
        if (err) { throw err; }
    });
