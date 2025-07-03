// Script de diagnóstico para sticky - Ejecutar en la consola del navegador

(() => {
  console.clear();
  console.log('%c=== DIAGNÓSTICO DE STICKY POSITION ===', 'color: blue; font-size: 16px; font-weight: bold');
  
  // 1. Buscar elementos sticky
  const stickyElements = document.querySelectorAll('[class*="sticky"]');
  console.log(`\n📌 Elementos con clase sticky encontrados: ${stickyElements.length}`);
  
  stickyElements.forEach((el, index) => {
    console.log(`\nElemento ${index + 1}:`, el);
    console.log('- Clases:', el.className);
    const styles = window.getComputedStyle(el);
    console.log('- Position:', styles.position);
    console.log('- Top:', styles.top);
    console.log('- Display:', styles.display);
  });
  
  // 2. Buscar la columna de preview
  const previewColumn = document.querySelector('section.lg\\:col-span-1');
  if (previewColumn) {
    console.log('\n🖼️ Columna de Preview encontrada');
    const columnStyles = window.getComputedStyle(previewColumn);
    console.log('- Height:', columnStyles.height);
    console.log('- Min-height:', columnStyles.minHeight);
    console.log('- Position:', columnStyles.position);
    console.log('- Overflow:', columnStyles.overflow);
  }
  
  // 3. Verificar grid container
  const gridContainer = document.querySelector('.generator-grid');
  if (gridContainer) {
    console.log('\n📐 Grid Container:');
    const gridStyles = window.getComputedStyle(gridContainer);
    console.log('- Display:', gridStyles.display);
    console.log('- Align-items:', gridStyles.alignItems);
    console.log('- Min-height:', gridStyles.minHeight);
  }
  
  // 4. Buscar problemas de overflow en padres
  console.log('\n🔍 Revisando overflow en elementos padre:');
  let element = previewColumn || stickyElements[0];
  let level = 0;
  const overflowProblems = [];
  
  while (element && element !== document.body && level < 10) {
    const styles = window.getComputedStyle(element);
    const overflow = {
      level: level++,
      tag: element.tagName,
      class: element.className.substring(0, 50),
      overflow: styles.overflow,
      overflowX: styles.overflowX,
      overflowY: styles.overflowY,
      position: styles.position,
      height: styles.height
    };
    
    if (styles.overflow === 'hidden' || styles.overflowX === 'hidden' || styles.overflowY === 'hidden') {
      overflowProblems.push(overflow);
      console.warn('⚠️ Problema encontrado:', overflow);
    } else {
      console.log(`✅ Nivel ${overflow.level}:`, overflow);
    }
    
    element = element.parentElement;
  }
  
  // 5. Verificar viewport y scroll
  console.log('\n📏 Información de Viewport:');
  console.log('- Window height:', window.innerHeight);
  console.log('- Document height:', document.documentElement.scrollHeight);
  console.log('- Current scroll:', window.scrollY);
  console.log('- Body overflow:', window.getComputedStyle(document.body).overflow);
  console.log('- HTML overflow:', window.getComputedStyle(document.documentElement).overflow);
  
  // 6. Test de scroll en vivo
  console.log('\n📜 Monitor de Scroll (mueve el scroll para ver cambios):');
  let scrollCount = 0;
  const scrollHandler = () => {
    scrollCount++;
    if (scrollCount % 10 === 0) { // Solo mostrar cada 10 eventos
      const sticky = document.querySelector('.lg\\:sticky');
      if (sticky) {
        const rect = sticky.getBoundingClientRect();
        console.log(`Scroll Y: ${window.scrollY}px | Sticky top: ${rect.top}px`);
      }
    }
  };
  
  window.addEventListener('scroll', scrollHandler);
  
  // 7. Resumen de problemas
  console.log('\n🔧 RESUMEN DE PROBLEMAS:');
  if (overflowProblems.length > 0) {
    console.error(`❌ Se encontraron ${overflowProblems.length} elementos con overflow hidden`);
  } else {
    console.log('✅ No hay problemas de overflow');
  }
  
  if (!stickyElements.length) {
    console.error('❌ No se encontraron elementos con clase sticky');
  }
  
  // 8. Sugerencias
  console.log('\n💡 SUGERENCIAS:');
  console.log('1. Verifica que estés en viewport desktop (>1024px)');
  console.log('2. Asegúrate de que la página tenga suficiente contenido para scroll');
  console.log('3. Revisa si hay CSS custom que sobrescriba las clases de Tailwind');
  console.log('4. Para detener el monitor: window.stopStickyDebug()');
  
  // Cleanup
  window.stopStickyDebug = () => {
    window.removeEventListener('scroll', scrollHandler);
    console.log('✅ Monitor detenido');
  };
})();