const express = require('express');
const router = express.Router();
const CartManager = require('../managers/CartManager');
const ProductManager = require('../managers/ProductManager');

const cartManager = new CartManager();
const productManager = new ProductManager();

// POST /api/carts - Crear nuevo carrito
router.post('/', async (req, res) => {
    try {
        const newCart = await cartManager.createCart();
        res.status(201).json({
            success: true,
            message: 'Carrito creado exitosamente',
            data: newCart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/carts/:cid - Obtener carrito por ID con populate
router.get('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await cartManager.getCartById(cid);
        
        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/carts/:cid - Actualizar todos los productos del carrito
router.put('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const { products } = req.body;
        
        if (!Array.isArray(products)) {
            return res.status(400).json({
                success: false,
                error: 'Se debe proporcionar un arreglo de productos'
            });
        }

        const updatedCart = await cartManager.updateCartProducts(cid, products);
        
        res.json({
            success: true,
            message: 'Carrito actualizado exitosamente',
            data: updatedCart
        });
    } catch (error) {
        const statusCode = error.message === 'Carrito no encontrado' ? 404 : 400;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/carts/:cid - Eliminar todos los productos del carrito
router.delete('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const updatedCart = await cartManager.clearCart(cid);
        
        res.json({
            success: true,
            message: 'Todos los productos del carrito fueron eliminados exitosamente',
            data: updatedCart
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/carts/:cid/product/:pid - Agregar producto al carrito
router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        
        // Verificar que el producto existe
        await productManager.getProductById(pid);
        
        // Agregar producto al carrito
        const updatedCart = await cartManager.addProductToCart(cid, pid);
        
        res.json({
            success: true,
            message: 'Producto agregado al carrito exitosamente',
            data: updatedCart
        });
    } catch (error) {
        const statusCode = error.message === 'Carrito no encontrado' || error.message === 'Producto no encontrado' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/carts/:cid/products/:pid - Actualizar SÓLO la cantidad del producto
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;
        
        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                error: 'La cantidad debe ser un número positivo'
            });
        }
        
        const updatedCart = await cartManager.updateProductQuantity(cid, pid, quantity);
        
        res.json({
            success: true,
            message: 'Cantidad actualizada exitosamente',
            data: updatedCart
        });
    } catch (error) {
        const statusCode = error.message === 'Carrito no encontrado' || error.message === 'Producto no encontrado en el carrito' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/carts/:cid/products/:pid - Eliminar producto del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const updatedCart = await cartManager.removeProductFromCart(cid, pid);
        
        res.json({
            success: true,
            message: 'Producto eliminado del carrito exitosamente',
            data: updatedCart
        });
    } catch (error) {
        const statusCode = error.message === 'Carrito no encontrado' || error.message === 'Producto no encontrado en el carrito' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
