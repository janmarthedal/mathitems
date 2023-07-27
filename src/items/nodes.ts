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
    public readonly validations: Array<Validation> = [];
    constructor(
        name: string,
        creator: string,
        created: Date,
        public readonly keywords: Array<string>,
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
        return visitor.visitDefinition ? visitor.visitDefinition(this) : visitor.visitAny!(this);
    }
}

export class Theorem extends ItemNode {
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitTheorem ? visitor.visitTheorem(this) : visitor.visitAny!(this);
    }
}

export class Proof extends ItemNode {
    constructor(
        id: string,
        creator: string,
        created: Date,
        keywords: Array<string>,
        public readonly parent: string,
        public readonly markup: string
    ) {
        super(id, creator, created, keywords, markup);
    }
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitProof ? visitor.visitProof(this) : visitor.visitAny!(this);
    }
}

export class Media extends NamedNode {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly subtype: string,
        public readonly description: string,
        public readonly buffer: Buffer
    ) {
        super(id, creator, created, id);
    }
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitMedia? visitor.visitMedia(this) : visitor.visitAny!(this);
    }
}

export class Source extends NamedNode {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly subtype: string,
        public readonly title: string,
        public readonly extra: Record<string, unknown>
    ) {
        super(id, creator, created, id);
    }
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitSource ? visitor.visitSource(this) : visitor.visitAny!(this);
    }
}

export class Validation extends Node {
    constructor(
        id: string,
        creator: string,
        created: Date,
        public readonly item: string,
        public readonly source: string,
        public readonly location: string
    ) {
        super(id, creator, created);
    }
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitValidation ? visitor.visitValidation(this) : visitor.visitAny!(this);
    }
}

export class Concept extends NamedNode {
    constructor(
        public readonly name: string,
        public readonly definedBy: Array<string>,
    ) {
        super(Concept.nameToId(name), 'system', new Date(), name);
    }
    static nameToId(name: string): string {
        return '#' + name;
    }
    visit<R>(visitor: NodeVisitor<R>): R {
        return visitor.visitConcept ? visitor.visitConcept(this) : visitor.visitAny!(this);
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
    visitAny?: (node: Node) => R;
}
