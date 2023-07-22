import { globIterateSync } from 'glob';
import { read as matterRead } from 'gray-matter';
import { ItemData, ItemMeta, ItemType } from './types';
import assert from 'assert';

function validateMetaData(data: Record<string, any>): ItemMeta {
    assert(typeof data.id === 'string', 'id must be a string');
    assert(typeof data.creator === 'string', 'creator must be a string');
    const created = new Date(data.created);
    if (isNaN(created.getTime())) {
        throw new Error('created must be a valid date');
    }
    const base = {
        id: data.id,
        creator: data.creator,
        created: new Date(data.created),
    };
    switch (data.type) {
        case 'definition':
            return { type: ItemType.Definition, ...base };
        case 'theorem':
            return { type: ItemType.Theorem, ...base };
        default:
            throw new Error(`Illegal type: ${data.type}`);
    }
}

function validateIds(items: Array<ItemData>): void {
    const ids = new Set<string>();
    for (const item of items) {
        const id = item.meta.id;
        if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(id)) {
            throw new Error(`Illegal id: ${id}`);
        }
        if (ids.has(id)) {
            throw new Error(`Duplicate id: ${id}`);
        }
        ids.add(id);
    }
}

export function load(globPattern: string): Array<ItemData> {
    const items: Array<ItemData> = [];
    for (const filename of globIterateSync(globPattern, { nodir: true })) {
        const { data, content } = matterRead(filename);
        const meta = validateMetaData(data);
        items.push({ meta, content });
    }
    validateIds(items);
    return items;
}
