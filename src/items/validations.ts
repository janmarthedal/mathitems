import { ItemNode, Node } from "./nodes";

export function attachValidations(nodes: Array<Node>, itemMap: Map<string, ItemNode>) {
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