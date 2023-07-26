import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import MarkdownIt from 'markdown-it';
import mk from '@iktakahiro/markdown-it-katex';
import nunjucks from 'nunjucks';
import { render as renderLess } from 'less';
import { Concept, Definition, ItemNode, Media, Node, Proof, Source, Theorem } from '../items/nodes';
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
    readonly filename: string;        // Path on disk
    readonly permalink: string;       // Path on web
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
            visitProof: node => decorateNamedNode('proof', node.name),
            visitMedia: node => ({
                ...decorateNamedNode('media', node.name),
                blobpath: `/blobs/${node.name}.${node.subtype}`
            }),
            visitConcept: node => decorateNamedNode('concept', node.name),
            visitSource: node => decorateNamedNode('source', node.name),
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
    context: Record<string, unknown>,
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
        ...context,
        name: renderData.name,
        keywords: node.keywords,
        defines: [...node.conceptDefines].map(name => renderDataMap.get(Concept.nameToId(name))!),
        itemRefs: [...node.itemRefs].map(id => renderDataMap.get(id)!),
        conceptRefs: [...node.conceptRefs].map(name => renderDataMap.get(Concept.nameToId(name))!),
        contents: itemHtml,
    });
    writeFile(outputDir, renderData.filename, pageHtml);
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
            visitDefinition: node => renderItemNode(outputDir, globals, md, env, renderDataMap, 'item/definition.njk', node),
            visitTheorem: node => renderItemNode(outputDir, globals, md, env, renderDataMap, 'item/theorem.njk', node),
            visitProof: node => renderItemNode(outputDir, {
                ...globals,
                parent: {
                    ...renderDataMap.get(node.parent)!,
                    name: node.parent
                },
            }, md, env, renderDataMap, 'item/proof.njk', node),
            visitMedia: node => {
                const renderData = renderDataMap.get(node.id)!;
                writeFile(outputDir, renderData.filename, env.render('item/media.njk', {
                    ...globals,
                    name: node.name,
                    description: node.description,
                    path: renderData.blobpath,
                }));
                // Write media blob
                writeFile(outputDir, renderData.blobpath!, node.buffer);
            },
            visitSource: node => {
                const renderData = renderDataMap.get(node.id)!;
                writeFile(outputDir, renderData.filename, env.render('item/source.njk', {
                    ...globals,
                    name: node.name,
                    title: node.title,
                    extra: node.extra,
                }));
            },
            visitValidation: () => { },
            visitConcept: node => {
                writeFile(outputDir, renderDataMap.get(node.id)!.filename, env.render('item/concept.njk', {
                    ...globals,
                    name: node.name,
                    items: node.definedBy.map(id => renderDataMap.get(id)!),
                }));
            },
        });
    }

    const definitions: Array<Definition> = [];
    const theorems: Array<Theorem> = [];
    const proofs: Array<Proof> = [];
    const concepts: Array<Concept> = [];
    const medias: Array<Media> = [];
    const sources: Array<Source> = [];
    for (const node of nodes) {
        node.visit({
            visitDefinition: node => definitions.push(node),
            visitTheorem: node => theorems.push(node),
            visitProof: node => proofs.push(node),
            visitConcept: node => concepts.push(node),
            visitMedia: node => medias.push(node),
            visitSource: node => sources.push(node),
            visitAny: () => { },
        });
    }
    definitions.sort((a, b) => b.created.getTime() - a.created.getTime());
    theorems.sort((a, b) => b.created.getTime() - a.created.getTime());
    proofs.sort((a, b) => b.created.getTime() - a.created.getTime());
    medias.sort((a, b) => b.created.getTime() - a.created.getTime());
    sources.sort((a, b) => b.created.getTime() - a.created.getTime());
    concepts.sort((a, b) => a.name.localeCompare(b.name));

    // Style sheet
    await generateStyles(outputDir);

    // Root page
    writeFile(outputDir, '/index.html', env.render('root.njk', globals));

    // Definition list page
    writeFile(outputDir, '/definition/index.html', env.render('list/definitions.njk', {
        ...globals,
        items: definitions.map(node => ({
            name: node.name,
            created: node.created,
            permalink: renderDataMap.get(node.id)!.permalink,
            defines: [...node.conceptDefines],
            keywords: node.keywords,
        }))
    }));

    // Theorem list page
    writeFile(outputDir, '/theorem/index.html', env.render('list/theorems.njk', {
        ...globals,
        items: theorems.map(node => ({
            name: node.name,
            created: node.created,
            permalink: renderDataMap.get(node.id)!.permalink,
            defines: [...node.conceptDefines],
            keywords: node.keywords,
        }))
    }));

    // Proof list page
    writeFile(outputDir, '/proof/index.html', env.render('list/proofs.njk', {
        ...globals,
        items: proofs.map(node => ({
            name: node.name,
            created: node.created,
            permalink: renderDataMap.get(node.id)!.permalink,
            defines: [...node.conceptDefines],
            keywords: node.keywords,
        }))
    }));

    // Concept list page
    writeFile(outputDir, '/concept/index.html', env.render('list/concepts.njk', {
        ...globals,
        concepts: concepts.map(c => ({
            name: c.name,
            permalink: renderDataMap.get(c.id)!.permalink,
            count: c.definedBy.length,
        })),
    }));

    // Media list page
    writeFile(outputDir, '/media/index.html', env.render('list/medias.njk', {
        ...globals,
        items: medias.map(n => ({
            name: n.name,
            permalink: renderDataMap.get(n.id)!.permalink,
            description: n.description,
        })),
    }));

    // Source list page
    writeFile(outputDir, '/source/index.html', env.render('list/sources.njk', {
        ...globals,
        items: sources.map(n => ({
            name: n.name,
            permalink: renderDataMap.get(n.id)!.permalink,
            title: n.title,
        })),
    }));
}
