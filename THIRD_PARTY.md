# Procedencia y licencias

## Bibliotecas

Las versiones exactas y las dependencias transitivas están fijadas en `package-lock.json`.

| Biblioteca | Uso | Licencia / origen |
|---|---|---|
| Phaser 4.2.1 | Motor de representación y entrada | MIT · https://github.com/phaserjs/phaser/blob/master/LICENSE.md |
| eventemitter3 | Dependencia de Phaser | MIT · https://github.com/primus/eventemitter3 |
| TypeScript | Comprobación de tipos | Apache-2.0 · https://github.com/microsoft/TypeScript |
| Vite | Servidor local y compilación | MIT · https://github.com/vitejs/vite |
| Vitest | Pruebas de reglas | MIT · https://github.com/vitest-dev/vitest |
| Playwright | Automatización de Chromium | Apache-2.0 · https://github.com/microsoft/playwright |
| tsx | Ejecución de generadores y simulaciones | MIT · https://github.com/privatenumber/tsx |
| Prettier | Formato del código fuente | MIT · https://github.com/prettier/prettier |

Los textos de licencia distribuidos por cada paquete se encuentran en `node_modules/<paquete>/`. El compilado conserva los comentarios legales del motor. Las herramientas de desarrollo no son servicios requeridos por el juego publicado.

## Recursos del juego

- **Idea y dirección creativa:** David, según las especificaciones facilitadas localmente (no incluidas en Git).
- **Código, geometría SVG, animaciones y síntesis sonora:** creados para este proyecto durante su implementación. Las fuentes están incluidas y se pueden editar sin servicios externos.
- **Fotografías de libros:** suministradas localmente por el usuario y utilizadas únicamente para inspección de atributos visuales. Excluidas del repositorio y de la distribución. Sus derechos corresponden a sus titulares.
- **Fuentes:** familias del sistema (Georgia, Trebuchet MS y alternativas del navegador); no se distribuyen ficheros de fuentes.
- **War of Sticks:** referencia de estructura jugable indicada en el encargo. No se reutilizan sus archivos, ilustraciones, interfaz exacta, niveles ni código.

No se ha elegido una licencia global para publicar el proyecto de David. Las licencias de las dependencias no asignan una licencia al contenido original del juego.

## Documentación de Phaser 4 consultada

- https://github.com/phaserjs/phaser/tree/master/skills
- https://github.com/phaserjs/phaser/blob/master/skills/game-setup-and-config/SKILL.md
- https://github.com/phaserjs/phaser/blob/master/skills/scenes/SKILL.md
- https://github.com/phaserjs/phaser/blob/master/skills/v3-to-v4-migration/SKILL.md

Se utiliza la API de Phaser 4. No se emplean pipelines de Phaser 3, `preFX`/`postFX`, `setTintFill` ni clases eliminadas.
