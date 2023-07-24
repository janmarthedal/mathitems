import { createConceptNodes } from "./items/concepts";
import { load, validateIds } from "./items/load";
import { generateSite } from "./web/generate-site";

// const globPattern = 'items/**/*.md';
const globPattern = 'items/{definitions,theorems}/*.md';

const nodes = load(globPattern);

validateIds(nodes);

const conceptNodes = createConceptNodes(nodes);

const allNodes = [...nodes, ...conceptNodes];

(async () => {
    await generateSite('dist', 'layouts', { sitename: 'MathItems' }, allNodes);
})();
