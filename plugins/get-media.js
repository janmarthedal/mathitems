const { extname } = require('path');

module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const { graph } = metalsmith.metadata();
    for (const [file, data] of Object.entries(files)) {
        const { type, id } = data;
        if (type === 'media') {
            if (!id) {
                throw new Error(`${file} is missing 'id'`);
            }
            data.title = 'Media ' + id;
            data.layout = 'media.njk';
            data.permalink = `/${id}/`;
            graph.addNode('media:' + id, data);
            delete files[file];
            files[id + '/index' + extname(file)] = data;
            console.log(data.title);
        }
    }
};
