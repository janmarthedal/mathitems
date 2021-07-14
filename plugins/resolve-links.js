const { isItemNode } = require('../lib/common');

function resolveLinks(graph) {
    graph.forEachNode(({ data }) => {
        if (!isItemNode(data)) {
            return;
        }
        let contents = data.contents.toString();
        contents = contents.replace(/\[(.*?)\]\((.*?)\)/gm, (_match, text, link) => {
            if (link.startsWith('=')) {
                return '*' + text + '*';
            }
            const [itemRef, conceptRef] = link.split('#');
            if (conceptRef && !itemRef) {
                const conceptNode = graph.getNode('concept:' + conceptRef);
                return `[${text}](${conceptNode.data.permalink})`;
            }
            const refItemData = graph.getNode('item:' + itemRef).data;
            if (!refItemData.refs.defines.map(d => d.id).includes(conceptRef)) {
                throw Error(`${data.id}: Item ${itemRef} does not define ${conceptRef}`);
            }
            return conceptRef ? `[${text}](${refItemData.permalink}#${conceptRef})` : `[${text}](${refItemData.permalink})`;
        });
        data.contents = Buffer.from(contents);
    });
}

module.exports = () => function(_files, metalsmith, done) {
    setImmediate(done);
    const { graph } = metalsmith.metadata();
    resolveLinks(graph);
};
