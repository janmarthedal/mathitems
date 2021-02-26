const { extname } = require('path');
const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdownit');
const mdKaTeX = require('@iktakahiro/markdown-it-katex');

const SHORT_TO_TYPE = {
    'D': 'Definition',
    'T': 'Theorem'
};

function prepare(files, metalsmith, done) {
    setImmediate(done);
    const items = {};
    for (const [file, data] of Object.entries(files)) {
        const { title } = data;

        if (title && SHORT_TO_TYPE[title[0]] && !Number.isNaN(title.substring(1))) {
            data.item = {
                name: title,
                extension: extname(file)
            };
            data.title = SHORT_TO_TYPE[title[0]] + ' ' + title;
            data.layout = 'mathpage.njk';
            delete files[file];
            items[title] = data;
        }
    }
    for (const [name, data] of Object.entries(items)) {
        files[name + '/index' + data.item.extension] = data;
    }
}

Metalsmith(__dirname)
    .use(prepare)
    .use(markdown().use(mdKaTeX))
    .use(layouts())
    .build(function (err, files) {
        if (err) { throw err; }
    });
