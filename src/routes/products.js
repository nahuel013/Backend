const express = require('express');
const router = express.Router();
const ProductManager = require('../managers/ProductManager');

const productManager = new ProductManager();

// GET /api/products - Listar todos los productos
router.get('/', (req, res) => {
    try {
        const products = productManager.getProducts();
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/products/:pid - Obtener producto por ID
router.get('/:pid', (req, res) => {
    try {
        const { pid } = req.params;
        const product = productManager.getProductById(pid);
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
router.post('/', (req, res) => {
    try {
        const productData = req.body;
        const newProduct = productManager.addProduct(productData);
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
router.put('/:pid', (req, res) => {
    try {
        const { pid } = req.params;
        const updateData = req.body;
        const updatedProduct = productManager.updateProduct(pid, updateData);
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
router.delete('/:pid', (req, res) => {
    try {
        const { pid } = req.params;
        const deletedProduct = productManager.deleteProduct(pid);
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
