/* @type {import('tailwindcss').Config} */
module.exports = {
  // A selector-based `important` only raises specificity WITHIN this
  // stylesheet's own @layer utilities block - it doesn't help against the
  // host app's CSS, which isn't layered at all. Per the CSS Cascade Layers
  // spec, ANY unlayered rule beats ANY layered rule regardless of
  // specificity, so this never actually worked once federated into a host
  // with plain (unlayered) Bootstrap/CoreUI/custom CSS. The one exception
  // the spec carves out is literal `!important`: an !important declaration
  // in a layer DOES win over a non-important unlayered one. Hence `true`
  // instead of a selector string.
  important: true,

  content: [
    './src/**/*.{html,ts}',
    './projects/**/*.{html,ts}'
  ],

  theme: {
    extend: {},
  },

  plugins: [],
};