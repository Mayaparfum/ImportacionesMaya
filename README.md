# Importaciones Maya - Arte y dibujo

Tienda estática lista para publicar en GitHub Pages.

## Funciones

- Catálogo adaptable a celular y computadora.
- Buscador y filtro por categoría.
- Galería de varias imágenes por producto.
- Carrito guardado en el navegador.
- Control de cantidades según la existencia indicada.
- Envío del pedido por WhatsApp al número 998 499 8030.
- Sin base de datos ni panel de administración.

## Cómo actualizar precios y existencias

Abre el archivo `products.js`.

Cada producto tiene estos campos:

```js
{
  "code": "ART001",
  "category": "Dibujo",
  "name": "Set de arte de 96 piezas",
  "price": 390,
  "stock": 2,
  "description": "Descripción del producto",
  "brand": "Arte",
  "images": [
    "assets/img/art01.webp",
    "assets/img/art01-1.webp"
  ]
}
```

Modifica `price` para cambiar el precio y `stock` para cambiar la existencia.

Ejemplo:

```js
"price": 420,
"stock": 5
```

## Cómo agregar un producto

1. Copia las fotos dentro de `assets/img`.
2. Agrega un nuevo objeto dentro de `products.js`.
3. Usa un código único.
4. Separa cada producto con una coma.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube todos los archivos y carpetas de este proyecto.
3. Entra a `Settings`.
4. Abre `Pages`.
5. En `Build and deployment`, selecciona `Deploy from a branch`.
6. Elige la rama `main` y la carpeta `/root`.
7. Guarda y espera a que GitHub publique la página.

## Nota sobre inventario

La página impide que una persona agregue al carrito más unidades que las indicadas en `stock`, pero la existencia no se descuenta automáticamente al enviar el mensaje. Después de una venta debes actualizar manualmente `products.js`.
