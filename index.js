const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdownit');
const mdKaTeX = require('@iktakahiro/markdown-it-katex');
const getItems = require('./plugins/get-items');
const resolveLinks = require('./plugins/resolve-links');
const createListPages = require('./plugins/create-list-pages');
const getSources = require('./plugins/get-sources');

function sourceShort(source) {
    return `<a href="${source.permalink}">${source.data.title}</a>`;
}

Metalsmith(__dirname)
    .metadata({
        sitename: "MathItems"
    })
    .use(getSources())
    .use(getItems())
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
