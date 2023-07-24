function isLegalConcept(concept: string): boolean {
    return /^[a-zA-Z-]+$/.test(concept);
}

export function scanItemMarkup(markup: string): {
    mediaUses: Set<string>;
    conceptDefines: Set<string>;
    conceptRefs: Set<string>;
    itemRefs: Set<string>;
} {
    const mediaUses = new Set<string>();
    const conceptDefines = new Set<string>();
    const conceptRefs = new Set<string>();
    const itemRefs = new Set<string>();
    for (const m of markup.matchAll(/(!?)\[(.*?)\]\((.*?)\)/gm)) {
        const [match, bang, _text, link] = m;
        if (bang) {
            mediaUses.add(link);
        } else if (link.startsWith('=')) {
            const concept = link.substring(1);
            if (!isLegalConcept(concept)) {
                throw new Error('Illegal concept being defined: ' + match);
            }
            conceptDefines.add(concept);
        } else {
            const linkParts = link.split('#');
            if (linkParts.length > 2) {
                throw new Error('Illegal reference: ' + match);
            }
            const [itemRef, conceptRef] = linkParts;
            if (!itemRef && !conceptRef) {
                throw new Error('No item or concept reference: ' + match);
            }
            if (conceptRef) {
                if (!isLegalConcept(conceptRef)) {
                    throw new Error('Illegal concept being referenced: ' + match);
                }
                conceptRefs.add(conceptRef);
            }
            if (itemRef) {
                itemRefs.add(itemRef);
            }
        }
    }
    return { mediaUses, conceptDefines, conceptRefs, itemRefs };
}
