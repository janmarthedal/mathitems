import { scanItemMarkup } from "./scan";

export abstract class Node {
    constructor(
        public readonly id: string,
        public readonly creator: string,
        public readonly created: Date
    ) { }
    abstract visit<R>(visitor: NodeVisitor<R>): R;
}

export abstract class NamedNode extends Node {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly name: string
    ) {
        super(id, creator, created);
    }
}

export abstract class ItemNode extends NamedNode {
    public readonly mediaUses: Set<string>;
    public readonly conceptDefines: Set<string>;
    public readonly conceptRefs: Set<string>;
    public readonly itemRefs: Set<string>;
    constructor(
        name: string,
        creator: string,
        created: Date,
        public readonly markup: string
    ) {
        super(name, creator, created, name);
        const { mediaUses, conceptDefines, conceptRefs, itemRefs } = scanItemMarkup(markup);
        this.mediaUses = mediaUses;
        this.conceptDefines = conceptDefines;
        this.conceptRefs = conceptRefs;
        this.itemRefs = itemRefs;
    }
}

export class Definition extends ItemNode {
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitDefinition ? visitor.visitDefinition(this) : visitor.visitDefault!(this);
    }
}

export class Theorem extends ItemNode {
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitTheorem ? visitor.visitTheorem(this) : visitor.visitDefault!(this);
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
        return visitor.visitProof ? visitor.visitProof(this) : visitor.visitDefault!(this);
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
        return visitor.visitMedia ? visitor.visitMedia(this) : visitor.visitDefault!(this);
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
        return visitor.visitSource ? visitor.visitSource(this) : visitor.visitDefault!(this);
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
        return visitor.visitValidation ? visitor.visitValidation(this) : visitor.visitDefault!(this);
    }
}

export class Concept extends NamedNode {
    constructor(
        public readonly name: string
    ) {
        super(Concept.nameToId(name), 'system', new Date(), name);
    }
    static nameToId(name: string): string {
        return '#' + name;
    }
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitConcept ? visitor.visitConcept(this) : visitor.visitDefault!(this);
    }
}

export interface NodeVisitor<R> {
    visitDefinition?: (node: Definition) => R;
    visitTheorem?: (node: Theorem) => R;
    visitProof?: (node: Proof) => R;
    visitMedia?: (node: Media) => R;
    visitSource?: (node: Source) => R;
    visitValidation?: (node: Validation) => R;
    visitConcept?: (node: Concept) => R;
    visitDefault?: (node: Node) => R;
}
