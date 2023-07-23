import MarkdownIt from 'markdown-it';
import mk from '@iktakahiro/markdown-it-katex';
import { ItemData, ItemMeta, ItemType } from '../items/types';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

const md = new MarkdownIt();
md.use(mk);

function makeFilename(basedir: string, meta: ItemMeta): string {
    let itempath = '';
    switch (meta.type) {
        case ItemType.Definition:
            itempath = 'definition';
            break;
        case ItemType.Theorem:
            itempath = 'theorem';
            break;
        default:
            throw new Error(`Illegal type: ${meta.type}`);
    }
    return `${basedir}/${itempath}/${meta.id}/index.html`;
}

export function render(outputDir: string, item: ItemData) {
    const filename = makeFilename(outputDir, item.meta);
    const path = dirname(filename);
    mkdirSync(path, { recursive: true });
    const content = md.render(item.content);
    writeFileSync(filename, content);
}
