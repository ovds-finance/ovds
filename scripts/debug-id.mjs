import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jscodeshiftUrl = new URL('file:///' + require.resolve('jscodeshift').replace(/\\/g, '/'));
const { default: jscodeshiftFn } = await import(jscodeshiftUrl.href);

// Import the j API directly
const jApiUrl = new URL('file:///' + require.resolve('jscodeshift').replace(/\\/g, '/'));
// jscodeshift exports both the CLI function and the j API

// Use the CLI-style call with built-in parser resolution
const code = 'function get_user_sessions() {}\nconst token_id = "abc";\nconst created_at = new Date();';

// Call jscodeshift CLI-style with parser name
const result = await jscodeshiftFn(code, { parser: 'tsx' }, { j: {} });
console.log(typeof result);
console.log(result);
