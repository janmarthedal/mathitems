import { globIterateSync } from 'glob';

const globPattern = 'items/**/*.md';

for (const filename of globIterateSync(globPattern, { nodir: true })) {
    console.log(filename);
}
