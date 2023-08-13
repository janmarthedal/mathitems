import { load } from "./items/load";
import { checkUniqueIds } from "./items/checks";
import { createConceptNodes } from "./items/concepts";
import { attachValidations } from "./items/validations";

const GLOB_PATTERN = 'items/**/*';

export function loadNodes() {
    const nodes = load(GLOB_PATTERN);
    checkUniqueIds(nodes);
    console.log('Loaded', nodes.length, 'nodes');
    const conceptNodes = createConceptNodes(nodes);
    const allNodes = [...nodes, ...conceptNodes];
    attachValidations(allNodes);
    // validations...
    return allNodes;
}
