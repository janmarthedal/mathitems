import { load, validateIds } from "./items/load";
import { generateSite } from "./web/generate-site";

// const globPattern = 'items/**/*.md';
const globPattern = 'items/{definitions,theorems}/*.md';

const nodes = load(globPattern);

validateIds(nodes);

(async () => {
    await generateSite('dist', 'layouts', { sitename: 'MathItems' }, nodes);
})();
