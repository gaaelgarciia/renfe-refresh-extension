Esto es una prueba del branch 

# renfe-refresh-extension

Extension para navegadores basados en firefox que dado un id de un tren en un dia especifico refrescará la página de renfe cada 5 segundos para comprobar si el tren está disponible o no. En caso de que el tren esté disponible, hará click en el boton de seleccionar y luego de forma automática formalizará el viaje.

Ha sido creado sobre todo para las personas que necesitamos sacar un billete de tren con abono recurrente y no hay ningún tren disponible.

> [!WARNING]  
> Esta extensión  está en un estado muy experimental, cualquier posible mejora o implementación será agradecida

Debido a un problema del programa que no he conseguido solucionar aún para poder seleccionar el destino y el dia la extensión debe estar desabilidada **SOLO ACTIVARLO EN LA PAGINA DE FORMALIZACIÓN, UNA VEZ YA SELECCIONADO EL DESTINO Y EL DIA**

## Como usarla

1. Primero clona el respositorio con:

```
git clone https://github.com/gaaelgarciia/renfe-refresh-extension.git
```

2. Escribe en el buscador del navegador que uses:

```
about:debugging#/runtime/this-firefox
```

3. Luego haz click en "Load Temporary Add-on" y selecciona el archivo manifest.json

4. Dirígete a la pagina de renfe y desde el abono selecciona el dia y el destino **CON LA EXTENSIÓN DESABILITADA**

5. Una vez en la pagina de formalización, habilita la extensión, clicka en ella y escribe la hora de salida en el formato HH.MM
