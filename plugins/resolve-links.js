const { isItemNode } = require('../lib/common');
const { itemDefinesConcept } = require('../lib/graph-queries');

function resolveLinks(graph, basePath) {
    graph.forEachNode(({ data }) => {
        if (!isItemNode(data)) {
            return;
        }
        let contents = data.contents.toString();
        contents = contents.replace(/(!?)\[(.*?)\]\((.*?)\)/gm, (_match, bang, text, link) => {
            if (bang) {
                const mediaNode = graph.getNode('media:' + link);
                return `![${text || link}](${mediaNode.data.path})`;
            }
            if (link.startsWith('=')) {
                return '*' + text + '*';
            }
            const [itemRef, conceptRef] = link.split('#');
            if (conceptRef && !itemRef) {
                const conceptNode = graph.getNode('concept:' + conceptRef);
                return `[${text}](${basePath}${conceptNode.data.permalink})`;
            }
            const refItemData = graph.getNode('item:' + itemRef).data;
            if (conceptRef && !itemDefinesConcept(graph, itemRef, conceptRef)) {
                throw Error(`${data.id}: Item ${itemRef} does not define ${conceptRef}`);
            }
            return conceptRef ? `[${text}](${basePath}${refItemData.permalink}#${conceptRef})` : `[${text}](${basePath}${refItemData.permalink})`;
        });
        data.contents = Buffer.from(contents);
    });
}

module.exports = () => function(_files, metalsmith, done) {
    setImmediate(done);
    const { graph, basePath } = metalsmith.metadata();
    resolveLinks(graph, basePath);
};
