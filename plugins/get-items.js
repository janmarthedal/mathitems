const { extname } = require('path');
const { isItemNode } = require('../lib/common');

/*
From:
---
type: definition|theorem
id: <ID>
created: 2016-10-30T19:25:57Z
creator: <USER>
---
<CONTENT>

To:
---
title: Definition D1
type: definition|theorem
id: <ID>
created: 2016-10-30T19:25:57Z
creator: <USER>
layout: mathitem.njk
permalink: /D1/
---
<CONTENT>
*/

function capitalizeFirst(st) {
    return st[0].toUpperCase() + st.substring(1);
}

module.exports = () => function(files, metalsmith, done) {
    setImmediate(done);
    const { graph } = metalsmith.metadata();
    for (const [file, data] of Object.entries(files)) {
        const { type, id } = data;
        if (isItemNode(data)) {
            if (!id) {
                throw new Error(`${file} is missing 'id'`);
            }
            data.title = capitalizeFirst(type) + ' ' + id;
            data.layout = 'mathitem.njk';
            data.permalink = `/${id}/`;
            graph.addNode('item:' + id, data);
            delete files[file];
            files[id + '/index' + extname(file)] = data;
            console.log(data.title);
        }
    }
};
