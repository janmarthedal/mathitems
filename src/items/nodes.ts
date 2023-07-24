export class Node {
    constructor(
        public readonly id: string,
        public readonly creator: string,
        public readonly created: Date
    ) { }
}

export class ItemNode extends Node {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly markup: string
    ) {
        super(id, creator, created);
    }
}

export class Definition extends ItemNode { }

export class Theorem extends ItemNode { }

export class Proof extends ItemNode {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly parent: string,
        public readonly markup: string
    ) {
        super(id, creator, created, markup);
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
