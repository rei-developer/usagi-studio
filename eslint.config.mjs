import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import prettier from "@vue/eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["dist/**", "output/**", "rust/**/target/**"] },
  js.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  prettier,
  { rules: { "prettier/prettier": ["error", { trailingComma: "es5" }] } },
];
