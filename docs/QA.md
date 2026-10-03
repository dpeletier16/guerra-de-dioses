# Evidencias de verificación

## Entorno

Linux, Node.js 24.19.0, npm 11.17.0, Phaser 4.2.1, Vite 7.3.6, TypeScript, Vitest 5.0.3 y Playwright 1.63.0 con Chromium. Revisión adicional mediante las herramientas de navegador del entorno.

## Comprobaciones ejecutadas

- `npm install`: instalación correcta; después de actualizar Vitest, auditoría de npm sin vulnerabilidades conocidas.
- `npm run build`: exportación de 89 SVG, comprobación estricta de TypeScript y generación de `dist/` correctas. Aviso informativo de Vite por el tamaño del motor completo.
- `npm test`: **24 pruebas, 2 archivos, todas correctas**.
- `npm run test:e2e`: **6 recorridos de Chromium, todos correctos**.
- `npm run test:balance`: victoria con los tres perfiles activos y derrota con el perfil inactivo.
- `npm run preview`: prueba adicional del compilado en `http://localhost:4173`; menú, mapa, preparación y primera compra correctos. Se verificó que `window.__game` no existe en producción y que las fotografías de referencia no están en `dist/`.

### Resultados del balance determinista

| Perfil | Resultado | Tiempo simulado | Reclutados | Monstruos vencidos | Tipos enemigos vistos |
|---|---|---:|---:|---:|---:|
| Ofensivo | Victoria | 144 s | 8 | 7 | 5 |
| Defensivo y contraataque | Victoria | 226 s | 9 | 13 | 5 |
| Repliegue y nuevo ataque | Victoria | 185 s | 10 | 10 | 5 |
| Sin proteger el castillo | Derrota | 133 s | 0 | 0 | 5 |

Estos tiempos corresponden a decisiones automáticas frecuentes, no a una prueba de comprensión o diversión con David. El perfil de repliegue verifica que hay unidades efectivamente refugiadas antes de volver a atacar.

## Cobertura de reglas

- Exactamente dos campesinos gratuitos, nombres elegidos, extracción y abono al entregar.
- Pausa sin progreso de tiempo, recursos, IA ni proyectiles.
- Compra de cada héroe con descuento exacto; compra inválida y ejército al límite sin gasto.
- Conversión atómica piedra/oro.
- Construcción de las tres clases exclusivamente en emplazamientos válidos, devolución exacta y rechazo de doble devolución.
- Destrucción de torres sin devolución y liberación del emplazamiento.
- Cambio de atacar a defender y refugiarse; exposición al romperse la puerta propia.
- Flechas con tiempo de vuelo, daño único, cancelación de golpe de un muerto, fuego en área y ralentización mágica.
- Aparición de los cinco monstruos desde la fortaleza roja.
- Puerta intacta impasable, destrucción insuficiente para ganar, cruce de combatiente vivo y resultado único.
- Reinicio limpio y derrota completa sin intervención.

## Recorridos de navegador

1. Menú → mapa → encuentro → nombres → batalla. Compra, escasez, construcción pulsando el terreno, desmontaje, conversión, pausa, refugio y nuevo ataque.
2. Partida defensiva completa: cinco héroes comprados desde sus botones, tres clases de torres, aparición de cinco monstruos, contraataque, victoria y reinicio.
3. Derrota deliberada, vuelta al mapa y persistencia del silencio al recargar.
4. Vista horizontal **844 × 390**: compra, cámara a ambos extremos, selección de emplazamiento y pausa/reanudación.
5. Estrés: **20 héroes y 24 monstruos**, combate y **cinco reinicios**. Sin errores JavaScript observados; número de objetos de escena y texturas igual después de cada reinicio. Proyectiles por debajo del umbral de comprobación de 200. Es una comprobación de recursos retenidos, no un perfil exhaustivo del heap ni una certificación de FPS en todo hardware.
6. Capturas de menú, mapa, batalla, resultado y hoja de los diez personajes.

El avance rápido del navegador utiliza el mismo `Battle.advance` con pasos fijos; los eventos audiovisuales intermedios se descartan para no reproducir minutos de sonido y partículas de golpe. Las capturas y la inspección adicional en vivo comprueban el renderizado. En las partidas completas no se conceden recursos artificiales. El escenario de estrés sí prepara una carga de entidades y oro elevados deliberadamente.

## Defectos detectados y corregidos

- Los atajos `A/D` interceptaban letras al escribir nombres. Se desactivó la captura de teclado para esas teclas y se verificaron **David** y **Atenea** completos.
- Los eventos globales de ratón de Phaser alcanzaban el terreno a través del panel HTML de torres. Se limitó la entrada al canvas y se exigió que la pulsación comenzara en el mismo emplazamiento.
- En pantallas bajas la cámara alejaba demasiado los personajes. Se estableció una escala mínima y un encuadre vertical centrado en la zona de juego.
- Las primeras victorias ocurrían antes de la aparición de Cronos. Se elevó la resistencia de las puertas a 3000, manteniendo las estadísticas individuales.
- La revisión de la hoja de personajes motivó separar más las tres cabezas de Cerbero y hacer más visibles los brazos del Centímano.
- La captura del mapa reveló un atributo SVG sin espacio separador que impedía cargar el fondo. Se corrigió y se añadió validación XML de los recursos gráficos y comprobación de carga de la imagen del mapa.
- Las pruebas de interfaz contemplan que los campesinos pueden entregar recursos entre dos lecturas del navegador. Las cantidades exactas se comprueban además en pruebas deterministas sin esa carrera temporal.

## Capturas

- [Inicio](screenshots/menu.png)
- [Mapa](screenshots/map.png)
- [Batalla y torres](screenshots/battle.png)
- [Victoria](screenshots/victory.png)
- [Derrota](screenshots/defeat.png)
- [Pantalla horizontal pequeña](screenshots/mobile-landscape.png)
- [Hoja de personajes](screenshots/roster.png)

Se han abierto y revisado visualmente las capturas, además de las cinco fotografías originales. La entrega utiliza vectores originales estilizados y animación programática sencilla; no pretende equivaler a una producción de animación profesional.

## No verificado

- Safari, Firefox, dispositivos táctiles físicos y pantallas completas en todos los navegadores.
- Calidad acústica mediante escucha en altavoces: se comprobó que Web Audio inicia su contexto, se activa tras interacción y permite silenciar/persistir la preferencia.
- Balance subjetivo, comprensión por un niño y duración de una primera partida humana: requieren que David juegue.
