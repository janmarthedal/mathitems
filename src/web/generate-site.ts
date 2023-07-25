import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import MarkdownIt from 'markdown-it';
import mk from '@iktakahiro/markdown-it-katex';
import nunjucks from 'nunjucks';
import { render as renderLess } from 'less';
import { Concept, ItemNode, Media, NamedNode, Node } from '../items/nodes';
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

function writeFile(outputDir: string, filename: string, contents: string | Buffer) {
    const path = `${outputDir}/${filename}`;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
}

// TODO: Use glob to find all `less` files to process
async function generateStyles(outputDir: string) {
    const contents = readFileSync('static/styles.less', 'utf8');
    const css = await renderLess(contents);
    writeFile(outputDir, 'styles.css', css.css);
}

interface DecoratedNode {
    readonly name: string;            // Entity name
    readonly title: string;           // Page title (TODO remove, use template instead)
    readonly filename: string;
    readonly permalink: string;
    readonly blobpath?: string;       // Media blob path
}

function makeRenderData(nodes: Array<Node>): Map<string, DecoratedNode> {
    const renderData = new Map<string, DecoratedNode>();
    for (const node of nodes) {
        // TODO visitor instead of `instanceof`
        if (node instanceof NamedNode) {
            const filename = getPath(node);
            const permalink = '' + (filename.endsWith('index.html') ? filename.slice(0, -10) : filename);
            const title = getTitle(node);
            const decoratedNode: DecoratedNode = { name: node.name, title, filename, permalink };
            if (node instanceof Media) {
                renderData.set(node.id, {
                    ...decoratedNode,
                    blobpath: `/blobs/${node.name}.${node.subtype}`
                });
            } else {
                renderData.set(node.id, decoratedNode);
            }
        }
    }
    return renderData;
}

function prepareMarkup(contents: string, renderDataMap: Map<string, DecoratedNode>): string {
    return contents.replace(LINK_REGEX, (_match, bang, text, link) => {
        if (bang) {
            const mediaNode = renderDataMap.get(link)!;
            return `![${text || link}](${mediaNode.blobpath})`;
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
    const renderDataMap = makeRenderData(nodes);

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
            writeFile(outputDir, renderData.filename, pageHtml);
        } else if (node instanceof Media) {
            // TODO write media page
            const renderData = renderDataMap.get(node.id)!;
            writeFile(outputDir, renderData.blobpath!, node.buffer);
        }
    }

    await generateStyles(outputDir);
}
