import { CONCEPT_PATTERN } from "./concepts";
import { Node } from "./nodes";

export function checkUniqueIds(nodes: Array<Node>) {
    const ids = new Set<string>();
    for (const item of nodes) {
        const id = item.id;
        if (ids.has(id)) {
            throw new Error(`Duplicate id: ${id}`);
        }
        ids.add(id);
    }
}

export function checkItemTypeIds(nodes: Array<Node>) {
    for (const node of nodes) {
        const pattern = node.visit({
            visitDefinition: () => /^D[1-9][0-9]*$/,
            visitTheorem: () => /^T[1-9][0-9]*$/,
            visitProof: () => /^P[1-9][0-9]*$/,
            visitMedia: () => /^M[1-9][0-9]*$/,
            visitSource: () => /^S[1-9][0-9]*$/,
            visitValidation: () => /^V[1-9][0-9]*$/,
            visitConcept: () => new RegExp(`^#${CONCEPT_PATTERN}$`),
        });
        if (!pattern.test(node.id)) {
            throw new Error(`Illegal id: ${node.id}`);
        }
    }
}
