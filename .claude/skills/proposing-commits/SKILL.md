---
name: proposing-commits
description: Señala cuándo se ha llegado a un punto natural de commit y propone
  el mensaje, pero nunca ejecuta el commit — eso lo hace siempre la persona.
  Úsala siempre que una señal objetiva se ponga en verde (tests, build o
  type-checker sin errores) y una tarea o subtarea quede cerrada, antes de
  pasar a la siguiente. Úsala también si el usuario pregunta si toca hacer
  commit o pide un mensaje de commit.
---

# Proposing commits

## Regla dura

Nunca ejecutes `git commit`, con o sin permiso aparente del usuario en el
mensaje. Está bloqueado además por permisos del runtime (`deny` en
`settings.json`) — esta skill es el criterio que complementa esa valla, no
un sustituto. Si el bloqueo de permisos llegara a fallar por cualquier
motivo, esta regla sigue aplicando igual: la decisión de commitear es
siempre de la persona.

## Cuándo avisar

Solo cuando se cumplen las dos cosas a la vez:

1. Señal objetiva en verde: compila, el type-checker calla, tests en verde
   (si aplican a la tarea), o el cambio corre y hace lo suyo en una prueba
   manual.
2. La tarea o subtarea que se estaba haciendo queda cerrada — no a mitad de
   algo, no "voy a seguir tocando esto en el siguiente paso".

No avisar en cada archivo guardado ni en cada función escrita — eso es ruido,
no una señal de commit.

## Qué hacer al avisar

1. Indica explícitamente que se ha llegado a un punto de commit. No lo des
   por sobreentendido ni lo menciones de pasada.
2. Propón un mensaje de commit siguiendo Conventional Commits
   (`tipo(ámbito): resumen en imperativo`, cuerpo opcional si el cambio lo
   justifica). Ajusta el tipo/ámbito al cambio real, no genérico.
3. Espera confirmación o edición del mensaje antes de asumir que se va a usar
   tal cual.

## Qué NO es trabajo de esta skill

- No generar un changelog ni un resumen largo del histórico.
- No agrupar varias tareas distintas en un único commit propuesto — si se
  cerraron dos cosas no relacionadas, propone dos mensajes separados.
- No decidir por tu cuenta si algo "merece" commit por debajo del umbral de
  señal en verde + tarea cerrada — ante la duda, pregunta en vez de asumir.
