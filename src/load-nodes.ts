import { createConceptNodes } from "./items/concepts";
import { load, validateUniqueIds } from "./items/load";
import { attachValidations } from "./items/validations";

const GLOB_PATTERN = 'items/**/*';

export function loadNodes() {
    const nodes = load(GLOB_PATTERN);
    validateUniqueIds(nodes);
    console.log('Loaded', nodes.length, 'nodes');
    const conceptNodes = createConceptNodes(nodes);
    const allNodes = [...nodes, ...conceptNodes];
    attachValidations(allNodes);
    // validations...
    return allNodes;
}
