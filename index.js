const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdownit');
const mdKaTeX = require('@iktakahiro/markdown-it-katex');
const getItems = require('./plugins/get-items');
const resolveLinks = require('./plugins/resolve-links');
const createListPages = require('./plugins/create-list-pages');

Metalsmith(__dirname)
    .metadata({
        sitename: "MathItems"
    })
    .use(getItems())
    .use(resolveLinks())
    .use(createListPages())
    .use(markdown().use(mdKaTeX))
    .use(layouts())
    .build(function (err, files) {
        if (err) { throw err; }
    });
