const { isItemNode, forEachOutgoingNode, forEachIngoingNode } = require('../lib/common');

function decorateItem(data, graph) {
    const itemNodeId = 'item:' + data.id;
    const defines = [];
    const conceptRefs = [];
    const itemRefs = [];
    forEachOutgoingNode(graph, itemNodeId, function(linkedNode, link) {
        if (linkedNode.data.type === 'concept' && link.data.type === 'define-concept') {
            defines.push(linkedNode.data);
        }
        if (linkedNode.data.type === 'concept' && link.data.type === 'use-concept') {
            conceptRefs.push(linkedNode.data);
        }
        if (isItemNode(linkedNode.data) && link.data.type === 'use-item') {
            itemRefs.push(linkedNode.data);
        }
    });
    data.refs = {
        defines: defines.length !== 0 ? defines : undefined,
        conceptRefs: conceptRefs.length !== 0 ? conceptRefs : undefined,
        itemRefs: itemRefs.length !== 0 ? itemRefs : undefined
    };
}

function decorateConcept(data, graph) {
    const conceptNodeId = 'concept:' + data.id;
    const items = [];
    forEachIngoingNode(graph, conceptNodeId, function(linkedNode, link) {
        if (isItemNode(linkedNode.data) && link.data.type === 'define-concept') {
            items.push(linkedNode.data);
        }
    });
    data.items = items;
}

module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const { graph } = metalsmith.metadata();
    for (const data of Object.values(files)) {
        switch (data.type) {
            case 'definition':
            case 'theorem':
                decorateItem(data, graph);
                break;
            case 'concept':
                decorateConcept(data, graph);
                break;
        }
    }
};
