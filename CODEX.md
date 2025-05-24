# PILAR-CODE: Documento Base del Proyecto

## Versión: v1.2.1 (Documento Vivo) 
**Fecha de última revisión:** 2024-08-02
**Estado:** Activo  
**Tipo:** Documento vivo (sujeto a revisión continua)

**Resumen Ejecutivo:**
- **Perfiles de usuarios gratuitos:** Estudiantes, diseñadores, ONG, testers, microempresas.  
- **Clientes premium:** PYMEs, grandes empresas, desarrolladores, agencias de marketing, retail, salud, eventos.  
- **Competencia global:** Herramientas como TEC‑IT, Uniqode, QR Tiger, Scanova y ME‑QR dominan la oferta; destacan en APIs, analíticas, GS1, UX y personalización.  
- **Oportunidades para Codex:** UX moderna, backend en Rust, GS1 Digital Link nativo, seguridad avanzada, exportación vectorial, white‑label, precios claros.

---

# Plataforma Web de Generación de Códigos de Barras y QR

## 1. Introducción

La plataforma web para generación de códigos de barras y QR está concebida para ofrecer una experiencia moderna, rápida e intuitiva a usuarios de todos los niveles. Compatible con navegadores modernos como Chrome, Firefox, Safari y Edge, estará diseñada para ser accesible desde dispositivos móviles y de escritorio. Con un enfoque modular y escalable, la plataforma integrará tecnologías actuales para brindar personalización avanzada, rendimiento óptimo y soporte para diferentes perfiles de usuario. Se garantizará la compatibilidad mediante pruebas automatizadas y herramientas como BrowserStack.

## 2. Objetivos Estratégicos (actualizado)
- Crear la plataforma más completa y versátil para generación de códigos de barras y QR online.  
- Ofrecer compatibilidad con la mayor variedad de lectores y escáneres del mercado.  
- Garantizar escalabilidad técnica y de negocio con modelos de suscripción.  
- Implementar APIs robustas para integraciones empresariales y SDKs nativos.  
- Mantener disponibilidad constante (99.99%+) y soporte técnico basado en IA.  
- Promover la sostenibilidad mediante soluciones digitales y hosting ecológico.  
- **Nuevo:** Soporte nativo y validación GTIN/GS1 Digital Link (Sunrise 2027).  
- **Nuevo:** Panel de analíticas avanzado para QR dinámicos.  
- **Nuevo:** UX diferenciada y rendimiento superior (Next.js + Rust).

## 2 bis. Análisis de Mercado y Competencia
1. **Perfiles de clientes:**  
   - **Gratuitos:** Generación rápida de códigos estáticos, limitaciones (sin marca blanca, sin analíticas, sin lote).  
   - **Premium:** APIs, generación en lote, QR dinámicos, branding, cumplimiento GS1, altas SLA, analíticas.  
2. **Competidores clave (10–15):**  
   - **TEC‑IT, Uniqode, QR Tiger, qr‑code‑generator.com, Scanova, QRCodeChimp, ME‑QR, Flowcode, Orca Scan, Canva, Adobe Express, Avery, QRCode Monkey**.  
3. **Modelos de monetización:** Freemium escalado, APIs de pago, publicidad en free, valor añadido en suites de diseño, software on‑premise.  
4. **Fortalezas comunes:** Variedad de simbologías, UX minimalista, APIs e integraciones, analíticas, exportación vectorial, GS1.  
5. **Debilidades detectadas:** UX densa en soluciones técnicas, precios complejos, publicidad intrusiva, falta de seguridad avanzada.

## 2 ter. Oportunidades Estratégicas
- **UX + Rendimiento:** Flujos simples (3–4 pasos) con interfaz pulida (Tailwind), backend Rust de alta concurrencia para lote/API.  
- **Compliance GS1:** Validación automática de GTIN, soporte GS1 Digital Link QR.  
- **Análisis y BI:** Panel de analíticas con mapas de calor, tendencias, alertas SLA.  
- **Personalización avanzada:** Logos, degradados, marcos CTA, plantillas white‑label.  
- **Seguridad & Confianza:** Certificaciones SOC2/ISO/GDPR, dominios custom, detección de phishing QR.  
- **Precios transparentes:** Bundle freemium claro + planes Pro/Enterprise + add‑ons.

