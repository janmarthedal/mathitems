export enum ItemType {
    Definition = 'D',
    Theorem = 'T',
    Proof = 'P',
    Media = 'M',
    Source = 'S',
    Validation = 'V',
}

export interface ItemMetaBase {
    id: string;
    type: ItemType;
    creator: string;
    created: Date;
}

export interface ItemMetaDefinition extends ItemMetaBase {
    type: ItemType.Definition;
}

export interface ItemMetaTheorem extends ItemMetaBase {
    type: ItemType.Theorem;
}

export interface ItemMetaProof extends ItemMetaBase {
    type: ItemType.Proof;
    parent: string;
}

export interface ItemMetaMedia extends ItemMetaBase {
    type: ItemType.Media;
    subtype: string;
    path: string;
    description: string;
}

export interface ItemMetaSource extends ItemMetaBase {
    type: ItemType.Source;
    subtype: string;
    title: string;
}

export interface ItemMetaValidation extends ItemMetaBase {
    type: ItemType.Validation;
    source: string;
    item: string;
    location: string;
}

export type ItemMeta = ItemMetaDefinition | ItemMetaTheorem | ItemMetaProof | ItemMetaMedia | ItemMetaSource | ItemMetaValidation;

export interface ItemData {
    meta: ItemMeta;
    content: string;
}
