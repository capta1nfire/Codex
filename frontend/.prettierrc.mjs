/** @type {import("prettier").Config} */
const config = {
  semi: true, // Añadir punto y coma al final
  trailingComma: 'es5', // Coma final en arrays y objetos multi-línea
  singleQuote: true, // Usar comillas simples
  printWidth: 100, // Ancho máximo de línea
  tabWidth: 2, // Ancho de tabulación
  useTabs: false, // Usar espacios en lugar de tabs
  endOfLine: 'lf', // Fin de línea estilo Unix
  // Añadir soporte para plugins si es necesario (ej: tailwind)
  // plugins: [require('prettier-plugin-tailwindcss')], // Usar require si es .cjs, import si es .mjs
};

export default config;
