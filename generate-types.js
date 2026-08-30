const fs = require('fs');
const icons = fs.readdirSync('node_modules/lucide-react/dist/esm/icons').filter(f => f.endsWith('.js')).map(f => f.replace('.js', ''));

function toPascalCase(str) {
  return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toUpperCase());
}

const pascalIcons = icons.map(toPascalCase).sort();

let content = `declare module 'lucide-react' {
  import { SVGProps } from 'react';

  export interface LucideIconProps extends SVGProps<SVGSVGElement> {
    size?: number;
  }

  export const Icon: any;
  export default Icon;

`;
for (const icon of pascalIcons) {
  content += '  export const ' + icon + ': any;\n';
}
content += `}\n`;

fs.writeFileSync('node_modules/@types/lucide-react/index.d.ts', content);
fs.writeFileSync('packages/ui/src/types/lucide-react.d.ts', content);
fs.writeFileSync('apps/frontend/src/lucide-react.d.ts', content);
console.log('Written', pascalIcons.length, 'icons');