## 3. Audiencia Objetivo

- **Usuarios técnicos:** desarrolladores, diseñadores, integradores de sistemas.
- **Empresas:** logística, manufactura, retail, ecommerce, salud.
- **Individuos:** emprendedores, pequeños negocios, estudiantes.

Cada segmento tendrá funcionalidades adaptadas a sus necesidades específicas, como carga masiva para empresas o personalización visual para diseñadores.

## 4. Arquitectura y Tecnologías

(Nota: Para detalles de implementación específicos y estructura de cada componente, consultar los archivos `README.md` dentro de los directorios `frontend/`, `backend/`, y `rust_generator/`).

### 4.1 Frontend
- Framework: Next.js (con App Router)
- Estilos: Tailwind CSS + Shadcn UI
- Responsive Design: adaptación completa a móvil y escritorio
- Accesibilidad: cumplimiento con WCAG, pruebas con AXE/WAVE

### 4.2 Backend
- Lenguaje: Node.js (TypeScript) + Express
- ORM: Prisma (conectado a PostgreSQL)
- Autenticación: Passport.js (JWT, Local, API Key hasheada)
- Modularidad: API Gateway que orquesta llamadas al servicio Rust y gestiona usuarios/auth.
- Generación de Códigos: Delegada principalmente al servicio Rust (`rust_generator`).

### 4.3 Componente Rust de Alto Rendimiento (`rust_generator`)
- Framework: Axum
- Generación: `rxing`
- Caché: `dashmap` (en memoria)
- Tracing: `tracing`

### 4.4 Infraestructura (Desarrollo/Local)
- Contenedores: Docker Compose (`docker-compose.yml`) para PostgreSQL, Redis, Prometheus, Grafana.
- Base de datos: PostgreSQL (persistencia), Redis (caché externo, **configurado pero no activamente integrado**).
- Monitoreo: Prometheus (recolección de métricas del backend Node.js), Grafana (visualización).
- (Infraestructura de producción con K8s, Cloud, CDN, Sentry/Datadog es parte del roadmap futuro).

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

## 8. Planes y Monetización (actualizado)
- **Plan Gratis:** Códigos estáticos ilimitados, personalización básica (color), PNG; sin exportación vectorial, sin analíticas, con marca Codex.  
- **Plan Profesional/PYME:** QR dinámicos limitados (X escaneos/mes), SVG/EPS, generación en lote (hasta Y), analíticas básicas, API estándar, soporte comunitario.  
- **Plan Enterprise/API:** QR dinámicos ilimitados, analíticas avanzadas, GS1 Digital Link, multiusuario, SSO/SAML, SLA 99.99%, dominios custom, soporte dedicado, plan pay‑as‑you‑go.  
- **Add-ons:** Usuarios adicionales, white‑label, pruebas de carga personalizadas.

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

## 13. Roadmap de Desarrollo (actualizado)

(Estado actual aproximado: **Finalizando Fase 1.5 / Iniciando Fase 2**)

### Fase 1: MVP (Completada)
- Interfaz básica con QR, EAN, Code128. PNG/SVG. Personalización mínima. Sin registro.

### Fase 1.5: Pre‑Beta (Mayormente Completada)
- **Pruebas de usabilidad** con benchmarks de Uniqode y Scanova.
- API básica y exportación EPS.
- Primeros tests GS1 Digital Link.
- **Implementado:** Base de datos PostgreSQL con Prisma.
- **Implementado:** Autenticación (Registro/Login/API Keys).
- **Implementado:** Dashboard básico de métricas/estado.
- **Implementado:** Monitoreo con Prometheus/Grafana.

