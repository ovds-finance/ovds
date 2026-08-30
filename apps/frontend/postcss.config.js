import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '../..');

export default {
  plugins: {
    'postcss-import': {
      resolve(id, basedir) {
        // Handle @ovds-styles alias for CSS imports
        // @ovds-styles/globals.css -> packages/ui/src/styles/globals.css
        if (id.startsWith('@ovds-styles/')) {
          const partial = id.replace('@ovds-styles/', '');
          return path.resolve(WORKSPACE_ROOT, 'packages/ui/src/styles', partial);
        }
        // Allow @import paths that escape src/ to reach packages/
        // e.g. '../../packages/ui/src/styles/globals.css'
        if (id.startsWith('../../packages/')) {
          return path.resolve(WORKSPACE_ROOT, id.replace('../../', ''));
        }
        return null;
      },
    },
    tailwindcss: {},
    autoprefixer: {},
  },
}
