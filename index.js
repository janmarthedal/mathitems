const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdownit');
const mdKaTeX = require('@iktakahiro/markdown-it-katex');
const getItems = require('./plugins/get-items');
const createLinks = require('./plugins/create-links');
const createListPages = require('./plugins/create-list-pages');
const decorateNodes = require('./plugins/decorate-nodes');
const resolveLinks = require('./plugins/resolve-links');

function sourceShort(source) {
    return `<a href="${source.permalink}">${source.title}</a>`;
}

Metalsmith(__dirname)
    .metadata({
        sitename: "MathItems"
    })
    .use(getItems())
    .use(createLinks())
    .use(decorateNodes())
    .use(resolveLinks())
    .use(createListPages())
    .use(markdown().use(mdKaTeX))
    .use(layouts({
        engineOptions: {
            filters: {
                sourceShort
            }
        }
    }))
    .build(function (err, _files) {
        if (err) { throw err; }
    });
