const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdownit');
const less = require('metalsmith-less')
const createGraph = require('ngraph.graph');
const mdKaTeX = require('@iktakahiro/markdown-it-katex');
const getItems = require('./plugins/get-items');
const getSources = require('./plugins/get-sources');
const createLinks = require('./plugins/create-links');
const createListPages = require('./plugins/create-list-pages');
const decorateNodes = require('./plugins/decorate-nodes');
const resolveLinks = require('./plugins/resolve-links');

// BASE_PATH should not end with slash
const BASE_PATH = '';
const graph = createGraph();

function url(path) {
    return BASE_PATH + path;
}

Metalsmith(__dirname)
    .metadata({
        sitename: "MathItems",
        basePath: BASE_PATH,
        graph
    })
    .source('./src')
    .destination('./build')
    .clean(true)
    .use(getItems())
    .use(getSources())
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
    .use(less())
    .build(function (err, _files) {
        if (err) { throw err; }
    });
