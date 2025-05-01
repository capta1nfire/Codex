# Codex: Estructura UI por Perfil de Usuario (Generador)

**Fecha:** 2024-08-03

**Propósito:** Documentar la estructura de la interfaz de usuario (UI) del generador principal de códigos de barras/QR, detallando los controles y opciones visibles para cada perfil de usuario (Gratuito, Pro, Enterprise).

## I. Layout General (Aplicable a Todos los Perfiles)

- **Página Única:** Funcionalidad central en `/`.
- **Layout:** Dos columnas en `md:` y superior (Izquierda: Configuración/Opciones, Derecha: Previsualización/Acciones). Se apilan verticalmente en pantallas pequeñas.
- **Contenedores:** Fondo general `bg-gray-100`, contenido centrado (`max-w-7xl`), tarjetas separadas para secciones (`bg-white`, `border`, `rounded-lg`, `shadow-md`).
- **Componentes:** La página (`page.tsx`) orquesta componentes refactorizados como `BarcodeTypeSelector`, `GenerationOptions`, `DataInput` (implícito), `PreviewDisplay`, `ActionButtons`.

## II. Perfil Gratuito (`USER`)

**Objetivo:** Máxima simplicidad, generación rápida.

**A. Columna Izquierda - Tarjeta "Configuración":**

1.  **Tipo de Código:**
    *   **Componente:** `<BarcodeTypeSelector>`
    *   **Control Interno:** `<Select>` (Shadcn UI)
    *   **Label:** "Tipo de Código:"
    *   **Opciones Visibles:** Limitadas (QR Code, Code 128, EAN-13).
    *   **Default:** `qrcode`.
2.  **Datos a Codificar:**
    *   **Control:** `<Input>` (Shadcn UI) - (Originalmente `<textarea>`, cambiado a `<Input>` durante implementación).
    *   **Label:** "Datos a Codificar:"
    *   **Placeholder:** Dinámico según tipo.
    *   **Ayuda Contextual:** (Pendiente) Texto breve debajo (`text-xs`).
    *   **Validación:** Frontend (`react-hook-form` + Zod, campo requerido).
3.  **Botón Generar:**
    *   **Control:** `<Button>` (Shadcn UI).
    *   **Texto:** "Generar Código".
    *   **Estado:** Deshabilitado si `isLoading` o datos inválidos.

**B. Columna Izquierda - Acordeón "Opciones de Personalización":**

*   **Componente:** `<GenerationOptions>`
*   **Control Interno:** `<Disclosure>` (Headless UI)
*   **Acceso:** Botón `<Disclosure.Button>` ("Opciones de Personalización").
*   **Panel (<Disclosure.Panel>):**
    *   **Escala (Tamaño Módulo):**
        *   **Control:** `<Slider>` (Shadcn UI).
        *   **Label:** "Escala ({valor})".
        *   **Default:** 4.
    *   (Otras opciones como Colores, Altura, Texto, ECL están **ocultas** para este perfil).
*   **Botón "Restablecer Opciones":**
    *   **Control:** `<Button variant="ghost">`.
    *   **Funcionalidad:** Restablece solo `options` a los valores por defecto.

**C. Columna Derecha - Tarjeta "Previsualización":**

*   **Componente:** (Implícito en `page.tsx`, usa `<BarcodeDisplay>`).
*   **Contenido:** Muestra estado de carga, placeholder o SVG generado.

**D. Columna Derecha - Área "Acciones":**

*   **Controles:** Botones "Descargar SVG", "Imprimir".
*   **Estado:** Habilitados si hay resultado (`svgContent`).

## III. Perfil Pro (`PREMIUM`)

**Objetivo:** Mayor control, más tipos, personalización estándar.

*Hereda toda la estructura del perfil Gratuito, con las siguientes modificaciones/adiciones:* 

**A. Columna Izquierda - Tarjeta "Configuración":**

1.  **Tipo de Código:**
    *   **Opciones Visibles:** Lista **completa** de tipos soportados.

**B. Columna Izquierda - Acordeón "Opciones de Personalización" (`<GenerationOptions>`):**

