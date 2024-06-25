module.exports = {
  'parser': '@typescript-eslint/parser',
  'extends': [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:prettier/recommended' // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  'parserOptions': {
    'ecmaVersion': 'ESNext',
    'sourceType': 'module',
    'project': ['tsconfig.json']
  },
  'rules': {
    'eqeqeq': ['error'], // Requires === or !== in place of == or !=
    'curly': ['error'], // Requires curly braces when a block contains only one statement
    //'@typescript-eslint/no-explicit-any': ['error'], // Don't allow any usage of 'any'
    '@typescript-eslint/no-empty-interface': ['off'], // Allows empty interfaces
    '@typescript-eslint/ban-ts-comment': ['off'], // Allows ts-ignore to be used when needed
    'object-shorthand': ['error', 'never'], // Disallows shorthand object literal
    '@typescript-eslint/ban-ts-ignore': ['off'], // Allows @ts-ignore
    '@typescript-eslint/interface-name-prefix': ['off'], // Allows interfaces prefixed with I
    '@typescript-eslint/no-non-null-assertion': ['off'], // Allows non-null assertion
    '@typescript-eslint/no-empty-function': ['off'], // Allows empty functions
    '@typescript-eslint/restrict-plus-operands': ['off'], // Allows plus operator to be used between different types
    '@typescript-eslint/require-await': ['off'], // Allows async without await
    'import/no-unresolved': ['off'], // Disable non working rule
    'import/order': ['error', { 'newlines-between': 'always' }], // Orders imports by ['builtin', 'external', 'parent', 'sibling', 'index']

    // Server specific
    '@typescript-eslint/no-unnecessary-type-assertion': ['off'], // eslint removes necessary assertions and breaks compilation

    // Downgraded to warnings
    '@typescript-eslint/ban-types': ['warn'],
    '@typescript-eslint/restrict-template-expressions': ['warn'],
    '@typescript-eslint/unbound-method': ['warn'],
    'no-useless-escape': ['warn'],
    'no-prototype-builtins': ['warn'],
    'require-atomic-updates': ['warn'],

    // TODO to investigate if to promote to errors
    '@typescript-eslint/no-unsafe-assignment': ['warn'],
    '@typescript-eslint/no-unsafe-member-access': ['warn'],
    '@typescript-eslint/no-unsafe-call': ['warn'],
    '@typescript-eslint/no-misused-promises': ['warn'],
    '@typescript-eslint/prefer-regexp-exec': ['warn'],
    '@typescript-eslint/await-thenable': ['warn'],
    '@typescript-eslint/no-unsafe-return': ['warn'],
    '@typescript-eslint/no-floating-promises': ['warn'],
    'no-case-declarations': ['warn'],

    // TODO remove both from downgraded to warnings
    '@typescript-eslint/no-explicit-any': ['warn'],
    '@typescript-eslint/no-var-requires': ['warn']
  }
};
