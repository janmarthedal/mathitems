import { loadNodes } from "./load-nodes";
import { generateSite } from "./web/generate-site";

const allNodes = loadNodes();

(async () => {
    await generateSite('_site', 'layouts', { sitename: 'MathItems' }, allNodes);
})();
