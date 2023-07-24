import { Concept, Node } from "./nodes";

const EMPTY_SET = new Set<string>();

export function createConceptNodes(nodes: Array<Node>): Array<Concept> {
    const allConcepts = new Set<string>();
    for (const node of nodes) {
        const conceptDefines = node.visit({
            visitDefinition: def => def.conceptDefines,
            visitDefault: () => EMPTY_SET
        });
        const conceptRefs = node.visit({
            visitDefinition: def => def.conceptRefs,
            visitTheorem: thm => thm.conceptRefs,
            visitProof: prf => prf.conceptRefs,
            visitDefault: () => EMPTY_SET
        });
        for (const concept of conceptDefines) {
            allConcepts.add(concept);
        }
        for (const concept of conceptRefs) {
            allConcepts.add(concept);
        }
    }
    return [...allConcepts].map(name => new Concept(name));
}
