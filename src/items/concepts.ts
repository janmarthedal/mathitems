import { Concept, Node } from "./nodes";

export const CONCEPT_PATTERN = '[a-zA-Z-]+';

function getOrInsertWith<K, V>(map: Map<K, V>, key: K, makeDefault: () => V): V {
    const value = map.get(key);
    if (value !== undefined) {
        return value;
    }
    const newValue = makeDefault();
    map.set(key, newValue);
    return newValue;
}

export function createConceptNodes(nodes: Array<Node>): Array<Concept> {
    const allConcepts = new Map<string, Array<string>>();
    for (const node of nodes) {
        node.visit({
            visitDefinition: def => {
                for (const name of def.conceptDefines) {
                    getOrInsertWith(allConcepts, name, () => []).push(def.name);
                }
                for (const name of def.conceptRefs) {
                    getOrInsertWith(allConcepts, name, () => []);
                }
            },
            visitTheorem: thm => {
                for (const name of thm.conceptRefs) {
                    getOrInsertWith(allConcepts, name, () => []);
                }
            },
            visitProof: prf => {
                for (const name of prf.conceptRefs) {
                    getOrInsertWith(allConcepts, name, () => []);
                }
            },
            visitAny: () => { }
        });
    }
    return [...allConcepts.entries()].map(([name, definedBy]) => new Concept(name, definedBy));
}
