import { load } from "./items/load";

// const globPattern = 'items/**/*.md';
const globPattern = 'items/{definition,theorems}/*.md';

const items = load(globPattern);

console.log(items);
