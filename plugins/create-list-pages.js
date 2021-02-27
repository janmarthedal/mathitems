module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const { items } = metalsmith.metadata();
    files['definitions/index.html'] = {
        title: 'Definitions',
        layout: 'item-list.njk',
        items: items.filter(data => data.item?.type === 'D'),
        contents: Buffer.from('')
    };
    files['theorems/index.html'] = {
        title: 'Theorems',
        layout: 'item-list.njk',
        items: items.filter(data => data.item?.type === 'T'),
        contents: Buffer.from('')
    };
};
