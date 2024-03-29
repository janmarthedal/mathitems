import assert from "assert";
import { CONCEPT_PATTERN } from "./concepts";
import { ItemNode, Node } from "./nodes";

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

export function checkUniqueItemNumbers(items: Array<ItemNode>) {
    const numbers = new Set<number>();
    for (const node of items) {
        // Assumes the id structure from `checkItemTypeIds`
        const number = +node.id.substring(1);
        if (numbers.has(number)) {
            throw new Error(`Duplicate item number: ${number} (${node.id})`);
        }
        numbers.add(number);
    }
}

// Assumes the id structure from `checkItemTypeIds`
// Assumes distinct item numbers
export function getFreeItemNumbers(items: Array<ItemNode>): Array<number> {
    const numbers = items.map(item => +item.id.substring(1));
    const freeNumbers: Array<number> = [];
    numbers.sort((a, b) => a - b);
    let i = 1;
    while (numbers.length > 0) {
        const number = numbers.shift()!;
        while (i < number) {
            freeNumbers.push(i);
            i++;
        }
        assert(i === number);
        i++;
    }
    freeNumbers.push(i);
    return freeNumbers;
}
