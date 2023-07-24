import { globIterateSync } from 'glob';
import { read as matterRead } from 'gray-matter';
import { Definition, Node, Theorem } from './nodes';
import assert from 'assert';

function validateMetaData(data: Record<string, any>, content: string): Node {
    assert(typeof data.id === 'string', 'id must be a string');
    assert(typeof data.creator === 'string', 'creator must be a string');
    assert(data.created instanceof Date, 'created must be a Date');
    assert(Number.isFinite(data.created.getTime()), 'created must be a valid Date');
    switch (data.type) {
        case 'definition':
            return new Definition(data.id, data.creator, data.created, content);
        case 'theorem':
            return new Theorem(data.id, data.creator, data.created, content);
        default:
            throw new Error(`Illegal type: ${data.type}`);
    }
}

export function validateIds(nodes: Array<Node>): void {
    const ids = new Set<string>();
    for (const item of nodes) {
        const id = item.id;
        if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(id)) {
            throw new Error(`Illegal id: ${id}`);
        }
        if (ids.has(id)) {
            throw new Error(`Duplicate id: ${id}`);
        }
        ids.add(id);
    }
}

export function load(globPattern: string): Array<Node> {
    const nodes: Array<Node> = [];
    for (const filename of globIterateSync(globPattern, { nodir: true })) {
        const { data, content } = matterRead(filename);
        const node = validateMetaData(data, content);
        nodes.push(node);
    }
    return nodes;
}
