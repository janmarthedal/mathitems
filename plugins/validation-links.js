module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const { graph } = metalsmith.metadata();
    for (const [file, data] of Object.entries(files)) {
        if (data.type !== 'validations') {
            continue;
        }
        for (const validation of data.validations) {
            const fromId = 'item:' + validation.item;
            const toId = 'source:' + validation.source;
            if (!graph.getNode(fromId)) {
                throw new Error(`Validation item ${validation.item} not found`);
            }
            if (!graph.getNode(toId)) {
                throw new Error(`Validation source ${validation.source} not found`);
            }
            graph.addLink(fromId, toId, { type: 'validation', location: validation.location });
            console.log(`Validation for ${validation.item}:`, validation.source, validation.location);
        }
        delete files[file];
    }
};
