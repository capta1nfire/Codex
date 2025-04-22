# PILAR-CODE: Documento Base del Proyecto

## Versión: v1.1 
**Fecha de publicación:** 13 de abril de 2025  
**Estado:** Activo  
**Tipo:** Documento vivo (sujeto a revisión continua)

*Este documento representa el fundamento estratégico y técnico del proyecto de plataforma web para generación de códigos de barras y QR. Servirá como eje central para su construcción, evolución e integración con tecnologías emergentes e inteligencias artificiales.*

---

# Plataforma Web de Generación de Códigos de Barras y QR

## 1. Introducción

La plataforma web para generación de códigos de barras y QR está concebida para ofrecer una experiencia moderna, rápida e intuitiva a usuarios de todos los niveles. Compatible con navegadores modernos como Chrome, Firefox, Safari y Edge, estará diseñada para ser accesible desde dispositivos móviles y de escritorio. Con un enfoque modular y escalable, la plataforma integrará tecnologías actuales para brindar personalización avanzada, rendimiento óptimo y soporte para diferentes perfiles de usuario. Se garantizará la compatibilidad mediante pruebas automatizadas y herramientas como BrowserStack.

## 2. Objetivos Estratégicos

- Crear la plataforma más completa y versátil para generación de códigos de barras y QR online.
- Ofrecer compatibilidad con la mayor variedad de lectores y escáneres del mercado.
- Garantizar escalabilidad técnica y de negocio con modelos de suscripción.
- Implementar APIs robustas para integraciones empresariales.
- Mantener disponibilidad constante (99.99%+) y soporte técnico basado en IA.
- Promover la sostenibilidad mediante soluciones digitales y hosting ecológico.

## 3. Audiencia Objetivo

- **Usuarios técnicos:** desarrolladores, diseñadores, integradores de sistemas.
- **Empresas:** logística, manufactura, retail, ecommerce, salud.
- **Individuos:** emprendedores, pequeños negocios, estudiantes.

Cada segmento tendrá funcionalidades adaptadas a sus necesidades específicas, como carga masiva para empresas o personalización visual para diseñadores.

## 4. Arquitectura y Tecnologías

### 4.1 Frontend
- Framework: Next.js
- Estilos: Tailwind CSS
- Responsive Design: adaptación completa a móvil y escritorio
- Accesibilidad: cumplimiento con WCAG, pruebas con AXE/WAVE

### 4.2 Backend
- Lenguaje: Node.js + Rust
- Servidor: Express o Fastify para Node.js, Axum para Rust
- Modularidad: arquitectura basada en microservicios para:
  - Generación de códigos (bwip-js, qrcode en Node.js, rxing en Rust)
  - Autenticación (OAuth2, MFA)
  - Gestor de usuarios y planes
  - API externa
  - Seguimiento de escaneos de códigos QR (analytics)

### 4.3 Componente Rust de Alto Rendimiento
- Utiliza el framework Axum para APIs web de alto rendimiento
- Integración con rxing para generación nativa de códigos
- Sistema de caché con dashmap para resultados frecuentes
- Tracing avanzado para monitoreo y diagnóstico
- Arquitectura orientada a rendimiento para cargas intensivas

### 4.4 Infraestructura
- Contenedores: Docker + Kubernetes
- Cloud: AWS / GCP / Azure
- CDN global para distribución de activos
- Base de datos: PostgreSQL (estructura), Redis (caché), S3 (archivos)
- Monitoreo: Datadog, Sentry, Prometheus para logging, trazabilidad y alertas

## 5. Interfaz y Experiencia de Usuario

- Diseño limpio y moderno
- Selector de tipo de código con opciones personalizables
- Vista previa en tiempo real
- Opciones de personalización: colores, tamaño, formato (PNG, SVG, PDF), logos
- Plantillas: integración futura con Canva o Figma
- Multilingüe: interfaz disponible inicialmente en inglés y español, con plan de expansión a francés, alemán, etc. mediante DeepL

## 6. Seguridad y Normativas

- Autenticación segura (OAuth2, MFA)
- Cifrado en tránsito (HTTPS) y reposo
- Rate limiting, protección contra abuso de API
- Consentimiento de datos para cumplimiento de GDPR/CCPA
- Auditorías regulares de seguridad

## 7. Compatibilidad y Estándares

