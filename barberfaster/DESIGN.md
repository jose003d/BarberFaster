---
name: BarberFaster
description: Una ventana a las barberías de Sonsón; los colores de la barbería clásica, refrescados en naranja, cian y blanco, con geometría Bauhaus plana y esquinas rectas.
colors:
  bf-orange: "#ea5728"
  bf-orange-ink: "#b33d14"
  bf-orange-wash: "#fdeee8"
  bf-cyan: "#2bcfce"
  bf-cyan-mid: "#81e4e9"
  bf-cyan-ink: "#0b6f6e"
  bf-cyan-wash: "#dff7f6"
  bf-black: "#0e3b40"
  bf-on-action: "#000000"
  bf-text: "#1a1a1a"
  bf-muted: "#4d5656"
  bf-on-petrol-muted: "#b8d3d5"
  bf-paper: "#ffffff"
  bf-surface: "#f3f7f7"
  bf-line: "#d3dcdc"
  bf-success: "#1f7a3a"
  bf-danger: "#c0271b"
typography:
  display:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "min(12vw, 12svh, 8.5rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 6vw, 3.6rem)"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  lead:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "clamp(1.55rem, 6.4vw, 2.35rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "1.65rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Chillax, Satoshi, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
rounded:
  none: "0px"
  circle: "50%"
spacing:
  page-pad: "clamp(18px, 5vw, 56px)"
  page-max: "1200px"
  section: "clamp(64px, 9vw, 120px)"
  brand-offset: "4px"
components:
  button-default:
    backgroundColor: "{colors.bf-cyan}"
    textColor: "{colors.bf-on-action}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "52px"
  button-default-hover:
    backgroundColor: "{colors.bf-orange}"
    textColor: "{colors.bf-on-action}"
  button-primary:
    backgroundColor: "{colors.bf-orange}"
    textColor: "{colors.bf-on-action}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 28px"
    height: "56px"
  button-quiet:
    backgroundColor: "{colors.bf-paper}"
    textColor: "{colors.bf-on-action}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "52px"
  button-quiet-hover:
    backgroundColor: "{colors.bf-orange}"
  button-disabled:
    backgroundColor: "{colors.bf-surface}"
    textColor: "#767676"
    rounded: "{rounded.none}"
  input-search:
    backgroundColor: "{colors.bf-paper}"
    textColor: "{colors.bf-text}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "56px"
  hero-window:
    backgroundColor: "{colors.bf-paper}"
    rounded: "{rounded.none}"
  hero-window-band:
    backgroundColor: "{colors.bf-black}"
    textColor: "{colors.bf-paper}"
    typography: "{typography.display}"
  card-barberia:
    backgroundColor: "{colors.bf-paper}"
    textColor: "{colors.bf-text}"
    rounded: "{rounded.none}"
    padding: "20px"
  step-shape:
    textColor: "{colors.bf-on-action}"
    size: "84px"
  time-slot-selected:
    backgroundColor: "{colors.bf-orange}"
    textColor: "{colors.bf-on-action}"
    rounded: "{rounded.none}"
    height: "68px"
---

# Design System: BarberFaster

## Overview

**Creative North Star: "Una ventana a las barberías de Sonsón"**

BarberFaster no abandona la barbería clásica: la refresca. El rojo, el azul y el blanco del poste se vuelven naranja, cian y blanco, y el negro se vuelve petróleo ("no queremos tanto negro"). Encima de esa paleta va una disciplina Bauhaus: retícula clara, color plano, trazos de 2 a 3px, sombras sólidas desplazadas y esquinas rectas en todo. Las esquinas rectas son deliberadas: rompen el molde de bordes redondeados que comparten los demás proyectos de la clase.

La pieza que define el mundo es la ventana enmarcada: un marco blanco con trazo y sombra petróleo, apoyado sobre el degradado original de cian muy claro a cian, que muestra el oficio en video real y deja buscar y reservar desde el primer segundo. Debajo, una banda petróleo lleva el titular enorme "TU ESTILO. / TU LUGAR." La tríada cuadrado, círculo y triángulo aparece una sola vez, para numerar los tres pasos de la reserva; no se usa como adorno.

La densidad es generosa y legible, pensada para un público amplio que incluye personas mayores en teléfono: texto base de 17px, objetivos táctiles de 48px o más, frases cortas. El movimiento es corto y tranquilo; nada rebota.

**Key Characteristics:**
- Naranja para la acción, cian para refrescar, blanco donde se lee, petróleo para trazos, sombras, titulares y bandas.
- Esquinas rectas (0px) en todos los controles, tarjetas, campos y ventanas; el círculo solo existe en la tríada.
- Sombra de marca sólida y desplazada, sin difuminado.
- Satoshi en peso negro para titulares; Chillax para controles.
- La primera pantalla de la portada muestra todo sin desplazar, de 375×667 a 1440×900.

