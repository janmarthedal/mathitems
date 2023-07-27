import { ItemNode, Node } from "./nodes";

export function attachValidations(nodes: Array<Node>) {
    const itemMap = new Map<string, ItemNode>();
    for (const node of nodes) {
        node.visit({
            visitDefinition: node => itemMap.set(node.id, node),
            visitTheorem: node => itemMap.set(node.id, node),
            visitProof: node => itemMap.set(node.id, node),
            visitAny: () => { }
        });
    }
    for (const node of nodes) {
        node.visit({
            visitValidation: val => {
                const item = itemMap.get(val.item);
                if (!item) {
                    throw new Error(`Validation ${val.id} references non-existent item ${val.item}`);
                }
                item.validations.push(val);
            },
            visitAny: () => { }
        })
    }
}