### 7.1 Lectores de Códigos
- Soporte para: UPC, EAN, Code 39, Code 128, QR Code, Data Matrix, PDF417, entre otros
- Compatible con escáneres industriales, POS y dispositivos móviles
- Validación con normas GS1, ISO/IEC
- Soporte para GS1 Digital Link para productos conectados

### 7.2 Impresoras Industriales y Térmicas
- Exportación en formatos de alta calidad (PNG, SVG)
- Guías para resolución, tamaño, compatibilidad con impresoras como Zebra

## 8. Planes y Monetización

- Plan gratuito con límites diarios y marcas de agua
- Planes Pro y Empresarial con:
  - Mayor número de tipos de código
  - Descargas en lote
  - Personalización avanzada
  - Acceso a la API
  - Soporte prioritario
  - Seguimiento de escaneos (analytics)
- Modelo "pay-as-you-go" para startups y bajo volumen
- Programas de referidos y pruebas gratuitas temporales

## 9. API Externa e Integraciones

- API REST y futura API GraphQL
- Documentación completa y SDKs (JS, Python, PHP)
- Dashboard de uso por token y plan
- Webhooks para automatizaciones
- Soporte para generación de códigos dinámicos/variables
- Integraciones con Zapier, Shopify, WooCommerce, ERP

## 10. Soporte, Comunidad y Escalabilidad

- Asistente virtual IA para onboarding y soporte
- Base de conocimiento y tutoriales interactivos
- Sistema de tickets con SLA por plan
- Comunidad activa en foro, Discord y redes sociales
- Sesiones Q&A, feedback participativo, roadmap compartido
- Infraestructura autoescalable según demanda
- Canales de soporte: chat, email y telefónico

## 11. Metodología de Desarrollo

- Desarrollo ágil (Scrum / Kanban)
- Control de versiones con GitHub
- Automatización de despliegues (CI/CD)
- Pruebas unitarias, de integración y E2E
- Pruebas de carga y compatibilidad cross-browser

## 12. KPIs Iniciales y Medición de Éxito

- Tiempo medio de generación < 1s
- 95% de compatibilidad con lectores del mercado
- SLA de disponibilidad 99.99%
- Tiempo de respuesta de la API < 200ms
- NPS ≥ 8
- Tasa de adopción mensual > 15%

## 13. Roadmap de Desarrollo

### Fase 1: MVP
- Interfaz web básica con generación de códigos estándar (QR, EAN, Code128)
- Descarga en PNG y SVG
- Personalización básica (color, tamaño)
- Sin registro obligatorio
- Feedback de usuarios

### Fase 2: Beta
- Registro e inicio de sesión
- Más tipos de códigos
- Carga masiva (CSV)
- Primeros planes de pago
- Versión inicial de la API

### Fase 3: Producción
- API robusta y documentada
- Dashboard de usuarios
- Sistema de roles y permisos
- Planes empresariales
- Integraciones con terceros
- Seguimiento de escaneos QR (analytics)

## 14. Consideraciones Finales

- Plataforma multilingüe (inglés y español inicial, expansión prevista)
- Backups automáticos, replicación, plan de recuperación ante desastres
- Prácticas sostenibles: hosting verde, promoción del uso digital, etiquetas ecoamigables
- Optimización de costos en la nube con monitoreo activo

## 15. Conclusión

Este documento resume los pilares fundamentales para la construcción de una plataforma líder en generación de códigos de barras y QR en línea. Su arquitectura modular, enfoque en compatibilidad, escalabilidad, innovación y soporte la posicionan como una solución de referencia tanto para usuarios individuales como para empresas. La incorporación de estándares como GS1 Digital Link, seguimiento de escaneos y monitoreo avanzado refuerzan su proyección futura.

## 16. Changelog

### v1.2 - [Fecha Actual]
- **Backend:** Migración del UserStore en memoria a **PostgreSQL usando Prisma ORM**.
- **Backend:** Implementación de **hasheo de API Keys** (bcrypt) y generación segura (crypto).
- **Backend:** Refactorización de la lógica de generación de códigos a `barcodeService.ts`, eliminando duplicación en `index.ts`.
- **Backend:** Refactorización del manejo de caché en memoria a `utils/cache.ts`.
- **Backend:** Corrección de errores menores (tipos, configuración de logger).
- **Frontend:** Mejoras significativas de **responsividad** en Navbar, Formularios (Login/Registro) y Página Principal del Generador para pantallas grandes (4K).
- **Frontend:** Refactorización de la página del Generador para usar componentes UI (`Input`, `Select`, `Button`, `Label`) y estructura de tarjetas/disclosure.
- **Frontend:** Aplicación de **estilo visual consistente** (tarjetas, componentes UI) a la página de Perfil.
- **Frontend:** Implementada carga inicial de QR por defecto y actualización dinámica de datos de ejemplo.
- **Servicio Rust:** Integración de `EncodeHints` de `rxing` para soportar opciones de codificación avanzadas.
- **Infraestructura:** Añadido `docker-compose.yml` para gestionar base de datos PostgreSQL en desarrollo.

