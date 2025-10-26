const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const productsRouter = require('./src/routes/products');
const cartsRouter = require('./src/routes/carts');

// Configurar rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de Productos y Carritos',
        endpoints: {
            products: {
                'GET /api/products': 'Listar todos los productos',
                'GET /api/products/:pid': 'Obtener producto por ID',
                'POST /api/products': 'Crear nuevo producto',
                'PUT /api/products/:pid': 'Actualizar producto',
                'DELETE /api/products/:pid': 'Eliminar producto'
            },
            carts: {
                'POST /api/carts': 'Crear nuevo carrito',
                'GET /api/carts/:cid': 'Obtener carrito por ID',
                'POST /api/carts/:cid/product/:pid': 'Agregar producto al carrito',
                'PUT /api/carts/:cid/product/:pid': 'Actualizar cantidad de producto',
                'DELETE /api/carts/:cid/product/:pid': 'Eliminar producto del carrito',
                'DELETE /api/carts/:cid': 'Vaciar carrito'
            }
        }
    });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Documentación de API disponible en http://localhost:${PORT}`);
});

module.exports = app;
