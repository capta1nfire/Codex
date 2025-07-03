// Diagnóstico completo de sticky positioning
(() => {
  console.clear();
  console.log('%c🔍 DIAGNÓSTICO COMPLETO DE STICKY', 'background: #2563eb; color: white; padding: 10px; font-size: 16px; font-weight: bold');
  
  // 1. Buscar el elemento con estilos inline sticky
  const stickyDiv = document.querySelector('div[style*="sticky"]');
  const allSticky = document.querySelectorAll('[class*="sticky"], [style*="sticky"]');
  
  console.log('\n📌 Elementos Sticky encontrados:', allSticky.length);
  
  if (stickyDiv) {
    console.log('\n✅ Elemento sticky con estilos inline encontrado:', stickyDiv);
    const rect = stickyDiv.getBoundingClientRect();
    const computed = window.getComputedStyle(stickyDiv);
    
    console.log('\n📊 Propiedades del elemento sticky:');
    console.table({
      'Position (computed)': computed.position,
      'Position (inline)': stickyDiv.style.position,
      'Top (computed)': computed.top,
      'Top (inline)': stickyDiv.style.top,
      'Z-index': computed.zIndex,
      'Display': computed.display,
      'Height': computed.height,
      'Width': computed.width,
      'Rect Top': rect.top + 'px',
      'Rect Height': rect.height + 'px'
    });
  } else {
    console.error('❌ No se encontró el elemento sticky con estilos inline');
  }
  
  // 2. Verificar el contenedor grid
  const grid = document.querySelector('.generator-grid');
  if (grid) {
    const gridComputed = window.getComputedStyle(grid);
    console.log('\n📐 Grid Container:');
    console.table({
      'Display': gridComputed.display,
      'Grid Template Columns': gridComputed.gridTemplateColumns,
      'Align Items': gridComputed.alignItems,
      'Height': gridComputed.height,
      'Min Height': gridComputed.minHeight,
      'Overflow': gridComputed.overflow
    });
  }
  
  // 3. Analizar TODOS los padres
  console.log('\n🏗️ Análisis de jerarquía completa:');
  let current = stickyDiv || allSticky[0];
  let level = 0;
  const hierarchy = [];
  
  while (current && level < 15) {
    const computed = window.getComputedStyle(current);
    const info = {
      'Nivel': level,
      'Elemento': current.tagName + (current.className ? '.' + current.className.split(' ').slice(0, 2).join('.') : ''),
      'Position': computed.position,
      'Overflow': computed.overflow,
      'Overflow-X': computed.overflowX,
      'Overflow-Y': computed.overflowY,
      'Height': computed.height,
      'Display': computed.display,
      'Transform': computed.transform !== 'none' ? '⚠️ ' + computed.transform : 'none',
      'Will-change': computed.willChange !== 'auto' ? '⚠️ ' + computed.willChange : 'auto'
    };
    
    // Detectar problemas
    if (computed.overflow === 'hidden' || computed.overflowX === 'hidden' || computed.overflowY === 'hidden') {
      info['⚠️ Problema'] = 'OVERFLOW HIDDEN';
    }
    if (computed.transform !== 'none') {
      info['⚠️ Problema'] = 'TRANSFORM';
    }
    
    hierarchy.push(info);
    current = current.parentElement;
    level++;
  }
  
  console.table(hierarchy);
  
  // 4. Verificar el viewport y body
  console.log('\n📱 Viewport y Body:');
  console.table({
    'Window Width': window.innerWidth + 'px',
    'Window Height': window.innerHeight + 'px',
    'Document Height': document.documentElement.scrollHeight + 'px',
    'Body Height': document.body.scrollHeight + 'px',
    'Current Scroll': window.scrollY + 'px',
    'Body Overflow': window.getComputedStyle(document.body).overflow,
    'HTML Overflow': window.getComputedStyle(document.documentElement).overflow,
    'Es Desktop (>1024px)': window.innerWidth >= 1024 ? '✅ SÍ' : '❌ NO'
  });
  
  // 5. Test de sticky funcionando
  console.log('\n🧪 Test de Sticky Position:');
  
  // Crear elemento de prueba
  const testDiv = document.createElement('div');
  testDiv.style.cssText = 'position: sticky; top: 10px; background: red; color: white; padding: 10px; z-index: 9999;';
  testDiv.textContent = 'TEST STICKY - Si me ves fijo al hacer scroll, sticky funciona';
  document.body.appendChild(testDiv);
  
  const testComputed = window.getComputedStyle(testDiv);
  console.log('Test element position:', testComputed.position);
  console.log('✨ Se agregó un div rojo de prueba. Haz scroll para verificar si se queda fijo.');
  
  // 6. Monitor de scroll
  let scrollCount = 0;
  const scrollMonitor = () => {
    scrollCount++;
    if (scrollCount % 20 === 0 && stickyDiv) {
      const rect = stickyDiv.getBoundingClientRect();
      console.log(`📜 Scroll: ${window.scrollY}px | Sticky top: ${rect.top}px | Fixed: ${rect.top <= 32 ? '✅' : '❌'}`);
    }
  };
  
  window.addEventListener('scroll', scrollMonitor);
  
  // 7. Resumen de problemas encontrados
  console.log('\n🚨 RESUMEN DE PROBLEMAS:');
  const problems = [];
  
  if (window.innerWidth < 1024) {
    problems.push('❌ Viewport menor a 1024px - Sticky está desactivado en móvil');
  }
  
  const overflowProblems = hierarchy.filter(h => h['⚠️ Problema']?.includes('OVERFLOW'));
  if (overflowProblems.length > 0) {
    problems.push(`❌ ${overflowProblems.length} elementos con overflow hidden`);
  }
  
  const transformProblems = hierarchy.filter(h => h['⚠️ Problema']?.includes('TRANSFORM'));
  if (transformProblems.length > 0) {
    problems.push(`❌ ${transformProblems.length} elementos con transform (rompe sticky)`);
  }
  
  if (problems.length === 0) {
    console.log('✅ No se detectaron problemas obvios');
    console.log('🤔 Posibles causas:');
    console.log('- El contenido no es suficiente para hacer scroll');
    console.log('- Hay CSS externo interfiriendo');
    console.log('- El elemento sticky no tiene altura definida');
  } else {
    problems.forEach(p => console.log(p));
  }
  
  // Cleanup
  window.cleanupStickyTest = () => {
    testDiv.remove();
    window.removeEventListener('scroll', scrollMonitor);
    console.log('✅ Limpieza completada');
  };
  
  console.log('\n🧹 Para limpiar: window.cleanupStickyTest()');
  console.log('💡 El div rojo de prueba debería quedarse fijo al hacer scroll si sticky funciona');
})();