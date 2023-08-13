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