## Colors

Los colores de la barbería clásica, renovados: naranja cálido para actuar, cian fresco en degradado para los espacios de color, mucho blanco y un petróleo profundo en lugar del negro.

### Primary
- **Naranja Navaja** (bf-orange): el color de la acción. Botón principal, hover de todos los botones, hora elegida, día elegido del calendario, subrayado de navegación activa, segunda línea del titular de la banda, cursor de texto y selección.
- **Naranja Tinta** (bf-orange-ink): naranja oscurecido para íconos activos sobre blanco (navegación del panel).
- **Naranja Lavado** (bf-orange-wash): fondo del método de pago elegido.

### Secondary
- **Cian Poste** (bf-cyan): botones por defecto en reposo, círculo del paso 2, íconos de confianza sobre petróleo, sombra de foco del buscador y sombra de hover de las tarjetas de barbería. Siempre lleva texto negro encima.
- **Cian Medio** (bf-cyan-mid): parada intermedia del degradado de marca; no se usa sola.
- **Cian Lavado** (bf-cyan-wash): inicio del degradado y fondo suave de tarjetas de profesional fuera de la reserva pública.
- **Cian Tinta** (bf-cyan-ink): cian oscuro para texto o íconos cian sobre blanco cuando hace falta contraste.

### Neutral
- **Petróleo** (bf-black): el oscuro de la marca. Trazos de 2 y 3px, sombras desplazadas, titulares (h1 a h4), la banda del titular, la sección de confianza, el contorno de foco. El token conserva el nombre `--bf-black` y los alias `--bauhaus-ink` y `--tv-bars` apuntan a él.
- **Negro de Acción** (bf-on-action): texto sobre naranja y cian; negro real para que siempre se lea.
- **Tinta** (bf-text): texto de lectura.
- **Gris Pizarra** (bf-muted): texto secundario y descripciones.
- **Petróleo Claro** (bf-on-petrol-muted): texto secundario sobre la banda o sección petróleo.
- **Papel** (bf-paper): el fondo donde se lee; ventanas, tarjetas, campos, pie.
- **Superficie** (bf-surface): fondo de botones deshabilitados y zonas de apoyo.
- **Filete** (bf-line): divisores suaves, conectores del progreso, borde deshabilitado.
- **Éxito / Peligro** (bf-success, bf-danger): solo estados de mensaje.

### Named Rules
**The Degradado Original Rule.** Los espacios de color grandes (cabecera, portada, sección de dueños, fondo de login, solicitud y perfil del cliente, cabecera de la reserva) usan `--brand-gradient`: de cian lavado a cian, de izquierda a derecha. Nunca un campo de cian plano y saturado, nunca un fondo negro.

**The Petróleo No Negro Rule.** El oscuro de la marca es petróleo. Ningún fondo, trazo ni sombra nuevo usa negro puro; el negro real queda solo como texto sobre naranja y cian.

**The Naranja Actúa Rule.** El naranja marca lo que se puede hacer o lo que está elegido. No se usa como fondo de sección ni como decoración.

## Typography

**Display Font:** Satoshi (variable, 100 a 900; con system-ui, sans-serif)
**Body Font:** Satoshi
**Label/Mono Font:** Chillax (200 a 700; con Satoshi, sans-serif)

**Character:** Una grotesca firme en peso negro, apretada y enorme, para que los titulares se lean como un cartel; Chillax, más redondeada, da a los controles un tono amable sin perder rectitud.

### Hierarchy
- **Display** (900, min(12vw, 12svh, 8.5rem), 0.88): solo el titular de la banda petróleo de la portada, en mayúsculas, dos líneas ("TU ESTILO." en blanco, "TU LUGAR." en naranja). Escala con el ancho y el alto para caber en la primera pantalla.
- **Headline** (900, clamp(2.2rem, 6vw, 3.6rem), 0.98): títulos de sección de la portada; en petróleo sobre blanco, en blanco sobre petróleo. Login, solicitud y dueños usan la misma voz entre 2rem y 3.2rem.
- **Lead** (900, clamp(1.55rem, 6.4vw, 2.35rem)): la frase principal dentro de la ventana, máximo 18ch.
- **Title** (800, 1.3rem a 1.65rem, -0.02em a -0.03em): nombres de barbería, pasos, títulos de paso en la reserva (hasta 2.35rem).
- **Body** (400, 17px, 1.55): texto de lectura; descripciones entre 1rem y 1.0625rem, máximo 32ch en la ventana y 62ch en detalle.
- **Label** (Chillax 600, 1rem, 0.01em, tipo oración): botones, enlaces de navegación, etiqueta del video, campos de interfaz. Las horas usan Chillax 700 con cifras tabulares.

