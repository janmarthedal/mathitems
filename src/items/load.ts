import { readFileSync } from 'fs';
import { dirname, extname, join } from 'path';
import { globIterateSync } from 'glob';
import { read as matterRead } from 'gray-matter';
import { load as loadYaml } from 'js-yaml';
import { Node } from './nodes';
import { createNode } from './create';

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