*   **Panel (<Disclosure.Panel>):** (Sin Pestañas)
    *   **Escala:** Visible (como en Gratuito).
    *   **Colores FG/BG:**
        *   **Controles:** 2 `<Input type="color">` y 2 `<Input type="text">`.
        *   **Labels:** "Color Frente", "Color Fondo".
        *   **Visibles:** Sí.
    *   **Mostrar Texto Legible (HRI):**
        *   **Control:** `<Switch>` (Shadcn UI).
        *   **Label:** "Mostrar texto debajo".
        *   **Visibilidad:** Solo tipos 1D.
    *   **Altura Código 1D/PDF417:**
        *   **Control:** `<Slider>` (Shadcn UI).
        *   **Label:** "Altura (px)".
        *   **Visibilidad:** Solo 1D/PDF417.
    *   **Nivel Corrección Errores (ECL) QR:**
        *   **Control:** `<Select>` (Shadcn UI).
        *   **Label:** "Nivel Corrección QR".
        *   **Opciones:** L, M, Q, H.
        *   **Visibilidad:** Solo si `type === 'qrcode'`.

**(Pendiente) C. Generación en Lote (Básica):**

*   **Acceso:** (Pendiente) Nueva pestaña/sección visible.
*   **UI:** (Pendiente) Upload CSV, selector formato, botón generar ZIP, límite de filas.

## IV. Perfil Empresarial / Técnico (`ADMIN`)

**Objetivo:** Control técnico total, opciones avanzadas.

*Hereda la estructura del perfil Pro, con las siguientes modificaciones/adiciones:* 

**A. Columna Izquierda - Acordeón "Opciones de Personalización" (`<GenerationOptions>`):**

*   **Panel (<Disclosure.Panel>):** Organizado con **Pestañas (Tabs)**:
    1.  **Pestaña "Apariencia":**
        *   Contiene controles de **Escala** y **Colores FG/BG**.
    2.  **Pestaña "Visualización":**
        *   Contiene controles de **Mostrar Texto Legible (HRI)**, **Altura Código** y **Nivel Corrección Errores (ECL) QR** (con sus visibilidades condicionales).
    3.  **Pestaña "Avanzado":**
        *   Contenido renderizado condicionalmente según `selectedType`:
            *   **QR Code:** Versión (Select), Máscara (Select), Modo ECI (Input).
            *   **Code 128:** Code Set (Select), Modo GS1-128 (Switch).
            *   **EAN/UPC:** Complemento (Input), Posición HRI (Select), Zona Silencio (Input numérico).
            *   **PDF417:** Columnas (Input numérico), Filas (Input numérico), Nivel Seguridad (Select 0-8), Compacto (Switch).
            *   **Data Matrix:** Forma (Select), Tamaño Símbolo (Input), Modo Codificación (Input).
            *   **Code 39:** Ratio (Input numérico 2.0-3.0), Dígito Verificación (Select), Full ASCII (Switch).
        *   **Tooltips:** Implementados para cada opción avanzada.
        *   **Errores:** Mensajes de error Zod inline implementados.

**(Pendiente) B. Generación en Lote (Avanzada):**

*   **Acceso:** Misma pestaña/sección que Pro.
*   **UI:** (Pendiente) Añadir opciones de mapeo CSV, anulaciones globales, reporte de errores, nomenclatura avanzada, límites altos.

**(Futuro) C. Integración Panel de Administración:**

*   Enlaces en header/menú a secciones como API Keys, Webhooks, Usuarios, etc.

## V. Consideraciones Generales / Pendientes

*   **Ayuda Contextual:** Añadir textos breves de ayuda debajo de inputs clave (ej. Datos a Codificar).
*   **Tooltips:** Completados para opciones avanzadas, revisar si se necesitan en opciones Pro.
*   **Validación Frontend:** Implementada con Zod/RHF. Revisar/refinar para nuevos campos y reglas específicas por tipo.
*   **Botón "Restablecer Opciones":** Implementado.
*   **Generación en Lote (UI y Lógica):** Pendiente.
*   **Adaptación Backend/Rust:** Pendiente verificar/implementar el manejo de todas las opciones avanzadas. 

## VI. Referencias y Especificaciones Futuras

*   **Especificación Detallada de Funcionalidades Futuras (Propuesta 2):** Para una visión más completa de las funcionalidades planificadas (generación en lote avanzada, panel de administración, white-labeling, opciones técnicas detalladas), consultar la propuesta detallada en: [https://chatgpt.com/s/dr_6812f280dd68819198b7ba3e3d4f1683](https://chatgpt.com/s/dr_6812f280dd68819198b7ba3e3d4f1683) 