### Named Rules
**The Tipo Oración Rule.** Botones, etiquetas y enlaces van en tipo oración. Las mayúsculas sostenidas se reservan para el titular display de la banda.

**The Peso Negro Rule.** Los titulares van en 800 o 900 con tracking negativo; nunca en peso ligero ni con otra familia de display.

## Layout

Mobile-first. Cada página pública usa un relleno lateral `page-pad` (clamp(18px, 5vw, 56px)) y un ancho máximo de contenido de 1200px. Las secciones respiran con `section` (clamp(64px, 9vw, 120px)) arriba y abajo.

La portada ocupa exactamente la primera pantalla: cabecera de 72px (84px desde 900px) fundida con el degradado, y debajo la ventana, que crece hasta `100svh` menos la cabecera. En teléfono la ventana apila video arriba (mínimo 150px, 110px en pantallas de 720px o menos de alto), texto y buscador en una sola fila, y la banda. Desde 900px el video ocupa 7 de 12 columnas a la izquierda y el texto 5 a la derecha. La regla es que video, frase, buscador, "¿Cómo funciona?" y titular se vean sin desplazar entre 375×667 y 1440×900.

Los tres pasos y los tres hechos de confianza se apilan en teléfono y pasan a tres columnas desde 900px, separados por filetes petróleo en vez de cajas. El listado de barberías es una grilla con 32px de separación. La reserva pública (`agenda-page--fija`) mide hasta 960px y procura que todo el paso quepa en pantalla.

Puntos de quiebre observados: 380px (teléfonos angostos), 640px (tableta; el detalle pasa de hoja inferior a diálogo), 768px (reserva), 900px (escritorio de la portada), y alto ≤720px para teléfonos bajos.

## Elevation & Depth

No hay sombras difusas en el mundo público. La profundidad es plana y gráfica: un bloque de color sólido desplazado hacia abajo y a la derecha, sin desenfoque, como en un cartel impreso. Las superficies están planas en reposo; la sombra aparece en las ventanas (estructural) y en los controles como respuesta al gesto.

### Shadow Vocabulary
- **Sombra de marca** (`box-shadow: 4px 4px 0 #0e3b40`, token `--brand-shadow`): hover de botones (con el botón subiendo 4px), hora elegida, tarjeta de profesional elegida, método de pago elegido, foco del filtro de ciudad.
- **Sombra de ventana** (`box-shadow: 14px 14px 0 #0e3b40`; 10px en teléfono): la ventana de la portada, la de dueños, la tarjeta de login, solicitud y acceso del cliente.
- **Sombra de tarjeta** (`box-shadow: 8px 8px 0 #2bcfce`): hover de la tarjeta de barbería.
- **Sombra de foco del buscador** (`box-shadow: 5px 5px 0 #2bcfce`): campo de búsqueda de la portada con foco.
- **Sombra de diálogo** (`box-shadow: 12px 12px 0 #ea5728`): detalle de barbería como diálogo desde 640px.

### Named Rules
**The Bloque Sólido Rule.** Toda sombra es un bloque desplazado con 0 de desenfoque. Si una sombra tiene difuminado, no pertenece a este mundo.

**The Baja Sobre Su Sombra Rule.** Un botón al pasar sube sobre su sombra; al presionar, baja a su lugar en 60ms. En táctil, el botón principal descansa con la sombra puesta y al tocarlo baja 4px.

## Shapes

Esquinas rectas en todo: botones, campos, tarjetas, ventanas, diálogos, avatares, indicadores del progreso, horas (`--radius: 0px`). Los trazos son petróleo: 3px para estructura grande (ventana, banda, pasos, buscador, etiqueta del video) y 2px para controles y tarjetas.

La única geometría decorativa es la tríada Bauhaus, y solo numera los tres pasos de la reserva: cuadrado naranja con trazo (1), círculo cian con trazo (2), triángulo petróleo con número blanco (3), cada uno de 84px.

### Named Rules
**The Esquina Recta Rule.** Ningún componente lleva `border-radius` distinto de 0, salvo el círculo de la tríada.

**The Tríada Numera Rule.** Cuadrado, círculo y triángulo existen para contar 1, 2, 3. No se repiten como fondo, patrón ni adorno en otras secciones.

## Components

