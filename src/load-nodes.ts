import { load } from "./items/load";
import { checkItemTypeIds, checkUniqueIds, checkUniqueItemNumbers, getFreeItemNumbers } from "./items/checks";
import { createConceptNodes } from "./items/concepts";
import { attachValidations } from "./items/validations";
import { ItemNode, Node } from "./items/nodes";

const GLOB_PATTERN = 'items/**/*';

function makeItemList(nodes: Array<Node>): Array<ItemNode> {
    const items: Array<ItemNode> = [];
    for (const node of nodes) {
        node.visit({
            visitDefinition: item => items.push(item),
            visitTheorem: item => items.push(item),
            visitProof: item => items.push(item),
            visitAny: () => { }
        });
    }
    return items;
}

export function loadNodes(): { nodes: Array<Node>, freeNumbers: Array<number> } {
    const nodes = load(GLOB_PATTERN);
    console.log('Loaded', nodes.length, 'nodes');

    const conceptNodes = createConceptNodes(nodes);
    const allNodes = [...nodes, ...conceptNodes];

    checkUniqueIds(nodes);

    const items = makeItemList(nodes);
    const itemMap = new Map(items.map(item => [item.id, item]));
    attachValidations(allNodes, itemMap);

    checkItemTypeIds(allNodes);
    checkUniqueItemNumbers(items);
    const freeNumbers = getFreeItemNumbers(items);

    return { nodes: allNodes, freeNumbers };
}
