module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    // "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": "off",
    "indent": ["warn", 2],
    "@typescript-eslint/no-explicit-any": "off", // Allow usage of 'any' type
    "@typescript-eslint/explicit-function-return-type": "off", // Don't require explicit return types
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { "argsIgnorePattern": "^_" }, // Ignore unused variables starting with '_'
    ],
    "@typescript-eslint/no-non-null-assertion": "off", // Allow non-null assertions
    "max-len": ["warn", { "code": 120 }], // Increase max line length
    "require-jsdoc": "off", // Disable JSDoc requirement
  },
};
