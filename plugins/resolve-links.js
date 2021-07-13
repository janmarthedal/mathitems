function isLegalConcept(concept) {
    return /^[a-zA-Z-]+$/.test(concept);
}

function getDefault(map, key, defaultValue) {
    if (map.has(key)) {
        return map.get(key);
    }
    map.set(key, defaultValue);
    return defaultValue;
}

function checkLinks(metadata) {
    const { items } = metadata;
    const itemMap = new Map(items.map(i => [i.id, i]));
    const conceptItems = new Map();
    for (const data of items) {
        let contents = data.contents.toString();
        const defines = new Set();
        const itemRefs = new Set();
        const conceptRefs = new Set();
        const refs = data.refs = {};
        contents.replace(/\[(.*?)\]\((.*?)\)/gm, (match, _text, link) => {
            if (link.startsWith('=')) {
                const concept = link.substring(1);
                if (!isLegalConcept(concept)) {
                    throw new Error('Illegal concept being defined: ' + match);
                }
                if (defines.has(concept)) {
                    throw new Error('Concept defined multiple times in ' + data.id);
                }
                console.log(`${data.id} defines ${concept}`);
                defines.add(concept);
                getDefault(conceptItems, concept, []).push(data);
                return;
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
                    getDefault(conceptItems, conceptRef);
                    return;
                }
            }
            if (!itemRef) {
                throw new Error('Missing item reference: ' + match);
            }
            if (itemRef === data.id) {
                throw new Error('Reference to self not allowed: ' + match);
            }
            const refItemData = itemMap.get(itemRef);
            if (!refItemData) {
                throw new Error('Reference to unknown item: ' + match);
            }
            itemRefs.add(refItemData);
        });
        if (defines.size !== 0) {
            if (data.type !== 'definition') {
                throw new Error('Only Definitions may define');
            }
            refs.defines = [...defines].sort();
        }
        if (itemRefs.size !== 0) {
            refs.itemRefs = [...itemRefs];
        }
        if (conceptRefs.size !== 0) {
            refs.conceptRefs = [...conceptRefs].sort();
        }
        console.log(`${data.id}: ${JSON.stringify(data.refs)}`);
    }
    return conceptItems;
}

function makeConceptPages(files, conceptItems) {
    const conceptData = {};
    for (const [concept, items] of conceptItems) {
        const data = {
            title: concept,
            permalink: `/concept/${concept}/`,
            layout: 'concept.njk',
            items,
            contents: Buffer.from('')
        };
        conceptData[concept] = data;
        files[`concept/${concept}/index.html`] = data;
    }
    return conceptData;
}

function resolveConceptRefs(items, conceptData) {
    for (const { refs } of items) {
        if (refs.defines) {
            refs.defines = refs.defines.map(concept => conceptData[concept]);
        }
        if (refs.conceptRefs) {
            refs.conceptRefs = refs.conceptRefs.map(concept => conceptData[concept]);
        }
    }
}

function resolveLinks(metadata, conceptData) {
    const { items } = metadata;
    const itemMap = new Map(items.map(i => [i.id, i]));
    for (const data of items) {
        let contents = data.contents.toString();
        contents = contents.replace(/\[(.*?)\]\((.*?)\)/gm, (_match, text, link) => {
            if (link.startsWith('=')) {
                return '*' + text + '*';
            }
            const [itemRef, conceptRef] = link.split('#');
            if (conceptRef && !itemRef) {
                return `[${text}](${conceptData[conceptRef].permalink})`;
            }
            const refItemData = itemMap.get(itemRef);
            if (!refItemData.refs.defines.includes(conceptRef)) {
                throw Error(`${data.id}: Item ${itemRef} does not define ${conceptRef}`);
            }
            return conceptRef ? `[${text}](${refItemData.permalink}#${conceptRef})` : `[${text}](${refItemData.permalink})`;
        });
        data.contents = Buffer.from(contents);
    }
}

module.exports = () => function(files, metalsmith, done) {
    try {
        const metadata = metalsmith.metadata();
        const conceptItems = checkLinks(metadata);
        const conceptData = makeConceptPages(files, conceptItems);
        resolveLinks(metadata, conceptData);
        resolveConceptRefs(metadata.items, conceptData);
        for (const item of metadata.items) {
            console.log('item', item.id, item.refs);
        }
        done();
    } catch (error) {
        done(error);
    }
};
