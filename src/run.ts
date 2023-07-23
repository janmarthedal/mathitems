import { load } from "./items/load";
import { render } from "./web/render";

// const globPattern = 'items/**/*.md';
const globPattern = 'items/{definitions,theorems}/*.md';

const items = load(globPattern);

const d1 = items.find(item => item.meta.id === 'D1')!;

const output = render('dist', d1);

console.log(output);