import { loadNodes } from "./load-nodes";
import { generateSite } from "./web/generate-site";

const { nodes, freeNumbers } = loadNodes();

(async () => {
    await generateSite('_site', 'layouts', { sitename: 'MathItems' }, nodes, freeNumbers);
})();
