const { extname } = require('path');

const SHORT_TO_TYPE = {
    'D': 'Definition',
    'T': 'Theorem'
};

function isLegalConcept(concept) {
    return /^[a-zA-Z-]+$/.test(concept);
}

function process(files) {
    const items = {};
    for (const [file, data] of Object.entries(files)) {
        const { title } = data;

        if (title && SHORT_TO_TYPE[title[0]] && !Number.isNaN(title.substring(1))) {
            data.item = {
                type: title[0],
                name: title,
                extension: extname(file)
            };
            data.title = SHORT_TO_TYPE[title[0]] + ' ' + title;
            data.layout = 'mathpage.njk';
            delete files[file];
            items[title] = data;
        }
    }
    for (const [name, data] of Object.entries(items)) {
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
            const refItems = link.split('#');
            if (refItems.length > 2) {
                throw new Error('Illegal reference: ' + match);
            }
            const [item, concept] = refItems;
            if (concept) {
                if (!isLegalConcept(concept)) {
                    throw new Error('Illegal concept being referenced: ' + match);
                }
                if (!item) {
                    conceptRefs.add(concept);
                    return `[${text}](/concept/${concept}/)`;
                }
            }
            if (!item) {
                throw new Error('Missing item reference: ' + match);
            }
            if (item === name) {
                throw new Error('Reference to self not allowed: ' + match);
            }
            if (!items[item]) {
                throw new Error('Reference to unknown item: ' + match);
            }
            itemRefs.add(item);
            return concept ? `[${text}](/${item}/#${concept})` : `[${text}](/${item}/)`;
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
        // console.log(name, data.item);
        data.contents = Buffer.from(contents);
    }
    for (const [name, data] of Object.entries(items)) {
        files[name + '/index' + data.item.extension] = data;
    }
}

module.exports = () => function(files, metalsmith, done) {
    try {
        process(files);
        setImmediate(done);
    } catch (error) {
        done(error);
    }
};
