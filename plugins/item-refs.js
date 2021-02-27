function isLegalConcept(concept) {
    return /^[a-zA-Z-]+$/.test(concept);
}

function process(items) {
    const itemMap = new Map(items.map(i => [i.item.name, i]));
    for (const data of items) {
        let contents = data.contents.toString();
        const defines = new Set();
        const itemRefs = new Set();
        const conceptRefs = new Set();
        contents = contents.replace(/\[(.*?)\]\((.*?)\)/gm, (match, text, link) => {
            if (link[0] === '=') {
                const concept = link.substring(1);
                if (!isLegalConcept(concept)) {
                    throw new Error('Illegal concept being defined: ' + match);
                }
                defines.add(concept);
                return '*' + text + '*';
            }
            const linkParts = link.split('#');
            if (linkParts.length > 2) {
                throw new Error('Illegal reference: ' + match);
            }
            const [itemRef, conceptRef] = linkParts;
            if (conceptRef) {
                if (!isLegalConcept(conceptRef)) {
                    throw new Error('Illegal concept being referenced: ' + match);
                }
                if (!itemRef) {
                    conceptRefs.add(conceptRef);
                    return `[${text}](/concept/${conceptRef}/)`;
                }
            }
            if (!itemRef) {
                throw new Error('Missing item reference: ' + match);
            }
            if (itemRef === data.item.name) {
                throw new Error('Reference to self not allowed: ' + match);
            }
            const refItemData = itemMap.get(itemRef);
            if (!refItemData) {
                throw new Error('Reference to unknown item: ' + match);
            }
            itemRefs.add(refItemData);
            return conceptRef ? `[${text}](${refItemData.permalink}#${conceptRef})` : `[${text}](${refItemData.permalink})`;
        });
        if (defines.size !== 0) {
            if (data.item.type !== 'D') {
                throw new Error('Only Definitions may define');
            }
            data.item.defines = [...defines].sort();
        }
        if (itemRefs.size !== 0) {
            data.item.itemRefs = [...itemRefs].sort();
        }
        if (conceptRefs.size !== 0) {
            data.item.conceptRefs = [...conceptRefs].sort();
        }
        data.contents = Buffer.from(contents);
    }
}

module.exports = () => function(_files, metalsmith, done) {
    try {
        process(metalsmith.metadata().items);
        done();
    } catch (error) {
        done(error);
    }
};
