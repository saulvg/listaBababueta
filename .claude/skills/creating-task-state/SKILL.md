---
name: creating-task-state
description:
  Crea y mantiene el fichero de estado efímero (la "partida guardada")
  de una tarea larga o compleja, con zona fija (objetivo, porqué) y zona volátil
  (dónde voy, qué hecho, qué falta, dónde atascado). Úsala siempre que el usuario
  declare que una tarea va a ser larga o compleja, pida explícitamente un "fichero
  de estado", o al retomar trabajo tras cerrar una sesión saturada. Úsala también
  al cerrar la tarea, para decidir si el fichero se archiva o se elimina.
---

# Creating task state

## Cuándo crearlo

- Al empezar una tarea que el usuario marca como larga o compleja, o que tú
  detectas como tal y confirmas con él antes de crear nada.
- No lo crees para tareas pequeñas o exploratorias — es sobreingeniería y
  arrastra peso que nadie va a necesitar.

## Estructura — dos zonas, nunca las mezcles

### Zona fija (se escribe una vez, no se vuelve a tocar)

- Objetivo de la tarea, en una o dos frases.
- El porqué: qué problema viene a resolver, qué pidió originalmente el usuario.

### Zona volátil (se sobreescribe sin piedad en cada actualización)

- Dónde voy ahora mismo.
- Qué está hecho.
- Qué falta.
- Dónde estoy atascado, si aplica.
- Última decisión clave tomada (solo la última, no un historial de todas).

## Regla dura

Es estado, no historia. No añadas una entrada nueva cada vez que algo cambia:
sobreescribe la zona volátil. Si sientes la tentación de conservar "por si
acaso" lo que ponía antes, no lo hagas — eso es lo que convierte el fichero
en un diario caro, justo lo que hay que evitar.

## Dónde vive y cómo se nombra

- `.claude/state/<nombre-de-la-tarea>.md`, dentro de una carpeta con su
  propio `.gitignore` en el repo del proyecto (no se versiona).
- Nombra el fichero por la tarea concreta, nunca algo genérico como
  `state.md` — para no confundirlo con el fichero padre del proyecto ni
  con el de otra tarea abierta a la vez.

## Al cerrar la tarea

- Pregunta si el fichero se elimina o se archiva en una subcarpeta.
- Si además se quiere un post-mortem de cómo se llegó al resultado, eso se
  resuelve con el historial de git o un resumen puntual al cerrar — no se
  hace engordando este fichero con historia.

## Qué NO es trabajo de esta skill

- No es el registro de calibración del usuario (eso vive en su documento de
  metodología, no aquí).
- No sustituye al fichero padre del proyecto (`CLAUDE.md`): ese es
  conocimiento estable y de vida larga; este es efímero y muere con la tarea.
