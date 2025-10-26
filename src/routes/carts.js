const express = require('express');
const router = express.Router();
const CartManager = require('../managers/CartManager');
const ProductManager = require('../managers/ProductManager');

const cartManager = new CartManager();
const productManager = new ProductManager();

// POST /api/carts - Crear nuevo carrito
router.post('/', (req, res) => {
    try {
        const newCart = cartManager.createCart();
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

// GET /api/carts/:cid - Obtener carrito por ID
router.get('/:cid', (req, res) => {
    try {
        const { cid } = req.params;
        const cart = cartManager.getCartById(cid);
        
        // Enriquecer el carrito con información detallada de los productos
        const enrichedCart = {
            id: cart.id,
            products: cart.products.map(cartProduct => {
                try {
                    const product = productManager.getProductById(cartProduct.product);
                    return {
                        product: {
                            id: product.id,
                            title: product.title,
                            description: product.description,
                            price: product.price,
                            thumbnail: product.thumbnails[0] || null,
                            code: product.code,
                            stock: product.stock,
                            category: product.category
                        },
                        quantity: cartProduct.quantity
                    };
                } catch (error) {
                    // Si el producto no existe, devolver solo la información básica
                    return {
                        product: {
                            id: cartProduct.product,
                            error: 'Producto no encontrado'
                        },
                        quantity: cartProduct.quantity
                    };
                }
            })
        };

        res.json({
            success: true,
            data: enrichedCart
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/carts/:cid/product/:pid - Agregar producto al carrito
router.post('/:cid/product/:pid', (req, res) => {
    try {
        const { cid, pid } = req.params;
        
        // Verificar que el producto existe
        productManager.getProductById(pid);
        
        // Agregar producto al carrito
        const updatedCart = cartManager.addProductToCart(cid, pid);
        
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

// PUT /api/carts/:cid/product/:pid - Actualizar cantidad de producto en el carrito
router.put('/:cid/product/:pid', (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;
        
        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                error: 'La cantidad debe ser un número positivo'
            });
        }
        
        const updatedCart = cartManager.updateProductQuantity(cid, pid, quantity);
        
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

// DELETE /api/carts/:cid/product/:pid - Eliminar producto del carrito
router.delete('/:cid/product/:pid', (req, res) => {
    try {
        const { cid, pid } = req.params;
        const updatedCart = cartManager.removeProductFromCart(cid, pid);
        
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

// DELETE /api/carts/:cid - Vaciar carrito
router.delete('/:cid', (req, res) => {
    try {
        const { cid } = req.params;
        const updatedCart = cartManager.clearCart(cid);
        
        res.json({
            success: true,
            message: 'Carrito vaciado exitosamente',
            data: updatedCart
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
