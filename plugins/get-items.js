const { extname } = require('path');

const SHORT_TO_TYPE = {
    'D': 'Definition',
    'T': 'Theorem'
};

module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const items = [];
    const { sources, sourceRefs } = metalsmith.metadata();
    for (const [file, data] of Object.entries(files)) {
        const { title } = data;
        if (title && SHORT_TO_TYPE[title[0]] && !Number.isNaN(+title.substring(1))) {
            data.item = {
                type: title[0],
                name: title
            };
            data.title = SHORT_TO_TYPE[title[0]] + ' ' + title;
            data.layout = 'mathitem.njk';
            data.permalink = `/${title}/`;
            if (data.validations) {
                data.item.validations = data.validations.map(v => {
                    if (!sources[v.source] && sourceRefs[v.source]) {
                        v.source = sourceRefs[v.source];
                    }
                    if (!sources[v.source]) {
                        throw new Error(`Missing source '${v.source}'`);
                    }
                    v.source = sources[v.source];
                    return v;
                });
                delete data.validations;
            }
            items.push(data);
            console.log(data);
            delete files[file];
            files[title + '/index' + extname(file)] = data;
        }
    }
    metalsmith.metadata().items = items;
};