### Fase 2: Beta (En progreso / Próximos pasos)
- Registro/SSO.
- Más simbologías + GS1 Digital Link.
- Lote (CSV).
- Panel de analíticas básicas.
- White‑label piloto.
- **Pendiente:** Integración activa de Caché Redis.
- **Pendiente:** Validación robusta de Inputs (Zod/Joi).
- **Pendiente:** Mejoras de performance y seguridad (índices BD, alertas, etc.).

### Fase 3: Producción
- API REST y GraphQL robusta.  
- SDKs nativos.  
- Dashboard multiusuario.  
- Planes Enterprise y SLA.  
- Integraciones completas (Zapier, ERP).  
- Analíticas avanzadas y exportable a BI.

## 14. Consideraciones Finales

- Plataforma multilingüe (inglés y español inicial, expansión prevista)
- Backups automáticos, replicación, plan de recuperación ante desastres
- Prácticas sostenibles: hosting verde, promoción del uso digital, etiquetas ecoamigables
- Optimización de costos en la nube con monitoreo activo

## 15. Conclusión

Este documento resume los pilares fundamentales para la construcción de una plataforma líder en generación de códigos de barras y QR en línea. Su arquitectura modular, enfoque en compatibilidad, escalabilidad, innovación y soporte la posicionan como una solución de referencia tanto para usuarios individuales como para empresas. La incorporación de estándares como GS1 Digital Link, seguimiento de escaneos y monitoreo avanzado refuerzan su proyección futura.

## 16. Changelog
- **v1.2 – 22 de abril de 2025:**  
  - Incorporación de Análisis de Mercado y Competencia global.  
  - Añadidos capítulos de Oportunidades Estratégicas.  
  - Actualización de Objetivos con GS1 y analíticas.  
  - Nuevos planes de monetización y roadmap con Fase 1.5.  
  - Referencias a investigaciones de Grok, ChatGPT y Gemini.

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
- **Documentación Estructural:** Mantener actualizados los archivos `README.md` de cada componente (raíz, backend, frontend, rust_generator) para reflejar la estructura y configuración actual (Revisión realizada: 2024-08-02).

### 17.4 Pruebas Automatizadas

- **Ampliar Cobertura:** Incrementar la cobertura de pruebas unitarias y de integración para dar confianza al refactorizar y eliminar código. Las pruebas que pasan después de una eliminación son un buen indicio (aunque no absoluto) de que el código no era esencial.

# 🏆 **CODEX - Master Project Document**

## 📋 **Table of Contents**
- [Executive Summary](#executive-summary)
- [Project Overview](#project-overview)
- [Port Configuration](#port-configuration) ← **FUENTE ÚNICA DE VERDAD**
- [Development Roadmap](#development-roadmap)
- [Business Strategy](#business-strategy)

---

## 🌐 **PORT CONFIGURATION** (SINGLE SOURCE OF TRUTH)

> **⚠️ CRITICAL**: This is the **AUTHORITATIVE** source for all port configurations. Any other document showing different ports is OBSOLETE and must be updated.

### **🔴 PRODUCTION PORTS (DEFINITIVE)**
```bash
Frontend (Next.js):       3000  # Main user interface
Backend (Express):        3004  # API and business logic  
Rust Generator (Axum):    3002  # High-performance code generation
Database (PostgreSQL):    5432  # Data persistence
Redis Cache:              6379  # Caching layer
```

### **✅ DEVELOPMENT STARTUP COMMANDS**
```bash
# 🚀 RECOMMENDED: Use enhanced script
./dev.sh

# 🔧 ALTERNATIVE: Simple script  
./dev-start.sh

# 📦 ALTERNATIVE: NPM concurrently
npm run dev

# 🏠 MANUAL: Individual services
cd backend && npm run dev       # Port 3004
cd frontend && npm run dev      # Port 3000  
cd rust_generator && cargo run # Port 3002
```

### **🌐 DEVELOPMENT URLS**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3004  
- **Rust Service**: http://localhost:3002
- **Health Check**: http://localhost:3004/health/status
- **API Docs**: http://localhost:3004/api-docs

### **🚨 HISTORICAL NOTE**
Previous agents have used conflicting ports (3001 vs 3004 for backend). This section **OVERRIDES** all previous configurations.