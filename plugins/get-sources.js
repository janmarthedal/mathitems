const { basename, extname } = require('path');

module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const sources = {};
    const sourceRefs = {};
    for (const [file, data] of Object.entries(files)) {
        const name = basename(file, extname(file));
        if (name && name[0] === 'S' && !Number.isNaN(+name.substring(1))) {
            if (data.isbn) {
                if (typeof data.isbn === 'string' || typeof data.isbn === 'number') {
                    data.isbn = [data.isbn];
                }
                data.isbn = data.isbn.map(String);
                for (const isbn of data.isbn) {
                    sourceRefs['isbn:' + isbn] = name;
                }
            }
            const { contents } = data;
            delete data.mode;
            delete data.stats;
            delete data.contents;
            delete files[file];
            const path = `source/${name}/`;
            const newdata = {
                title: name,
                layout: 'source.njk',
                permalink: '/' + path,
                data,
                contents
            };
            sources[name] = newdata;
            files[path + 'index.md'] = newdata;
            console.log(newdata);
        }
    }
    metalsmith.metadata().sources = sources;
    metalsmith.metadata().sourceRefs = sourceRefs;
};
