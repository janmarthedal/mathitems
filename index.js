const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdownit');
const mdKaTeX = require('@iktakahiro/markdown-it-katex');
const prepItems = require('./plugins/prepare-items');

Metalsmith(__dirname)
    .use(prepItems())
    .use(markdown().use(mdKaTeX))
    .use(layouts())
    .build(function (err, files) {
        if (err) { throw err; }
    });
