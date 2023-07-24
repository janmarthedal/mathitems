import { load } from "./items/load";
import { generateSite } from "./web/generate-site";

// const globPattern = 'items/**/*.md';
const globPattern = 'items/{definitions,theorems}/*.md';

const items = load(globPattern);

(async () => {
    await generateSite('dist', 'layouts', { sitename: 'MathItems' }, items);
})();
