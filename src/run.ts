import { createConceptNodes } from "./items/concepts";
import { load, validateIds } from "./items/load";
import { attachValidations } from "./items/validations";
import { generateSite } from "./web/generate-site";

const globPattern = 'items/**/*';

const nodes = load(globPattern);
validateIds(nodes);
const conceptNodes = createConceptNodes(nodes);
const allNodes = [...nodes, ...conceptNodes];
attachValidations(allNodes);

// check for references to non-existent nodes
// check for reference cycles (which includes self-references)

(async () => {
    await generateSite('_site', 'layouts', { sitename: 'MathItems' }, allNodes);
})();
