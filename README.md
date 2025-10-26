# API de Productos y Carritos

API REST desarrollada con Node.js y Express para gestionar productos y carritos de compra.

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor:
```bash
npm start
```

Para desarrollo con nodemon:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:8080`

## Endpoints

### Productos (`/api/products`)

#### GET `/api/products`
Lista todos los productos
```bash
curl http://localhost:8080/api/products
```

#### GET `/api/products/:pid`
Obtiene un producto por ID
```bash
curl http://localhost:8080/api/products/1
```

#### POST `/api/products`
Crea un nuevo producto
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Producto de ejemplo",
    "description": "Descripción del producto",
    "code": "PROD001",
    "price": 99.99,
    "status": true,
    "stock": 10,
    "category": "Categoría",
    "thumbnails": ["imagen1.jpg", "imagen2.jpg"]
  }'
```

#### PUT `/api/products/:pid`
Actualiza un producto existente
```bash
curl -X PUT http://localhost:8080/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Producto actualizado",
    "price": 149.99
  }'
```

#### DELETE `/api/products/:pid`
Elimina un producto
```bash
curl -X DELETE http://localhost:8080/api/products/1
```

### Carritos (`/api/carts`)

#### POST `/api/carts`
Crea un nuevo carrito
```bash
curl -X POST http://localhost:8080/api/carts
```

#### GET `/api/carts/:cid`
Obtiene un carrito por ID con información detallada de productos
```bash
curl http://localhost:8080/api/carts/1
```

#### POST `/api/carts/:cid/product/:pid`
Agrega un producto al carrito (o incrementa la cantidad si ya existe)
```bash
curl -X POST http://localhost:8080/api/carts/1/product/1
```

#### PUT `/api/carts/:cid/product/:pid`
Actualiza la cantidad de un producto en el carrito
```bash
curl -X PUT http://localhost:8080/api/carts/1/product/1 \
  -H "Content-Type: application/json" \
  -d '{"quantity": 3}'
```

#### DELETE `/api/carts/:cid/product/:pid`
Elimina un producto del carrito
```bash
curl -X DELETE http://localhost:8080/api/carts/1/product/1
```

#### DELETE `/api/carts/:cid`
Vacía completamente el carrito
```bash
curl -X DELETE http://localhost:8080/api/carts/1
```

## Estructura del Proyecto

```
├── data/
│   ├── products.json    # Archivo de persistencia de productos
│   └── carts.json       # Archivo de persistencia de carritos
├── src/
│   ├── managers/
│   │   ├── ProductManager.js  # Gestión de productos
│   │   └── CartManager.js     # Gestión de carritos
│   └── routes/
│       ├── products.js        # Rutas de productos
│       └── carts.js          # Rutas de carritos
├── server.js            # Servidor principal
└── package.json
```

## Características

- ✅ Gestión completa de productos (CRUD)
- ✅ Gestión completa de carritos (CRUD)
- ✅ Persistencia en archivos JSON
- ✅ Validación de datos
- ✅ IDs autogenerados únicos
- ✅ Manejo de errores
- ✅ Respuestas JSON estructuradas
- ✅ CORS habilitado
- ✅ Documentación de API en la ruta raíz

## Ejemplo de Uso

1. Crear algunos productos
2. Crear un carrito
3. Agregar productos al carrito
4. Consultar el carrito con información detallada de productos
