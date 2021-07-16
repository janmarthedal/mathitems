const { extname } = require('path');

module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const { graph } = metalsmith.metadata();
    for (const [file, data] of Object.entries(files)) {
        const { type, id } = data;
        if (type === 'source') {
            if (!id) {
                throw new Error(`${file} is missing 'id'`);
            }
            const source = {};
            for (const [key, value] of Object.entries(data)) {
                if (!['type', 'subtype', 'id', 'timestamp', 'contents', 'mode', 'stats'].includes(key)) {
                    source[key] = value;
                    delete data[key];
                }
            }
            data.title = 'Source ' + id;
            data.layout = 'source.njk';
            data.permalink = `/sources/${id}/`;
            data.data = source;
            graph.addNode('source:' + id, source);
            delete files[file];
            files['sources/' + id + '/index' + extname(file)] = data;
            console.log(data.title);
        }
    }
};
