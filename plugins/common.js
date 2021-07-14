function isItemNode(data) {
    return ['definition', 'theorem'].includes(data.type);
}

module.exports = {
    isItemNode
};
