/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  plugins: ["prettier-plugin-tailwindcss"],
  printWidth: 80,
  bracketSameLine: false,
  jsxSingleQuote: false,
  singleAttributePerLine: true,
  htmlWhitespaceSensitivity: "css",
};
