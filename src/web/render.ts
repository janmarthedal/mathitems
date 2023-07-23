import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import MarkdownIt from 'markdown-it';
import mk from '@iktakahiro/markdown-it-katex';
import nunjucks from 'nunjucks';
import { ItemData, ItemMeta, ItemType } from '../items/types';

const md = new MarkdownIt();
md.use(mk);

nunjucks.configure('layouts', { autoescape: true });

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

function writeFile(filename: string, contents: string) {
    const path = dirname(filename);
    mkdirSync(path, { recursive: true });
    writeFileSync(filename, contents);
}

export function render(outputDir: string, item: ItemData) {
    const filename = makeFilename(outputDir, item.meta);
    const itemHtml = md.render(item.content);
    const pageHtml = nunjucks.render('mathitem.njk', {
        title: item.meta.id,
        contents: itemHtml
    });
    writeFile(filename, pageHtml);
}
