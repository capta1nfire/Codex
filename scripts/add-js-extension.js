/**
 * Codemod para añadir ".js" a importaciones y exportaciones relativas sin extensión
 */
// Defino la función transformadora y la exporto con parser para TSX
function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  function updateSource(node) {
    const v = node.source.value;
    // Skip styles and assets
    if (/\.(css|scss|sass|less|styl|png|jpe?g|gif|svg|json)$/.test(v)) {
      return;
    }
    // Sólo caminos relativos (./ o ../) sin extensión de código
    if (/^\.{1,2}\//.test(v) && !/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(v)) {
      node.source.value = `${v}.js`;
    }
  }

  // Procesar importaciones
  root
    .find(j.ImportDeclaration)
    .forEach(path => updateSource(path.node));

  // Procesar exportaciones nombradas con source
  root
    .find(j.ExportNamedDeclaration)
    .filter(path => path.node.source)
    .forEach(path => updateSource(path.node));

  // Procesar exportaciones totales (export * from)
  root
    .find(j.ExportAllDeclaration)
    .forEach(path => updateSource(path.node));

  return root.toSource({ quote: 'single' });
}

// Asociar el parser TSX para soportar TypeScript
transformer.parser = 'tsx';
module.exports = transformer; 