### v1.1 - 13 de abril de 2025
- Actualización para incluir detalles del componente Rust para generación de códigos.
- Inclusión de Axum y rxing en la arquitectura del backend.
- Detalles sobre el sistema de caché y tracing avanzado en el componente Rust.
- Actualización de la versión del documento.

### v1.0 - 28 de marzo de 2025
- Documento base inicial "PILAR-CODE" creado.
- Incluye arquitectura general (Next.js, Node.js, Docker, Kubernetes).
- Definición de audiencias, objetivos estratégicos y compatibilidad con navegadores.
- Integración de estándares como GS1 Digital Link.
- Incorporación de funciones avanzadas como seguimiento de escaneos y monitoreo con Datadog/Sentry.
- Plan de sostenibilidad y expansión multilingüe.
- Inclusión del roadmap de desarrollo y KPIs iniciales.

## 17. Mantenimiento y Calidad de Código (Plan de Mejora Continua)

Para asegurar la mantenibilidad, escalabilidad y robustez del proyecto a largo plazo, se adoptarán las siguientes herramientas y prácticas de forma continua:

### 17.1 Herramientas Automatizadas

- **Linters y Análisis Estático:**
    - **ESLint (Frontend/Backend):** Configurar y reforzar reglas para detectar variables, funciones e importaciones no utilizadas. Integrar en procesos de pre-commit o CI.
    - **Clippy (Rust):** Ejecutar `cargo clippy` regularmente y configurar para tratar las advertencias relevantes (especialmente las de código no utilizado o complejidad) como errores de compilación.
    - **Analizador de Dependencias (`depcheck`):** Integrar `depcheck` en los directorios `frontend` y `backend` para identificar y eliminar dependencias de `package.json` que ya no se importan en el código.
    - **Analizador de Código Muerto (`ts-prune`):** Utilizar `ts-prune` en `frontend` y `backend` para detectar funciones o clases exportadas que no son importadas por ningún otro módulo.

### 17.2 Prácticas de Desarrollo

- **Principio DRY (Don't Repeat Yourself):** Buscar activamente oportunidades para abstraer lógica repetida en funciones, componentes o módulos reutilizables.
- **Modularidad:** Mantener un diseño de código modular y cohesivo para facilitar la reutilización y la identificación de código obsoleto.
- **Refactorización Continua:** Dedicar tiempo regularmente a mejorar la estructura y claridad del código existente, eliminando deuda técnica.
- **Revisiones de Código:** Fomentar la revisión crítica del código (propia o por pares) antes de integrar cambios importantes, enfocándose en claridad, simplicidad y posibles duplicaciones.
- **Workflow y Continuidad:**
    - Utilizar el archivo `CONTEXT_SUMMARY.md` para documentar el estado del proyecto al final de cada sesión de trabajo, facilitando la re-contextualización en futuras sesiones.
    - Realizar commits atómicos y descriptivos (`git commit -m "..."`) con frecuencia y sincronizar con el repositorio remoto (`git push`) para salvaguardar el progreso y facilitar la colaboración.

### 17.3 Comentarios y Documentación

- **Comentarios con Propósito:** Priorizar comentarios que expliquen el *por qué* de decisiones complejas, no el *qué* hace el código.
- **Uso de Etiquetas `TODO`/`FIXME`:** Marcar áreas que requieren atención futura y revisarlas periódicamente.
- **Eliminación de Comentarios Obsoletos:** Al refactorizar o eliminar código, eliminar también los comentarios asociados. Evitar dejar grandes bloques de código comentado; usar Git para el historial.

### 17.4 Pruebas Automatizadas

- **Ampliar Cobertura:** Incrementar la cobertura de pruebas unitarias y de integración para dar confianza al refactorizar y eliminar código. Las pruebas que pasan después de una eliminación son un buen indicio (aunque no absoluto) de que el código no era esencial.