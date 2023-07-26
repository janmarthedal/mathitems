import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import MarkdownIt from 'markdown-it';
import mk from '@iktakahiro/markdown-it-katex';
import nunjucks from 'nunjucks';
import { render as renderLess } from 'less';
import { Concept, ItemNode, Node } from '../items/nodes';
import { LINK_REGEX } from '../items/scan';

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
    readonly filename: string;
    readonly permalink: string;
    readonly blobpath?: string;       // Media blob path
}

function decorateNamedNode(pathitem: string, name: string): DecoratedNode {
    const filename = `/${pathitem}/${name}/index.html`;
    const permalink = '' + (filename.endsWith('index.html') ? filename.slice(0, -10) : filename);
    return { name, filename, permalink };
}

function makeRenderData(nodes: Array<Node>): Map<string, DecoratedNode> {
    const renderData = new Map<string, DecoratedNode>();
    for (const node of nodes) {
        const decoratedNode = node.visit<DecoratedNode>({
            visitDefinition: node => decorateNamedNode('definition', node.name),
            visitTheorem: node => decorateNamedNode('theorem', node.name),
            visitMedia: node => ({
                ...decorateNamedNode('media', node.name),
                blobpath: `/blobs/${node.name}.${node.subtype}`
            }),
            visitConcept: node => decorateNamedNode('concept', node.name),
        });
        renderData.set(node.id, decoratedNode);
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

function renderItemNode(
    outputDir: string,
    globals: Record<string, unknown>,
    md: MarkdownIt,
    env: nunjucks.Environment,
    renderDataMap: Map<string, DecoratedNode>,
    template: string,
    node: ItemNode
) {
    const renderData = renderDataMap.get(node.id)!;
    const preparedMarkup = prepareMarkup(node.markup, renderDataMap);
    const itemHtml = md.render(preparedMarkup);
    const pageHtml = env.render(template, {
        ...globals,
        name: renderData.name,
        keywords: node.keywords,
        defines: [...node.conceptDefines].map(name => renderDataMap.get(Concept.nameToId(name))!),
        itemRefs: [...node.itemRefs].map(id => renderDataMap.get(id)!),
        conceptRefs: [...node.conceptRefs].map(name => renderDataMap.get(Concept.nameToId(name))!),
        contents: itemHtml,
    });
    writeFile(outputDir, renderData.filename, pageHtml);
}

function generateItemListPage(
    outputDir: string,
    filename: string,
    globals: Record<string, any>,
    env: nunjucks.Environment,
    renderDataMap: Map<string, DecoratedNode>,
    title: string,
    nodes: Array<ItemNode>
) {
    writeFile(outputDir, filename, env.render('item-list.njk', {
        ...globals,
        title,
        items: nodes.map(node => ({
            name: node.name,
            created: node.created,
            permalink: renderDataMap.get(node.id)!.permalink,
            defines: [...node.conceptDefines],
            keywords: node.keywords,
        }))
    }));
}

export async function generateSite(outputDir: string, layoutDir: string, globals: Record<string, any>, nodes: Array<Node>) {
    const renderDataMap = makeRenderData(nodes);

    const md = new MarkdownIt();
    md.use(mk);

    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(layoutDir), { autoescape: true });
    env.addFilter('url', (obj: any) => '' + obj);
    env.addFilter('formatDate', (date: Date) => date.toISOString().substring(0, 16).replace('T', ' '));

    for (const node of nodes) {
        node.visit({
            visitDefinition: node => renderItemNode(outputDir, globals, md, env, renderDataMap, 'definition.njk', node),
            visitTheorem: node => renderItemNode(outputDir, globals, md, env, renderDataMap, 'theorem.njk', node),
            visitProof: node => renderItemNode(outputDir, globals, md, env, renderDataMap, 'proof.njk', node),
            visitMedia: node => {
                // TODO write media page
                const renderData = renderDataMap.get(node.id)!;
                writeFile(outputDir, renderData.blobpath!, node.buffer);
            },
            visitSource: () => {
                // TODO write source page
            },
            visitValidation: () => { },
            visitConcept: node => {
                writeFile(outputDir, renderDataMap.get(node.id)!.filename, env.render('concept.njk', {
                    ...globals,
                    name: node.name,
                    items: node.definedBy.map(id => renderDataMap.get(id)!),
                }));
            },
        });
    }

    await generateStyles(outputDir);

    // Generate pages
    writeFile(outputDir, '/index.html', env.render('root.njk', globals));
    const definitions: Array<ItemNode> = [];
    const theorems: Array<ItemNode> = [];
    const concepts: Array<Concept> = [];
    for (const node of nodes) {
        node.visit({
            visitDefinition: node => definitions.push(node),
            visitTheorem: node => theorems.push(node),
            visitConcept: node => concepts.push(node),
            visitAny: () => { },
        });
    }
    definitions.sort((a, b) => b.created.getTime() - a.created.getTime());
    theorems.sort((a, b) => b.created.getTime() - a.created.getTime());
    concepts.sort((a, b) => a.name.localeCompare(b.name));
    generateItemListPage(outputDir, '/definition/index.html', globals, env, renderDataMap, 'Definitions', definitions);
    generateItemListPage(outputDir, '/theorem/index.html', globals, env, renderDataMap, 'Theorems', theorems);
    writeFile(outputDir, '/concept/index.html', env.render('concept-list.njk', {
        ...globals,
        concepts: concepts.map(c => ({
            name: c.name,
            permalink: renderDataMap.get(c.id)!.permalink,
            count: c.definedBy.length,
        })),
    }));
}
