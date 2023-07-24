import { mkdirSync, read, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import MarkdownIt from 'markdown-it';
import mk from '@iktakahiro/markdown-it-katex';
import nunjucks from 'nunjucks';
import { render as renderLess } from 'less';
import { ItemData, ItemMeta, ItemType } from '../items/types';

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

// TODO: Use glob to find all `less` files to process
async function generateStyles(outputDir: string) {
    const contents = readFileSync('static/styles.less', 'utf8');
    const css = await renderLess(contents);
    writeFile(`${outputDir}/styles.css`, css.css);
}

export async function generateSite(outputDir: string, layoutDir: string, globals: Record<string, any>, items: Array<ItemData>) {
    const md = new MarkdownIt();
    md.use(mk);

    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(layoutDir), { autoescape: true });
    env.addFilter('url', (obj: any) => '' + obj);

    for (const item of items) {
        if (item.meta.id !== 'D1') continue;
        const filename = makeFilename(outputDir, item.meta);
        const itemHtml = md.render(item.content);
        const pageHtml = env.render('mathitem.njk', {
            ...globals,
            title: item.meta.id,
            contents: itemHtml
        });
        writeFile(filename, pageHtml);
    }

    await generateStyles(outputDir);
}
