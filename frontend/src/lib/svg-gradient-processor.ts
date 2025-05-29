// Utilidad para post-procesar SVGs y aplicar gradientes
export interface GradientOptions {
  enabled: boolean;
  type: 'linear' | 'radial';
  color1: string;
  color2: string;
  direction: 'top-bottom' | 'left-right' | 'diagonal' | 'center-out';
}

export function applySvgGradient(svgString: string, gradientOptions: GradientOptions): string {
  console.log('[DEBUG Gradient] 🎨 Iniciando aplicación de gradiente:', gradientOptions);
  
  if (!gradientOptions.enabled) {
    console.log('[DEBUG Gradient] ❌ Gradiente deshabilitado, retornando SVG original');
    return svgString;
  }

  // Parsear el SVG como DOM para manipularlo
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');
  
  if (!svgElement) {
    console.error('[DEBUG Gradient] ❌ No se encontró elemento SVG');
    return svgString;
  }

  console.log('[DEBUG Gradient] ✅ SVG parseado correctamente:', {
    width: svgElement.getAttribute('width'),
    height: svgElement.getAttribute('height'),
    viewBox: svgElement.getAttribute('viewBox'),
    children: svgElement.children.length
  });

  // Obtener dimensiones del viewBox o del SVG
  const viewBox = svgElement.getAttribute('viewBox');
  
  if (viewBox) {
    const [, , w, h] = viewBox.split(' ').map(Number);
    // Se obtienen las dimensiones pero no se usan en esta implementación
    // Podrían usarse para validaciones futuras
  }

  // Crear IDs únicos
  const gradientId = `gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const maskId = `mask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Crear elemento defs si no existe
  let defs = svgElement.querySelector('defs');
  if (!defs) {
    defs = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgElement.insertBefore(defs, svgElement.firstChild);
    console.log('[DEBUG Gradient] ➕ Elemento defs creado');
  } else {
    console.log('[DEBUG Gradient] ✅ Elemento defs ya existía');
  }
  
  console.log('[DEBUG Gradient] 📁 Estado inicial de defs:', {
    defsChildren: defs.children.length
  });

  // 1. Crear la máscara usando los elementos originales del QR
  const mask = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'mask');
  mask.setAttribute('id', maskId);
  
  // Fondo negro de la máscara (oculta)
  const maskBackground = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
  maskBackground.setAttribute('width', '100%');
  maskBackground.setAttribute('height', '100%');
  maskBackground.setAttribute('fill', 'black');
  mask.appendChild(maskBackground);

  // Copiar todos los elementos visibles del QR a la máscara en blanco (revela)
  const qrElements = svgElement.querySelectorAll('rect, path, circle, polygon');
  const qrGroups = svgElement.querySelectorAll('g[fill]');
  
  console.log('[DEBUG Gradient] 📋 Elementos encontrados:', {
    qrElements: qrElements.length,
    qrGroups: qrGroups.length
  });
  
  // Clonar elementos individuales que no sean el fondo
  let elementsCloned = 0;
  qrElements.forEach(element => {
    const fill = element.getAttribute('fill');
    console.log('[DEBUG Gradient] 🔍 Elemento rect:', { fill, tagName: element.tagName });
    if (fill && fill !== '#FFFFFF' && fill !== '#ffffff' && fill !== 'white' && fill !== 'transparent') {
      const maskElement = element.cloneNode(true) as Element;
      maskElement.setAttribute('fill', 'white'); // En la máscara, blanco = visible
      mask.appendChild(maskElement);
      elementsCloned++;
    }
  });

  // Clonar grupos que tengan fill
  let groupsCloned = 0;
  qrGroups.forEach(group => {
    const fill = group.getAttribute('fill');
    console.log('[DEBUG Gradient] 🔍 Grupo:', { fill, tagName: group.tagName, children: group.children.length });
    if (fill && fill !== '#FFFFFF' && fill !== '#ffffff' && fill !== 'white' && fill !== 'transparent') {
      const maskGroup = group.cloneNode(true) as Element;
      // Cambiar todos los fills en el grupo clonado a blanco
      maskGroup.setAttribute('fill', 'white');
      const innerElements = maskGroup.querySelectorAll('[fill]');
      innerElements.forEach(el => {
        const innerFill = el.getAttribute('fill');
        if (innerFill && innerFill !== '#FFFFFF' && innerFill !== '#ffffff' && innerFill !== 'white' && innerFill !== 'transparent') {
          el.setAttribute('fill', 'white');
        }
      });
      mask.appendChild(maskGroup);
      groupsCloned++;
    }
  });

  console.log('[DEBUG Gradient] 📊 Clonación completada:', {
    elementsCloned,
    groupsCloned,
    maskChildren: mask.children.length
  });

  defs.appendChild(mask);

  // 2. Crear el gradiente
  let gradientElement;
  
  if (gradientOptions.type === 'linear') {
    gradientElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradientElement.setAttribute('id', gradientId);
    
    // Configurar dirección del gradiente lineal
    switch (gradientOptions.direction) {
      case 'top-bottom':
        gradientElement.setAttribute('x1', '0%');
        gradientElement.setAttribute('y1', '0%');
        gradientElement.setAttribute('x2', '0%');
        gradientElement.setAttribute('y2', '100%');
        break;
      case 'left-right':
        gradientElement.setAttribute('x1', '0%');
        gradientElement.setAttribute('y1', '0%');
        gradientElement.setAttribute('x2', '100%');
        gradientElement.setAttribute('y2', '0%');
        break;
      case 'diagonal':
        gradientElement.setAttribute('x1', '0%');
        gradientElement.setAttribute('y1', '0%');
        gradientElement.setAttribute('x2', '100%');
        gradientElement.setAttribute('y2', '100%');
        break;
      default:
        gradientElement.setAttribute('x1', '0%');
        gradientElement.setAttribute('y1', '0%');
        gradientElement.setAttribute('x2', '0%');
        gradientElement.setAttribute('y2', '100%');
    }
  } else {
    // Gradiente radial
    gradientElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    gradientElement.setAttribute('id', gradientId);
    gradientElement.setAttribute('cx', '50%');
    gradientElement.setAttribute('cy', '50%');
    gradientElement.setAttribute('r', '70%'); // Un poco más grande para mejor cobertura
  }

  // Crear paradas de color (usando colores reales)
  const stop1 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', gradientOptions.color1); // Color real 1
  stop1.setAttribute('stop-opacity', '1');

  const stop2 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', gradientOptions.color2); // Color real 2
  stop2.setAttribute('stop-opacity', '1');
  
  console.log('[DEBUG Gradient] 🌈 Gradiente creado con colores reales:', {
    color1: gradientOptions.color1,
    color2: gradientOptions.color2
  });

  gradientElement.appendChild(stop1);
  gradientElement.appendChild(stop2);
  defs.appendChild(gradientElement);
  
  console.log('[DEBUG Gradient] 📐 Gradiente agregado a defs:', {
    gradientType: gradientElement.tagName,
    gradientId: gradientElement.getAttribute('id'),
    x1: gradientElement.getAttribute('x1'),
    y1: gradientElement.getAttribute('y1'),
    x2: gradientElement.getAttribute('x2'),
    y2: gradientElement.getAttribute('y2'),
    cx: gradientElement.getAttribute('cx'),
    cy: gradientElement.getAttribute('cy'),
    r: gradientElement.getAttribute('r'),
    stops: gradientElement.children.length
  });

  // 3. NUEVO ENFOQUE: Crear rectángulos individuales para bordes + gradiente global
  console.log('[DEBUG Gradient] 🎨 Creando rectángulos individuales para bordes + gradiente global');
  
  let individualRectsCreated = 0;
  
  // Procesar elementos rect individuales - SOLO PARA BORDES
  qrElements.forEach(element => {
    const fill = element.getAttribute('fill');
    if (fill && fill !== '#FFFFFF' && fill !== '#ffffff' && fill !== 'white' && fill !== 'transparent') {
      // Crear un nuevo rectángulo solo para el borde
      const borderRect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      
      // Copiar posición y tamaño del elemento original
      borderRect.setAttribute('x', element.getAttribute('x') || '0');
      borderRect.setAttribute('y', element.getAttribute('y') || '0');
      borderRect.setAttribute('width', element.getAttribute('width') || '4');
      borderRect.setAttribute('height', element.getAttribute('height') || '4');
      
      // Solo borde, sin fill para que se vea el gradiente de abajo
      borderRect.setAttribute('fill', 'none');
      borderRect.setAttribute('stroke', 'white');
      borderRect.setAttribute('stroke-width', '0.05');
      borderRect.setAttribute('stroke-opacity', '0.3');
      borderRect.setAttribute('class', 'border-rect');
      
      // Insertar el nuevo rectángulo después del original
      element.parentNode?.insertBefore(borderRect, element.nextSibling);
      
      // Ocultar el elemento original
      element.setAttribute('visibility', 'hidden');
      
      individualRectsCreated++;
    }
  });

  // Procesar grupos que contienen elementos rect - SOLO PARA BORDES
  qrGroups.forEach(group => {
    const fill = group.getAttribute('fill');
    if (fill && fill !== '#FFFFFF' && fill !== '#ffffff' && fill !== 'white' && fill !== 'transparent') {
      // Crear un nuevo grupo para los rectángulos con bordes
      const borderGroup = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
      borderGroup.setAttribute('class', 'border-group');
      
      // Procesar cada rect dentro del grupo
      const innerRects = group.querySelectorAll('rect');
      innerRects.forEach(rect => {
        const borderRect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
        
        // Copiar posición y tamaño
        borderRect.setAttribute('x', rect.getAttribute('x') || '0');
        borderRect.setAttribute('y', rect.getAttribute('y') || '0');
        borderRect.setAttribute('width', rect.getAttribute('width') || '4');
        borderRect.setAttribute('height', rect.getAttribute('height') || '4');
        
        // Solo borde, sin fill para que se vea el gradiente de abajo
        borderRect.setAttribute('fill', 'none');
        borderRect.setAttribute('stroke', 'white');
        borderRect.setAttribute('stroke-width', '0.05');
        borderRect.setAttribute('stroke-opacity', '0.3');
        borderRect.setAttribute('class', 'border-rect');
        
        borderGroup.appendChild(borderRect);
        individualRectsCreated++;
      });
      
      // Insertar el nuevo grupo después del original
      group.parentNode?.insertBefore(borderGroup, group.nextSibling);
      
      // Ocultar el grupo original
      group.setAttribute('visibility', 'hidden');
    }
  });

  console.log('[DEBUG Gradient] ✨ Rectángulos de borde creados:', { 
    individualRectsCreated,
    totalElements: qrElements.length,
    totalGroups: qrGroups.length
  });

  // 4. Crear rectángulo global con gradiente usando máscara
  const globalGradientRect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
  globalGradientRect.setAttribute('width', '100%');
  globalGradientRect.setAttribute('height', '100%');
  globalGradientRect.setAttribute('fill', `url(#${gradientId})`);
  globalGradientRect.setAttribute('mask', `url(#${maskId})`);
  globalGradientRect.setAttribute('class', 'global-gradient-rect');
  globalGradientRect.setAttribute('style', `fill: url(#${gradientId}) !important;`);
  
  console.log('[DEBUG Gradient] 🌈 Rectángulo gradiente global creado con máscara');

  // 5. Insertar el gradiente global ANTES de los bordes (para que esté debajo)
  const firstNonDefs = Array.from(svgElement.children).find(child => child.tagName !== 'defs');
  if (firstNonDefs) {
    svgElement.insertBefore(globalGradientRect, firstNonDefs);
    console.log('[DEBUG Gradient] ✅ Gradiente global insertado antes del primer elemento');
  } else {
    svgElement.appendChild(globalGradientRect);
    console.log('[DEBUG Gradient] ✅ Gradiente global agregado al final');
  }

  // Serializar el SVG modificado
  const serializer = new XMLSerializer();
  const result = serializer.serializeToString(svgDoc);
  
  console.log('[DEBUG Gradient] 🏁 SVG procesado:', {
    originalLength: svgString.length,
    resultLength: result.length,
    gradientId,
    maskId,
    svgChildren: svgElement.children.length,
    defsChildren: defs?.children.length
  });
  
  // Log de la estructura del SVG
  console.log('[DEBUG Gradient] 🏗️ Estructura final del SVG:', {
    children: Array.from(svgElement.children).map((child, index) => ({
      index,
      tagName: child.tagName,
      id: child.getAttribute('id'),
      fill: child.getAttribute('fill'),
      mask: child.getAttribute('mask'),
      visibility: child.getAttribute('visibility'),
      opacity: child.getAttribute('opacity'),
      width: child.getAttribute('width'),
      height: child.getAttribute('height')
    }))
  });
  
  // Log del SVG resultante (truncado)
  console.log('[DEBUG Gradient] 📄 SVG resultante (primeros 500 chars):', result.substring(0, 500));
  
  return result;
} 