import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import MarkdownIt from 'markdown-it';
import mk from '@iktakahiro/markdown-it-katex';
import nunjucks from 'nunjucks';
import { render as renderLess } from 'less';
import { Concept, ItemNode, Node } from '../items/nodes';

function getPath(node: Node): string {
    return node.visit({
        visitDefinition: () => `/definition/${node.id}/index.html`,
        visitTheorem: () => `/theorem/${node.id}/index.html`,
        visitProof: () => `/proof/${node.id}/index.html`,
        visitMedia: () => `/media/${node.id}/index.html`,
        visitSource: () => `/source/${node.id}/index.html`,
        visitValidation: () => `/validation/${node.id}/index.html`,
        visitConcept: con => `/concept/${con.name}/index.html`,
    });
}

function getTitle(node: Node): string {
    return node.visit({
        visitDefinition: () => `Definition ${node.id}`,
        visitTheorem: () => `Theorem ${node.id}`,
        visitProof: () => `Proof ${node.id}`,
        visitMedia: () => `Media ${node.id}`,
        visitSource: () => `Source ${node.id}`,
        visitValidation: () => `Validation ${node.id}`,
        visitConcept: con => `Concept ${con.name}`,
    });
}

function getName(node: Node): string {
    return node.visit({
        visitConcept: con => con.name,
        visitDefault: () => node.id,
    });
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
    name: string;   // Entity name
    title: string;  // Page title
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
        const name = getName(node);
        renderData.set(node.id, { name, title, filename, permalink });
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
                contents: itemHtml,
                defines: [...node.conceptDefines].map(name => renderDataMap.get(Concept.nameToId(name))!),
                itemRefs: [...node.itemRefs].map(id => renderDataMap.get(id)!),
                conceptRefs: [...node.conceptRefs].map(name => renderDataMap.get(Concept.nameToId(name))!),
            });
            writeFile(renderData.filename, pageHtml);
        }
    }

    await generateStyles(outputDir);
}
