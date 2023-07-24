import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import MarkdownIt from 'markdown-it';
import mk from '@iktakahiro/markdown-it-katex';
import nunjucks from 'nunjucks';
import { render as renderLess } from 'less';
import { ItemNode, Node } from '../items/nodes';

function getPath(node: Node): string {
    const nodepart = node.visit({
        visitDefinition: () => 'definition',
        visitTheorem: () => 'theorem',
        visitProof: () => 'proof',
        visitMedia: () => 'media',
        visitSource: () => 'source',
        visitValidation: () => 'validation',
    });
    return `/${nodepart}/${node.id}/index.html`;
}

function getTitle(node: Node): string {
    return node.visit({
        visitDefinition: () => 'Definition',
        visitTheorem: () => 'Theorem',
        visitProof: () => 'Proof',
        visitMedia: () => 'Media',
        visitSource: () => 'Source',
        visitValidation: () => 'Validation',
    }) + ' ' + node.id;
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

interface DecoratedNode {
    title: string;
    filename: string;
    permalink: string;
}

function makeRenderData(outputDir: string, nodes: Array<Node>): Map<string, DecoratedNode> {
    const renderData = new Map<string, DecoratedNode>();
    for (const node of nodes) {
        const path = getPath(node);
        const filename = outputDir + path;
        const permalink = '' + (path.endsWith('index.html') ? path.slice(0, -10) : path);
        const title = getTitle(node);
        renderData.set(node.id, { title, filename, permalink });
    }
    return renderData;
}

export async function generateSite(outputDir: string, layoutDir: string, globals: Record<string, any>, nodes: Array<Node>) {
    const renderDataMap = makeRenderData(outputDir, nodes);

    const md = new MarkdownIt();
    md.use(mk);

    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(layoutDir), { autoescape: true });
    env.addFilter('url', (obj: any) => '' + obj);

    for (const node of nodes) {
        if (node instanceof ItemNode) {
            const renderData = renderDataMap.get(node.id)!;
            const itemHtml = md.render(node.markup);
            const pageHtml = env.render('mathitem.njk', {
                ...globals,
                title: renderData.title,
                contents: itemHtml
            });
            writeFile(renderData.filename, pageHtml);
        }
    }

    await generateStyles(outputDir);
}
