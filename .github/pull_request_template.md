## 📋 Descripción del Cambio

<!-- Proporciona una descripción clara y concisa de lo que hace este PR -->

## 🎯 Tipo de Cambio

<!-- Marca el tipo de cambio que mejor describa este PR -->

- [ ] 🐛 Bug fix (cambio no breaking que soluciona un issue)
- [ ] ✨ Nueva feature (cambio no breaking que agrega funcionalidad)
- [ ] 💥 Breaking change (fix o feature que causaría que funcionalidad existente no funcione como se espera)
- [ ] 📝 Documentación (cambios solo en documentación)
- [ ] 🔧 Configuración (cambios en configuración o scripts)
- [ ] ♻️ Refactor (cambio que no arregla bug ni agrega feature)
- [ ] 🎨 UI/UX (cambios visuales o de experiencia de usuario)

## 🏗️ FLODEX Architecture Checklist

### Servicios Afectados
<!-- Marca todos los servicios que modifica este PR -->

- [ ] 🌐 Frontend (Next.js)
- [ ] 🔧 Backend (Express)
- [ ] ⚡ Rust Generator
- [ ] 📚 Documentación Global (root files)
- [ ] 🐳 Infraestructura (Docker/PM2)

### Validaciones FLODEX
<!-- IMPORTANTE: Todos estos checks deben pasar para mantener la arquitectura FLODEX -->

#### Si afecta UN SOLO servicio:
- [ ] Los cambios están contenidos en el directorio del servicio
- [ ] La documentación se actualizó en el README del servicio
- [ ] No hay imports desde otros servicios
- [ ] El servicio sigue siendo autónomo

#### Si afecta MÚLTIPLES servicios:
- [ ] Cada servicio se modificó independientemente
- [ ] La comunicación entre servicios es solo vía API REST
- [ ] No hay código compartido entre servicios
- [ ] Documenté la integración en `/docs/flodex/features/`

#### Documentación:
- [ ] El README del servicio está actualizado (si aplica)
- [ ] No creé documentación fuera del servicio (excepto casos especiales)
- [ ] Si modifiqué APIs, actualicé la sección "Contrato de API"
- [ ] Si agregué variables de entorno, las documenté

## 🧪 Testing

<!-- Describe las pruebas que realizaste -->

- [ ] Ejecuté los tests del servicio modificado
- [ ] Probé manualmente los cambios
- [ ] Verifiqué que otros servicios no se vean afectados
- [ ] Ejecuté `./scripts/validate-flodex.sh` y pasó sin errores

## 📸 Screenshots (si aplica)

<!-- Si tu PR incluye cambios visuales, agrega screenshots aquí -->

## ✅ Checklist Final

- [ ] Mi código sigue el estilo del proyecto
- [ ] He hecho self-review de mi código
- [ ] He comentado mi código en áreas difíciles de entender
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban que mi fix/feature funciona
- [ ] Tests nuevos y existentes pasan localmente
- [ ] He verificado que no hay conflictos con la rama principal

## 🔗 Issues Relacionados

<!-- Enlaza cualquier issue relacionado usando #numero -->

Fixes #(issue)

## 📝 Notas Adicionales

<!-- Cualquier contexto adicional o decisiones de diseño importantes -->

---

<details>
<summary>📊 Resultado de validate-flodex.sh</summary>

<!-- Pega aquí el output del script de validación -->
```
$ ./scripts/validate-flodex.sh
[Pegar resultado aquí]
```

</details>