export abstract class Node {
    constructor(
        public readonly id: string,
        public readonly creator: string,
        public readonly created: Date
    ) { }
    abstract visit<R>(visitor: NodeVisitor<R>): R;
}

export abstract class ItemNode extends Node {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly markup: string
    ) {
        super(id, creator, created);
    }
}

export class Definition extends ItemNode {
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitDefinition(this);
    }
}

export class Theorem extends ItemNode {
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitTheorem(this);
    }
}

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
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitProof(this);
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
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitMedia(this);
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
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitSource(this);
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
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitValidation(this);
    }
}

export interface NodeVisitor<R> {
    visitDefinition(node: Definition): R;
    visitTheorem(node: Theorem): R;
    visitProof(node: Proof): R;
    visitMedia(node: Media): R;
    visitSource(node: Source): R;
    visitValidation(node: Validation): R;
}
