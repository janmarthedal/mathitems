import { mkdirSync, read, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import MarkdownIt from 'markdown-it';
import mk from '@iktakahiro/markdown-it-katex';
import nunjucks from 'nunjucks';
import { render as renderLess } from 'less';
import { Definition, ItemNode, Node, Theorem } from '../items/nodes';

function makeFilename(basedir: string, node: Node): string {
    let itempath = '';
    if (node instanceof Definition) {
        itempath = 'definition';
    } else if (node instanceof Theorem) {
        itempath = 'theorem';
    } else {
        throw new Error(`Illegal node: ${node.constructor.name}`);
    }
    return `${basedir}/${itempath}/${node.id}/index.html`;
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

export async function generateSite(outputDir: string, layoutDir: string, globals: Record<string, any>, nodes: Array<Node>) {
    const md = new MarkdownIt();
    md.use(mk);

    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(layoutDir), { autoescape: true });
    env.addFilter('url', (obj: any) => '' + obj);

    for (const node of nodes) {
        if (node instanceof ItemNode) {
            const filename = makeFilename(outputDir, node);
            const itemHtml = md.render(node.markup);
            const pageHtml = env.render('mathitem.njk', {
                ...globals,
                title: node.id,
                contents: itemHtml
            });
            writeFile(filename, pageHtml);
        }
    }

    await generateStyles(outputDir);
}
