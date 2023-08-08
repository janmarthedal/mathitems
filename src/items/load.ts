import assert from 'assert';
import { readFileSync } from 'fs';
import { dirname, extname, join } from 'path';
import { globIterateSync } from 'glob';
import { read as matterRead } from 'gray-matter';
import { load as loadYaml } from 'js-yaml';
import { Definition, Media, Node, Proof, Source, Theorem, Validation } from './nodes';

let validationCount = 1;
const INTEGER_REG_EX = /^[1-9][0-9]*$/;

function validateId(id: unknown, letter: string): asserts id is string {
    assert(typeof id === 'string', 'id must be a string');
    assert(letter.length === 1, 'letter must be a single character');
    if (!id.startsWith(letter)) {
        throw new Error(`Wrong initial letter for node ${id}`);
    }
    if (!INTEGER_REG_EX.test(id.substring(1))) {
        throw new Error(`Illegal id: ${id}`);
    }
}

function createNode(data: Record<string, unknown>, content: string): Node {
    assert(typeof data.creator === 'string', 'creator must be a string');
    assert(data.created instanceof Date, 'created must be a Date');
    assert(Number.isFinite(data.created.getTime()), 'created must be a valid Date');
    switch (data.type) {
        case 'definition':
            validateId(data.id, 'D');
            return new Definition(data.id, data.creator, data.created, data.keywords as Array<string> || [], content);
        case 'theorem':
            validateId(data.id, 'T');
            return new Theorem(data.id, data.creator, data.created, data.keywords as Array<string> || [], content);
        case 'proof':
            validateId(data.id, 'P');
            assert(typeof data.parent === 'string', 'parent must be a string');
            return new Proof(data.id, data.creator, data.created, data.keywords as Array<string> || [], data.parent, content);
        case 'media': {
            validateId(data.id, 'M');
            assert(typeof data.subtype === 'string', 'subtype must be a string');
            assert(!data.description || typeof data.description === 'string', 'description must be a string');
            return new Media(data.id, data.creator, data.created, data.subtype, data.description as string || '', Buffer.from(content));
        }
        case 'source':
            validateId(data.id, 'S');
            assert(typeof data.subtype === 'string', 'subtype must be a string');
            assert(typeof data.title === 'string', 'title must be a string');
            assert(typeof data.extra === 'object', 'extra must be an object');
            return new Source(data.id, data.creator, data.created, data.subtype, data.title, data.extra as Record<string, unknown>);
        case 'validation':
            data.id = 'V' + validationCount++;
            validateId(data.id, 'V');
            assert(data.subtype === 'source', 'subtype must be "source"');
            assert(typeof data.item === 'string', 'item must be a string');
            assert(typeof data.source === 'string', 'source must be a string');
            assert(typeof data.location === 'string', 'location must be a string');
            return new Validation(data.id, data.creator, data.created, data.item, data.source, data.location);
        default:
            throw new Error(`Illegal type: ${data.type}`);
    }
}

export function validateIds(nodes: Array<Node>) {
    const ids = new Set<string>();
    for (const item of nodes) {
        const id = item.id;
        if (ids.has(id)) {
            throw new Error(`Duplicate id: ${id}`);
        }
        ids.add(id);
    }
}

export function load(globPattern: string): Array<Node> {
    const nodes: Array<Node> = [];
    for (const filename of globIterateSync(globPattern, { nodir: true })) {
        console.log('Loading', filename);

        let data: Record<string, unknown> = {};
        let content = '';

        const extension = extname(filename);
        if (extension === '.md') {
            const dataContent = matterRead(filename);
            data = dataContent.data;
            content = dataContent.content;
        } else if (extension === '.yaml') {
            data = loadYaml(readFileSync(filename, 'utf8')) as Record<string, unknown>;
        } else if (extension === '.svg') {
            // ignore, will (should) be loaded via a media node
            continue;
        } else {
            throw new Error(`Unknown extension: ${extension}`);
        }

        if (content.trim().length === 0 && data.path) {
            // `path` is relative to the directory containing the file
            const path = join(dirname(filename), data.path as string);
            content = readFileSync(path, 'utf8');
        }

        if (data.list) {
            const base = { ...data, list: undefined };
            for (const item of data.list as Array<Record<string, unknown>>) {
                const itemData = { ...base, ...item };
                const node = createNode(itemData, content);
                nodes.push(node);
            }
        } else {
            const node = createNode(data, content);
            nodes.push(node);
        }
    }
    return nodes;
}
