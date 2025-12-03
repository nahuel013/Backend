const express = require('express');
const router = express.Router();
const ProductManager = require('../managers/ProductManager');

const productManager = new ProductManager();

// GET /api/products - Listar todos los productos con filtros, ordenamiento y paginación
router.get('/', async (req, res) => {
    try {
        let products = await productManager.getProducts();
        
        // Convertir a objetos planos para el filtrado
        products = products.map(p => p.toObject());
        
        // Búsqueda por query - si se proporciona, filtra por título, descripción y categoría
        // Si no se recibe query, se realiza búsqueda general (muestra todos los productos)
        if (req.query.query) {
            const searchTerm = req.query.query.toLowerCase();
            products = products.filter(p => 
                p.title.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filtrado por categoría
        if (req.query.category) {
            products = products.filter(p => 
                p.category.toLowerCase() === req.query.category.toLowerCase()
            );
        }
        
        // Filtrado por disponibilidad (status)
        if (req.query.status !== undefined) {
            const statusFilter = req.query.status === 'true' || req.query.status === '1';
            products = products.filter(p => p.status === statusFilter);
        }
        
        // Ordenamiento por precio
        // Si se recibe sort=asc → orden ascendente por precio
        // Si se recibe sort=desc → orden descendente por precio
        // Si no se recibe sort → no realizar ningún ordenamiento
        if (req.query.sort) {
            const sortOrder = req.query.sort.toLowerCase();
            if (sortOrder === 'asc' || sortOrder === 'desc') {
                products.sort((a, b) => {
                    if (sortOrder === 'asc') {
                        return a.price - b.price;
                    } else {
                        return b.price - a.price;
                    }
                });
            }
        }
        
        // Paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        
        const totalProducts = products.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const paginatedProducts = products.slice(startIndex, endIndex);
        
        // Construir query string para los links de paginación
        const buildQueryString = (pageNum) => {
            const params = [];
            if (pageNum) params.push(`page=${pageNum}`);
            if (req.query.limit) params.push(`limit=${req.query.limit}`);
            if (req.query.query) params.push(`query=${encodeURIComponent(req.query.query)}`);
            if (req.query.category) params.push(`category=${encodeURIComponent(req.query.category)}`);
            if (req.query.status !== undefined) params.push(`status=${req.query.status}`);
            if (req.query.sort) params.push(`sort=${req.query.sort}`);
            return params.length > 0 ? '?' + params.join('&') : '';
        };
        
        // Respuesta con información de paginación
        const hasPrevPage = page > 1;
        const hasNextPage = page < totalPages;
        
        res.json({
            status: 'success',
            payload: paginatedProducts,
            totalPages,
            prevPage: hasPrevPage ? page - 1 : null,
            nextPage: hasNextPage ? page + 1 : null,
            page,
            hasPrevPage,
            hasNextPage,
            prevLink: hasPrevPage ? `/api/products${buildQueryString(page - 1)}` : null,
            nextLink: hasNextPage ? `/api/products${buildQueryString(page + 1)}` : null
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            payload: [],
            totalPages: 0,
            prevPage: null,
            nextPage: null,
            page: 1,
            hasPrevPage: false,
            hasNextPage: false,
            prevLink: null,
            nextLink: null,
            error: error.message
        });
    }
});

// GET /api/products/:pid - Obtener producto por ID
router.get('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await productManager.getProductById(pid);
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/products - Agregar nuevo producto
router.post('/', async (req, res) => {
    try {
        const productData = req.body;
        const newProduct = await productManager.addProduct(productData);
        res.status(201).json({
            success: true,
            message: 'Producto agregado exitosamente',
            data: newProduct
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/products/:pid - Actualizar producto
router.put('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const updateData = req.body;
        const updatedProduct = await productManager.updateProduct(pid, updateData);
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: updatedProduct
        });
    } catch (error) {
        const statusCode = error.message === 'Producto no encontrado' ? 404 : 400;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/products/:pid - Eliminar producto
router.delete('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const deletedProduct = await productManager.deleteProduct(pid);
        res.json({
            success: true,
            message: 'Producto eliminado exitosamente',
            data: deletedProduct
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
