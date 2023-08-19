import { loadNodes } from "./load-nodes";

const { freeNumbers } = loadNodes();

console.log(`Free item numbers: ${freeNumbers.join(', ')}-`);
