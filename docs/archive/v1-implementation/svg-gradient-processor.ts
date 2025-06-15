// Utilidad para post-procesar SVGs y aplicar gradientes
export interface GradientOptions {
  enabled: boolean;
  type: 'linear' | 'radial';
  color1: string;
  color2: string;
  direction: 'top-bottom' | 'left-right' | 'diagonal' | 'center-out';
  borders?: boolean; // Control para mostrar/ocultar bordes
}

export function applySvgGradient(svgString: string, gradientOptions: GradientOptions): string {
  console.log('[DEBUG Gradient] 🎨 Iniciando aplicación de gradiente:', gradientOptions);
  console.log('[DEBUG Gradient] 📝 SVG original:', svgString.substring(0, 200) + '...');
  
  if (!gradientOptions.enabled) {
    console.log('[DEBUG Gradient] ❌ Gradiente deshabilitado, retornando SVG original');
    return svgString;
  }

  try {
    // Parsear el SVG como DOM para manipularlo
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    
    if (!svgElement) {
      console.error('[DEBUG Gradient] ❌ No se encontró elemento SVG');
      return svgString;
    }

    console.log('[DEBUG Gradient] ✅ SVG parseado correctamente');

    // Obtener dimensiones del SVG
    const viewBox = svgElement.getAttribute('viewBox');
    const width = svgElement.getAttribute('width') || '100%';
    const height = svgElement.getAttribute('height') || '100%';
    
    console.log('[DEBUG Gradient] 📏 Atributos SVG:', { viewBox, width, height });
    
    let svgWidth = 200, svgHeight = 200; // valores por defecto
    if (viewBox) {
      const [, , w, h] = viewBox.split(' ').map(Number);
      svgWidth = w;
      svgHeight = h;
      console.log('[DEBUG Gradient] 📐 Dimensiones desde viewBox:', { svgWidth, svgHeight });
    } else {
      console.log('[DEBUG Gradient] ⚠️ No se encontró viewBox, usando dimensiones por defecto');
    }

    // Obtener o crear elemento defs
    let defs = svgElement.querySelector('defs');
    if (!defs) {
      defs = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgElement.insertBefore(defs, svgElement.firstChild);
      console.log('[DEBUG Gradient] ➕ Elemento defs creado');
    } else {
      console.log('[DEBUG Gradient] ✅ Elemento defs encontrado');
    }

    // Crear IDs únicos
    const gradientId = `gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const maskId = `mask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('[DEBUG Gradient] 🆔 IDs generados:', { gradientId, maskId });

    // Encontrar elementos negros ANTES de crear la máscara
    const blackElements = svgElement.querySelectorAll('[fill="#000000"], [fill="#000"], [fill="black"], [fill="rgb(0,0,0)"]');
    const blackGroups = svgElement.querySelectorAll('g[fill="#000000"], g[fill="#000"], g[fill="black"], g[fill="rgb(0,0,0)"]');
    
    console.log('[DEBUG Gradient] 🔍 Elementos negros encontrados:');
    console.log('  - Elementos individuales:', blackElements.length);
    console.log('  - Grupos:', blackGroups.length);
    
    // Log detallado de los primeros elementos encontrados
    if (blackElements.length > 0) {
      console.log('[DEBUG Gradient] 🔍 Primeros 3 elementos negros:');
      Array.from(blackElements).slice(0, 3).forEach((el, i) => {
        console.log(`    ${i + 1}: <${el.tagName} fill="${el.getAttribute('fill')}" ${el.getAttribute('x') ? `x="${el.getAttribute('x')}" y="${el.getAttribute('y')}" width="${el.getAttribute('width')}" height="${el.getAttribute('height')}"` : ''}/>`);
      });
    }

    // IMPORTANTE: Eliminar o hacer transparente el rectángulo blanco de fondo
    const whiteBackgrounds = svgElement.querySelectorAll('rect[fill="#FFFFFF"], rect[fill="#ffffff"], rect[fill="white"], rect[fill="rgb(255,255,255)"]');
    let backgroundsRemoved = 0;
    
    whiteBackgrounds.forEach(rect => {
      // Solo eliminar rectángulos que cubran todo el SVG (son fondos)
      const rectWidth = rect.getAttribute('width');
      const rectHeight = rect.getAttribute('height');
      const rectX = rect.getAttribute('x') || '0';
      const rectY = rect.getAttribute('y') || '0';
      
      // Si es un rectángulo que cubre todo el SVG (fondo), eliminarlo
      if ((rectWidth === svgWidth.toString() || rectWidth === '100%' || rectWidth === `${svgWidth}`) &&
          (rectHeight === svgHeight.toString() || rectHeight === '100%' || rectHeight === `${svgHeight}`) &&
          (rectX === '0' || !rectX) && (rectY === '0' || !rectY)) {
        
        console.log('[DEBUG Gradient] 🗑️ Eliminando rectángulo blanco de fondo:', {
          width: rectWidth,
          height: rectHeight,
          x: rectX,
          y: rectY,
          fill: rect.getAttribute('fill')
        });
        
        rect.remove();
        backgroundsRemoved++;
      }
    });
    
    console.log('[DEBUG Gradient] 🧹 Rectángulos de fondo eliminados:', backgroundsRemoved);

    // Si no se encuentran elementos, buscar de forma más amplia
    if (blackElements.length === 0 && blackGroups.length === 0) {
      console.log('[DEBUG Gradient] 🔍 No se encontraron elementos negros explícitos, buscando más ampliamente...');
      const allElements = svgElement.querySelectorAll('rect, path, polygon, circle, ellipse');
      console.log('[DEBUG Gradient] 📊 Todos los elementos encontrados:', allElements.length);
      
      Array.from(allElements).slice(0, 5).forEach((el, i) => {
        console.log(`    ${i + 1}: <${el.tagName} fill="${el.getAttribute('fill')}" style="${el.getAttribute('style')}"/>`);
      });
    }

    // Crear el gradiente con coordenadas absolutas
    let gradientElement;
    
    if (gradientOptions.type === 'radial') {
      gradientElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      gradientElement.setAttribute('id', gradientId);
      gradientElement.setAttribute('gradientUnits', 'userSpaceOnUse');
      gradientElement.setAttribute('cx', (svgWidth / 2).toString());
      gradientElement.setAttribute('cy', (svgHeight / 2).toString());
      gradientElement.setAttribute('r', (Math.max(svgWidth, svgHeight) * 0.7).toString());
      console.log('[DEBUG Gradient] 🌀 Gradiente radial creado:', {
        cx: svgWidth / 2,
        cy: svgHeight / 2,
        r: Math.max(svgWidth, svgHeight) * 0.7
      });
    } else {
      gradientElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradientElement.setAttribute('id', gradientId);
      gradientElement.setAttribute('gradientUnits', 'userSpaceOnUse');
      
      // Configurar dirección del gradiente lineal con coordenadas absolutas
      switch (gradientOptions.direction) {
        case 'top-bottom':
          gradientElement.setAttribute('x1', '0');
          gradientElement.setAttribute('y1', '0');
          gradientElement.setAttribute('x2', '0');
          gradientElement.setAttribute('y2', svgHeight.toString());
          break;
        case 'left-right':
          gradientElement.setAttribute('x1', '0');
          gradientElement.setAttribute('y1', '0');
          gradientElement.setAttribute('x2', svgWidth.toString());
          gradientElement.setAttribute('y2', '0');
          break;
        case 'diagonal':
          gradientElement.setAttribute('x1', '0');
          gradientElement.setAttribute('y1', '0');
          gradientElement.setAttribute('x2', svgWidth.toString());
          gradientElement.setAttribute('y2', svgHeight.toString());
          break;
        default:
          gradientElement.setAttribute('x1', '0');
          gradientElement.setAttribute('y1', '0');
          gradientElement.setAttribute('x2', '0');
          gradientElement.setAttribute('y2', svgHeight.toString());
      }
      console.log('[DEBUG Gradient] 📏 Gradiente lineal creado:', {
        direction: gradientOptions.direction,
        coordinates: {
          x1: gradientElement.getAttribute('x1'),
          y1: gradientElement.getAttribute('y1'),
          x2: gradientElement.getAttribute('x2'),
          y2: gradientElement.getAttribute('y2')
        }
      });
    }

    // Crear paradas de color
    const stop1 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', gradientOptions.color1);
    
    const stop2 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', gradientOptions.color2);
    
    gradientElement.appendChild(stop1);
    gradientElement.appendChild(stop2);
    defs.appendChild(gradientElement);
    console.log('[DEBUG Gradient] 🎨 Paradas de color agregadas:', {
      color1: gradientOptions.color1,
      color2: gradientOptions.color2
    });

    // Crear una máscara simple
    const mask = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.setAttribute('id', maskId);
    
    // Fondo negro de la máscara (oculta todo)
    const maskBackground = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    maskBackground.setAttribute('width', '100%');
    maskBackground.setAttribute('height', '100%');
    maskBackground.setAttribute('fill', 'black');
    mask.appendChild(maskBackground);
    console.log('[DEBUG Gradient] 🎭 Fondo de máscara creado (negro - oculta todo)');

    let maskElementsCreated = 0;
    
    // Agregar elementos negros a la máscara como blancos
    blackElements.forEach(element => {
      const maskElement = element.cloneNode(true) as Element;
      maskElement.setAttribute('fill', 'white'); // En la máscara, blanco = visible
      mask.appendChild(maskElement);
      maskElementsCreated++;
    });

    // También buscar en grupos
    blackGroups.forEach(group => {
      const maskElement = group.cloneNode(true) as Element;
      maskElement.setAttribute('fill', 'white');
      mask.appendChild(maskElement);
      maskElementsCreated++;
    });

    defs.appendChild(mask);
    console.log('[DEBUG Gradient] 🎭 Máscara creada con', maskElementsCreated, 'elementos blancos');

    // Hacer los elementos originales transparentes
    blackElements.forEach(element => {
      element.setAttribute('fill', 'transparent');
      // Agregar borde blanco transparente solo si está habilitado
      if (gradientOptions.borders) {
        element.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
        element.setAttribute('stroke-width', '0.025');
      }
    });
    blackGroups.forEach(group => {
      group.setAttribute('fill', 'transparent');
      // Agregar borde blanco transparente a elementos del grupo si está habilitado
      if (gradientOptions.borders) {
        const groupElements = group.querySelectorAll('rect, path, polygon, circle, ellipse');
        groupElements.forEach(el => {
          el.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
          el.setAttribute('stroke-width', '0.025');
        });
      }
    });
    console.log('[DEBUG Gradient] 👻 Elementos originales hechos transparentes' + (gradientOptions.borders ? ' con bordes transparentes' : ''));

    // Crear un rectángulo de fondo con el gradiente y la máscara
    const backgroundRect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    backgroundRect.setAttribute('x', '0');
    backgroundRect.setAttribute('y', '0');
    backgroundRect.setAttribute('width', svgWidth.toString());
    backgroundRect.setAttribute('height', svgHeight.toString());
    backgroundRect.setAttribute('fill', `url(#${gradientId})`);
    backgroundRect.setAttribute('mask', `url(#${maskId})`);
    
    // Insertar el rectángulo de fondo después de defs, pero antes del contenido
    const firstNonDefs = Array.from(svgElement.children).find(child => child.tagName !== 'defs');
    if (firstNonDefs) {
      svgElement.insertBefore(backgroundRect, firstNonDefs);
      console.log('[DEBUG Gradient] 📦 Rectángulo de fondo insertado antes del primer elemento');
    } else {
      svgElement.appendChild(backgroundRect);
      console.log('[DEBUG Gradient] 📦 Rectángulo de fondo agregado al final');
    }

    console.log('[DEBUG Gradient] 🎯 Rectángulo de fondo creado:', {
      x: 0, y: 0,
      width: svgWidth,
      height: svgHeight,
      fill: `url(#${gradientId})`,
      mask: `url(#${maskId})`
    });

    // Serializar el SVG modificado
    const serializer = new XMLSerializer();
    const result = serializer.serializeToString(svgDoc);
    
    console.log('[DEBUG Gradient] 📄 SVG resultante (primeros 500 chars):', result.substring(0, 500));
    console.log('[DEBUG Gradient] ✅ SVG procesado exitosamente');
    
    return result;

  } catch (error) {
    console.error('[DEBUG Gradient] ❌ Error procesando gradiente:', error);
    console.error('[DEBUG Gradient] 📄 SVG original que causó el error:', svgString);
    return svgString; // Fallback al SVG original
  }
} 