function getItemListOfType(graph, type) {
    const items = [];
    graph.forEachNode(function({ data }) {
        if (data.type === type) {
            items.push(data);
        }
    });
    return items;
}

module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const { graph } = metalsmith.metadata();
    files['definitions/index.html'] = {
        title: 'Definitions',
        layout: 'item-list.njk',
        items: getItemListOfType(graph, 'definition'),
        contents: Buffer.from('')
    };
    files['theorems/index.html'] = {
        title: 'Theorems',
        layout: 'item-list.njk',
        items: getItemListOfType(graph, 'theorem'),
        contents: Buffer.from('')
    };
};
