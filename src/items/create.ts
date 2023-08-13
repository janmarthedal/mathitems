import assert from 'assert';
import { Definition, Media, Node, Proof, Source, Theorem, Validation } from './nodes';

let validationCount = 1;

export function createNode(data: Record<string, unknown>, content: string): Node {
    if (data.type === 'validation') {
        assert(data.id === undefined, 'a validation should not have an id');
        data.id = 'V' + validationCount++;
    }
    assert(typeof data.id === 'string', 'id must be a string');
    assert(typeof data.creator === 'string', 'creator must be a string');
    assert(data.created instanceof Date, 'created must be a Date');
    assert(Number.isFinite(data.created.getTime()), 'created must be a valid Date');
    switch (data.type) {
        case 'definition':
            return new Definition(data.id, data.creator, data.created, data.keywords as Array<string> || [], content);
        case 'theorem':
            return new Theorem(data.id, data.creator, data.created, data.keywords as Array<string> || [], content);
        case 'proof':
            assert(typeof data.parent === 'string', 'parent must be a string');
            return new Proof(data.id, data.creator, data.created, data.keywords as Array<string> || [], data.parent, content);
        case 'media': {
            assert(typeof data.subtype === 'string', 'subtype must be a string');
            assert(!data.description || typeof data.description === 'string', 'description must be a string');
            return new Media(data.id, data.creator, data.created, data.subtype, data.description as string || '', Buffer.from(content));
        }
        case 'source':
            assert(typeof data.subtype === 'string', 'subtype must be a string');
            assert(typeof data.title === 'string', 'title must be a string');
            assert(typeof data.extra === 'object', 'extra must be an object');
            return new Source(data.id, data.creator, data.created, data.subtype, data.title, data.extra as Record<string, unknown>);
        case 'validation':
            assert(data.subtype === 'source', 'subtype must be "source"');
            assert(typeof data.item === 'string', 'item must be a string');
            assert(typeof data.source === 'string', 'source must be a string');
            assert(typeof data.location === 'string', 'location must be a string');
            return new Validation(data.id, data.creator, data.created, data.item, data.source, data.location);
        default:
            throw new Error(`Illegal type: ${data.type}`);
    }
}
