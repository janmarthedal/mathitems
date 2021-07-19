
module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const { graph } = metalsmith.metadata();
    const conceptMap = {};
    graph.forEachNode(function({ data }) {
        if (data.type === 'concept') {
            conceptMap[data.id] = {
                node: data,
                count: 0
            };
        }
    });
    graph.forEachLink(function(link) {
        if (link.data.type === 'define-concept') {
            const conceptNode = graph.getNode(link.toId);
            const concept = conceptNode.data.id;
            const data = conceptMap[concept];
            data.count += 1;
        }
    });
    const concepts = Object.values(conceptMap);
    concepts.sort((a, b) => a.node.id > b.node.id ? 1 : a.node.id < b.node.id ? -1 : 0);
    files['concepts/index.html'] = {
        title: 'Concepts',
        layout: 'concept-list.njk',
        concepts,
        contents: Buffer.from('')
    };
};
