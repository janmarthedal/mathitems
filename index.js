const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdownit');
const mdKaTeX = require('@iktakahiro/markdown-it-katex');
const itemFetch = require('./plugins/item-fetch');
const itemRefs = require('./plugins/item-refs');

Metalsmith(__dirname)
    .metadata({
        sitename: "MathItems"
    })
    .use(itemFetch())
    .use(itemRefs())
    .use(markdown().use(mdKaTeX))
    .use(layouts())
    .build(function (err, files) {
        if (err) { throw err; }
    });
