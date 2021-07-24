const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdownit');
const less = require('metalsmith-less')
const createGraph = require('ngraph.graph');
const mdKaTeX = require('@iktakahiro/markdown-it-katex');
const getItems = require('./plugins/get-items');
const getSources = require('./plugins/get-sources');
const createLinks = require('./plugins/create-links');
const itemListPages = require('./plugins/item-list-pages');
const resolveLinks = require('./plugins/resolve-links');
const validationLinks = require('./plugins/validation-links');
const conceptsListPage = require('./plugins/concepts-list-page');
const { itemDefines, itemConceptRefs, itemItemRefs, itemValidations, conceptDefinedBy } = require('./lib/graph-queries');

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
    .use(validationLinks())
    .use(resolveLinks())
    .use(itemListPages())
    .use(conceptsListPage())
    .use(markdown().use(mdKaTeX))
    .use(layouts({
        engineOptions: {
            filters: {
                url,
                itemDefines: id => itemDefines(graph, id),
                itemConceptRefs: id => itemConceptRefs(graph, id),
                itemItemRefs: id => itemItemRefs(graph, id),
                itemValidations: id => itemValidations(graph, id),
                conceptDefinedBy: id => conceptDefinedBy(graph, id),
                formatDate: date => date.toISOString().substring(0, 16).replace('T', ' '),
            }
        }
    }))
    .use(less())
    .build(function (err, _files) {
        if (err) { throw err; }
    });