### Buttons
Rectos, con trazo y un gesto físico claro.
- **Shape:** esquinas rectas (0px), trazo petróleo de 2px, Chillax 600 en tipo oración, alto mínimo 52px (56px en la portada).
- **Default:** cian con texto negro.
- **Primary:** naranja desde el inicio (`.btn-primary`, `.is-primary`).
- **Quiet:** blanco con trazo para acciones secundarias (detalles, cerrar, atrás).
- **Hover / Focus:** pasa a naranja y sube 4px sobre la sombra de marca (fondo 160ms, sombra y desplazamiento 280ms, `--ease-out`). Foco con contorno petróleo de 3px separado 3px.
- **Active:** baja a su lugar en 60ms.
- **Disabled:** superficie gris clara, trazo de filete, texto #767676, sin sombra.
- **Link:** subrayado de 2px sin caja, mínimo 44px de alto; el subrayado se vuelve naranja al pasar.

### Cards / Containers
- **Corner Style:** recto (0px).
- **Background:** blanco.
- **Shadow Strategy:** plana en reposo; sombra de tarjeta cian al pasar.
- **Border:** petróleo de 2px.
- **Internal Padding:** 20px; foto arriba, sin foto se muestra una pequeña composición Bauhaus.

### Inputs / Fields
- **Style:** blanco, trazo petróleo de 3px en la portada (2px en filtros y formularios), esquinas rectas, alto 56px, texto Satoshi de 1.0625rem.
- **Focus:** sombra cian desplazada de 5px en el buscador; sombra de marca en el filtro de ciudad. Cursor naranja.

### Navigation
- **Pública:** cabecera de 72/84px fundida con el degradado, logo a la izquierda, enlaces Chillax 600 a la derecha con alto de 48px. Al pasar o con foco, una barra naranja de 4px crece desde la izquierda bajo el enlace.
- **Panel:** barra superior blanca con el mismo indicador naranja (a 40% al pasar, completo en la sección activa) e ícono activo en naranja tinta.

### Progreso de la reserva
Indicadores cuadrados de 44px con número en display: blanco con trazo gris en espera, naranja con trazo petróleo en el paso actual, cian en los completados; conector de filete que se llena de cian.

### Horas
Grilla de 4 columnas (2 en teléfono), botones blancos de 68px con trazo petróleo y cifras tabulares; la hora elegida va en naranja con la sombra de marca.

### La ventana (componente firma)
Marco blanco con trazo petróleo de 3px y sombra de ventana, sobre el degradado. Sin barra de título: el video y el texto quedan encuadrados directamente. Dentro, video real del oficio con una etiqueta blanca recta ("Barberías de Sonsón, Antioquia"), la frase principal, el texto, el buscador real con botón naranja y el enlace "¿Cómo funciona?". Cierra con la banda petróleo del titular display. Entrada: la ventana sube 18px, el video se abre como cortina (`clip-path`, 900ms), el titular sube; el contenido es visible desde el primer instante. La sección de dueños repite el marco como segunda ventana.

### Íconos
Hugeicons (`@hugeicons/core-free-icons`, MIT), SVG de trazo, 20 a 22px en línea y 40px en los hechos de confianza (en cian sobre petróleo, sin caja). FontAwesome sigue en la reserva y los paneles.

## Do's and Don'ts

### Do:
- **Do** usar naranja (#ea5728) para la acción y lo elegido, con texto negro encima.
- **Do** llenar los espacios de color grandes con `--brand-gradient` (cian lavado a cian).
- **Do** usar petróleo (#0e3b40) para trazos, sombras, titulares y bandas oscuras.
- **Do** mantener todas las esquinas en 0px y las sombras como bloques sólidos desplazados.
- **Do** reservar la tríada cuadrado, círculo y triángulo para numerar los 3 pasos de la reserva.
- **Do** mostrar video o fotos reales del oficio dentro de un marco con trazo y sombra petróleo.
- **Do** comprobar que la primera pantalla de la portada cabe sin desplazar entre 375×667 y 1440×900.
- **Do** mantener texto base de 17px, objetivos táctiles de 48px o más y botones en tipo oración.

### Don't:
- **Don't** usar mosaicos de baldosas ni patrones de azulejo.
- **Don't** usar rayas de poste de barbero, ni como franja ni como borde.
- **Don't** usar marquesinas de texto en movimiento.
- **Don't** usar stickers, sellos o etiquetas inclinadas.
- **Don't** usar texto retro con contorno (outlined text).
- **Don't** usar el mundo de TV o carta de ajuste (barras de color, pantallas de prueba).
- **Don't** usar salmón ni durazno; el cálido de la marca es el naranja.
- **Don't** usar campos negros ni fondos negros.
- **Don't** usar campos de cian plano y saturado; los espacios de color van en degradado.
- **Don't** usar la fuente Baumans ni otra display distinta de Satoshi.
- **Don't** usar micro-etiquetas en mayúsculas ni eyebrows sobre los títulos.
- **Don't** redondear esquinas para "suavizar" un componente.
