import { load } from "./items/load";
import { checkItemTypeIds, checkUniqueIds } from "./items/checks";
import { createConceptNodes } from "./items/concepts";
import { attachValidations } from "./items/validations";
import { ItemNode, Node } from "./items/nodes";

const GLOB_PATTERN = 'items/**/*';

function makeItemMap(nodes: Array<Node>): Map<string, ItemNode> {
    const itemMap = new Map<string, ItemNode>();
    for (const node of nodes) {
        node.visit({
            visitDefinition: def => itemMap.set(def.id, def),
            visitTheorem: thm => itemMap.set(thm.id, thm),
            visitProof: prf => itemMap.set(prf.id, prf),
            visitAny: () => { }
        });
    }
    return itemMap;
}

export function loadNodes() {
    const nodes = load(GLOB_PATTERN);
    console.log('Loaded', nodes.length, 'nodes');

    const conceptNodes = createConceptNodes(nodes);
    const allNodes = [...nodes, ...conceptNodes];

    checkUniqueIds(nodes);

    const itemMap = makeItemMap(nodes);
    attachValidations(allNodes, itemMap);

    checkItemTypeIds(allNodes);

    return allNodes;
}
