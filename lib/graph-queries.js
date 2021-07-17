const { isItemNode, forEachOutgoingNode, forEachIngoingNode } = require('./common');

function filterOutgoingNodes(graph, itemId, fun) {
    const result = [];
    forEachOutgoingNode(graph, 'item:' + itemId, function(toNode, link) {
        if (fun(toNode, link)) {
            result.push(toNode.data);
        }
    });
    return result;
}

function itemDefines(graph, id) {
    return filterOutgoingNodes(graph, id, (toNode, link) => toNode.data.type === 'concept' && link.data.type === 'define-concept');
}

function itemConceptRefs(graph, id) {
    return filterOutgoingNodes(graph, id, (toNode, link) => toNode.data.type === 'concept' && link.data.type === 'use-concept');
}

function itemItemRefs(graph, id) {
    return filterOutgoingNodes(graph, id, (toNode, link) => isItemNode(toNode.data) && link.data.type === 'use-item');
}

function conceptDefinedBy(graph, conceptId) {
    const conceptNodeId = 'concept:' + conceptId;
    const items = [];
    forEachIngoingNode(graph, conceptNodeId, function(linkedNode, link) {
        if (isItemNode(linkedNode.data) && link.data.type === 'define-concept') {
            items.push(linkedNode.data);
        }
    });
    return items;
}

function itemDefinesConcept(graph, itemId, concept) {
    const link = graph.getLink('item:' + itemId, 'concept:' + concept);
    return link && link.data.type === 'define-concept';
}

module.exports = {
    itemDefines,
    itemConceptRefs,
    itemItemRefs,
    itemDefinesConcept,
    conceptDefinedBy,
};
