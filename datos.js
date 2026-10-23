'use strict';

/* =========================================================
   DATOS DE LA TIENDA · Edita este archivo
   Aquí cambias el nombre, el WhatsApp, los textos, las marcas,
   las categorías, los productos, los precios, los colores y las tallas.
   ========================================================= */

/* ---------- 1. CONFIGURACIÓN ---------- */
const CONFIG = {
  tienda: 'Tu Tienda',
  // Número de WhatsApp con código de país, sin "+" ni espacios. Ej. Colombia: 573001234567
  // (este es un número de ejemplo: cámbialo por el tuyo)
  whatsapp: '573000000000',
  carpetaImagenes: 'images/',
  extensionImagen: 'jpg',
  // Si una foto no existe en .jpg, el sitio prueba automáticamente con estas extensiones
  extensionesAlternas: ['jpeg', 'png', 'webp'],
  eslogan: 'Ropa para todos los días',
};

/* Textos principales del inicio y del pie de página. En heroTexto, {marcas} se reemplaza por la lista de marcas. */
const TEXTOS = {
  heroKicker: 'NUEVA COLECCIÓN',
  heroTitulo: 'Ropa con estilo para cada día',
  heroTexto: '{marcas}. Elige tu producto y pídelo por WhatsApp.',
  masVendidos: 'Lo más comprado',
  masVendidosSub: 'Los productos que más piden nuestros clientes',
  pie: 'Pedidos por WhatsApp · Lunes a sábado',
};

/* ---------- 2. DATOS ---------- */
const MARCAS = [
  { id: 'brisa', nombre: 'Brisa' },
  { id: 'vertex', nombre: 'Vertex' },
  { id: 'nova', nombre: 'Nova' },
  { id: 'kiro', nombre: 'Kiro' },
];

/* Categorías de tu tienda. El orden importa: cada marca del CATALOGO tiene una lista por categoría, en este mismo orden. */
const TIPOS = [
  { id: 'camisetas', nombre: 'Camisetas' },
  { id: 'pantalones', nombre: 'Pantalones' },
  { id: 'buzos', nombre: 'Buzos' },
  { id: 'chaquetas', nombre: 'Chaquetas' },
];

const COLORES = [
  { id: 'blanco', nombre: 'Blanco', hex: '#ffffff' },
  { id: 'negro', nombre: 'Negro', hex: '#111111' },
  { id: 'rojo', nombre: 'Rojo', hex: '#d7263d' },
  { id: 'azul', nombre: 'Azul', hex: '#2f5bea' },
];

/* Tallas para todos los productos. Pueden ser letras o números, siempre entre comillas. */
const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/* Opcional: tallas distintas para una categoría (usa el id de la categoría). Borra esta parte si no la necesitas. */
const TALLAS_POR_TIPO = {
  pantalones: ['28', '30', '32', '34', '36', '38'],
};

/* Descripción que se muestra en la página de cada producto, según su categoría. */
const DESCRIPCIONES = {
  camisetas: 'Camiseta cómoda y fresca para el día a día, en tela suave que mantiene su forma. Elige tu color y talla y haz tu pedido por WhatsApp.',
  pantalones: 'Pantalón de corte cómodo y tela resistente, ideal para usar todos los días. Elige tu color y talla y haz tu pedido por WhatsApp.',
  buzos: 'Buzo abrigado y suave, perfecto para los días frescos. Elige tu color y talla y haz tu pedido por WhatsApp.',
  chaquetas: 'Chaqueta ligera y práctica para cualquier clima. Elige tu color y talla y haz tu pedido por WhatsApp.',
};

/* Precios en miles de pesos: 49 equivale a $49.900. Una lista por categoría, en el orden de TIPOS. */
const CATALOGO = {
  'brisa': [
    [['Camiseta Básica', 49], ['Camiseta Oversize', 69], ['Polo Clásico', 59], ['Camiseta Estampada', 55]],   // camisetas
    [['Jean Recto', 119], ['Jogger', 109], ['Pantalón Cargo', 129], ['Jean Slim', 99]],   // pantalones
    [['Hoodie Clásico', 99], ['Buzo Cuello Redondo', 89], ['Buzo con Cremallera', 109], ['Hoodie Oversize', 139]],   // buzos
    [['Cortavientos', 159], ['Chaqueta Bomber', 179], ['Chaqueta de Jean', 149], ['Impermeable', 199]],   // chaquetas
  ],
  'vertex': [
    [['Camiseta Básica', 59], ['Camiseta Oversize', 79], ['Polo Clásico', 69], ['Camiseta Estampada', 65]],   // camisetas
    [['Jean Recto', 129], ['Jogger', 119], ['Pantalón Cargo', 139], ['Jean Slim', 109]],   // pantalones
    [['Hoodie Clásico', 109], ['Buzo Cuello Redondo', 99], ['Buzo con Cremallera', 119], ['Hoodie Oversize', 149]],   // buzos
    [['Cortavientos', 169], ['Chaqueta Bomber', 189], ['Chaqueta de Jean', 159], ['Impermeable', 209]],   // chaquetas
  ],
  'nova': [
    [['Camiseta Básica', 69], ['Camiseta Oversize', 89], ['Polo Clásico', 79], ['Camiseta Estampada', 75]],   // camisetas
    [['Jean Recto', 139], ['Jogger', 129], ['Pantalón Cargo', 149], ['Jean Slim', 119]],   // pantalones
    [['Hoodie Clásico', 119], ['Buzo Cuello Redondo', 109], ['Buzo con Cremallera', 129], ['Hoodie Oversize', 159]],   // buzos
    [['Cortavientos', 179], ['Chaqueta Bomber', 199], ['Chaqueta de Jean', 169], ['Impermeable', 219]],   // chaquetas
  ],
  'kiro': [
    [['Camiseta Básica', 39], ['Camiseta Oversize', 59], ['Polo Clásico', 49], ['Camiseta Estampada', 45]],   // camisetas
    [['Jean Recto', 109], ['Jogger', 99], ['Pantalón Cargo', 119], ['Jean Slim', 89]],   // pantalones
    [['Hoodie Clásico', 89], ['Buzo Cuello Redondo', 79], ['Buzo con Cremallera', 99], ['Hoodie Oversize', 129]],   // buzos
    [['Cortavientos', 149], ['Chaqueta Bomber', 169], ['Chaqueta de Jean', 139], ['Impermeable', 189]],   // chaquetas
  ],
};

/* Los 8 de "Lo más comprado" (los 3 primeros llevan etiqueta "Más vendido"). Escribe "Marca Producto". */
const MAS_VENDIDOS_NOMBRES = [
  'Brisa Camiseta Básica', 'Vertex Jean Recto', 'Nova Hoodie Clásico', 'Kiro Chaqueta Bomber',
  'Brisa Jogger', 'Vertex Camiseta Oversize', 'Nova Polo Clásico', 'Kiro Hoodie Oversize',
];
