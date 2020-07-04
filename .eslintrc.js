module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["@typescript-eslint", "plugin:prettier/recommended"],
  rules: {
    "import/order": [
      "error",
      {
        groups: [["builtin", "external"]],
        "newlines-between": "always",
      },
    ],
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      {
        allowExpressions: true,
      },
    ],
  },
  env: {
    browser: true,
    jest: true,
  },
  parserOptions: {
    project: ["tsconfig.json"],
    tsconfigRootDir: __dirname,
    ecmaVersion: 2018,
    sourceType: "module",
  },
};
