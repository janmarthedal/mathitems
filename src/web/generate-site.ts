import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import MarkdownIt from 'markdown-it';
import mk from '@iktakahiro/markdown-it-katex';
import nunjucks from 'nunjucks';
import { render as renderLess } from 'less';
import { Concept, ItemNode, NamedNode, Node } from '../items/nodes';
import { LINK_REGEX } from '../items/scan';

function getPath(node: NamedNode): string {
    const pathname = node.visit({
        visitDefinition: () => 'definition',
        visitTheorem: () => 'theorem',
        visitProof: () => 'proof',
        visitMedia: () => 'media',
        visitSource: () => 'source',
        visitValidation: () => 'validation',
        visitConcept: () => 'concept',
    });
    return `/${pathname}/${node.name}/index.html`;
}

function getTitle(node: NamedNode): string {
    const title = node.visit({
        visitDefinition: () => 'Definition',
        visitTheorem: () => 'Theorem',
        visitProof: () => 'Proof',
        visitMedia: () => 'Media',
        visitSource: () => 'Source',
        visitValidation: () => 'Validation',
        visitConcept: () => 'Concept',
    });
    return `${title} ${node.name}`;
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
        if (node instanceof NamedNode) {
            const path = getPath(node);
            const filename = outputDir + path;
            const permalink = '' + (path.endsWith('index.html') ? path.slice(0, -10) : path);
            const title = getTitle(node);
            renderData.set(node.id, { name: node.name, title, filename, permalink });
        }
    }
    return renderData;
}

function prepareMarkup(contents: string, renderDataMap: Map<string, DecoratedNode>): string {
    return contents.replace(LINK_REGEX, (_match, bang, text, link) => {
        if (bang) {
            // const mediaNode = renderDataMap.get(link)!;
            return `![${text || link}](https://mathitems.janmr.com/media/M1.svg)`;   // TODO fix link
        }
        if (link.startsWith('=')) {
            return `*${text}*`;
        }
        const [itemRef, conceptRef] = link.split('#');
        if (conceptRef && !itemRef) {
            const conceptNode = renderDataMap.get(Concept.nameToId(conceptRef))!;
            return `[${text}](${conceptNode.permalink})`;
        }
        const refItemNode = renderDataMap.get(itemRef)!;
        return conceptRef ? `[${text}](${refItemNode.permalink}#${conceptRef})` : `[${text}](${refItemNode.permalink})`;
    });
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
            const preparedMarkup = prepareMarkup(node.markup, renderDataMap);
            const itemHtml = md.render(preparedMarkup);
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
