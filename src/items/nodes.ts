export class Node {
    constructor(
        public readonly id: string,
        public readonly creator: string,
        public readonly created: Date
    ) { }
}

export class Definition extends Node { }

export class Theorem extends Node { }

export class Proof extends Node {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly parent: string
    ) {
        super(id, creator, created);
    }
}

export class Media extends Node {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly subtype: string,
        public readonly path: string,
        public readonly description: string
    ) {
        super(id, creator, created);
    }
}

export class Source extends Node {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly subtype: string,
        public readonly title: string
    ) {
        super(id, creator, created);
    }
}

export class Validation extends Node {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly source: string,
        public readonly item: string,
        public readonly location: string
    ) {
        super(id, creator, created);
    }
}

export interface NodeData {
    node: Node;
    content: string;
}
