const { isItemNode } = require('./common');

function isLegalConcept(concept) {
    return /^[a-zA-Z-]+$/.test(concept);
}

function makeConceptNode(concept, graph, files) {
    const conceptNodeId = 'concept:' + concept;
    if (!graph.getNode(conceptNodeId)) {
        const data = {
            title: concept,
            id: concept,
            type: 'concept',
            permalink: `/concept/${concept}/`,
            layout: 'concept.njk',
            contents: Buffer.from('')
        };
        graph.addNode(conceptNodeId, data);
        files[`concept/${concept}/index.html`] = data;
    }
    return conceptNodeId;
}

function createLinks(files, graph) {
    graph.forEachNode(({ data }) => {
        if (!isItemNode(data)) {
            return;
        }
        const itemNodeId = 'item:' + data.id;
        let contents = data.contents.toString();

        contents.replace(/\[(.*?)\]\((.*?)\)/gm, (match, _text, link) => {
            if (link.startsWith('=')) {
                if (data.type !== 'definition') {
                    throw new Error('Only Definitions may define');
                }
                const concept = link.substring(1);
                if (!isLegalConcept(concept)) {
                    throw new Error('Illegal concept being defined: ' + match);
                }
                const conceptNodeId = makeConceptNode(concept, graph, files);
                if (graph.getLink(itemNodeId, conceptNodeId)) {
                    throw new Error('Concept defined multiple times in ' + data.id);
                }
                graph.addLink(itemNodeId, conceptNodeId, { type: 'define-concept' });
                console.log(`${data.id} defines ${concept}`);
                return;
            }
            const linkParts = link.split('#');
            if (linkParts.length > 2) {
                throw new Error('Illegal reference: ' + match);
            }
            const [itemRef, conceptRef] = linkParts;
            if (!itemRef && !conceptRef) {
                throw new Error('No item or concept reference: ' + match);
            }
            if (conceptRef) {
                if (!isLegalConcept(conceptRef)) {
                    throw new Error('Illegal concept being referenced: ' + match);
                }
                const conceptNodeId = makeConceptNode(conceptRef, graph, files);
                graph.addLink(itemNodeId, conceptNodeId, { type: 'use-concept' });
                console.log(`${data.id} uses concept ${conceptRef}`);
                if (!itemRef) {
                    return;
                }
            }
            if (itemRef === data.id) {
                throw new Error('Reference to self not allowed: ' + match);
            }
            const toItemNodeId = 'item:' + itemRef;
            const toItemNode = graph.getNode(toItemNodeId);
            if (!toItemNode) {
                throw new Error('Reference to unknown item: ' + match);
            }
            graph.addLink(itemNodeId, toItemNodeId, { type: 'use-item' });
            console.log(`${data.id} uses item ${itemRef}`);
        });
    });
}

module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const { graph } = metalsmith.metadata();
    createLinks(files, graph);
};
