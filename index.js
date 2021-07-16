const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdownit');
const mdKaTeX = require('@iktakahiro/markdown-it-katex');
const getItems = require('./plugins/get-items');
const createLinks = require('./plugins/create-links');
const createListPages = require('./plugins/create-list-pages');
const decorateNodes = require('./plugins/decorate-nodes');
const resolveLinks = require('./plugins/resolve-links');

// should not end with /
const BASE_PATH = '';

function url(path) {
    return BASE_PATH + path;
}

Metalsmith(__dirname)
    .metadata({
        sitename: "MathItems",
        basePath: BASE_PATH
    })
    .source('./src')
    .destination('./build')
    .clean(true)
    .use(getItems())
    .use(createLinks())
    .use(decorateNodes())
    .use(resolveLinks())
    .use(createListPages())
    .use(markdown().use(mdKaTeX))
    .use(layouts({
        engineOptions: {
            filters: {
                url
            }
        }
    }))
    .build(function (err, _files) {
        if (err) { throw err; }
    });
