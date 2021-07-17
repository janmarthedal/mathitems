function isItemNode(data) {
    return ['definition', 'theorem', 'proof'].includes(data.type);
}

function forEachOutgoingNode(graph, nodeId, callback) {
    graph.forEachLinkedNode(nodeId, callback, true);
}

function forEachIngoingNode(graph, nodeId, callback) {
    graph.forEachLinkedNode(nodeId, (linkedNode, link) => {
        if (link.toId === nodeId) {
            callback(linkedNode, link);
        }
    });
}

module.exports = {
    isItemNode,
    forEachOutgoingNode,
    forEachIngoingNode
};
