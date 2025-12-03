const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartManager {
    async createCart() {
        const newCart = new Cart({
            products: []
        });

        await newCart.save();
        return newCart;
    }

    async getCartById(id) {
        let cart;
        if (mongoose.Types.ObjectId.isValid(id)) {
            cart = await Cart.findById(id).populate('products.product');
        } else {
            cart = await Cart.findOne({ id: parseInt(id) }).populate('products.product');
        }

        if (!cart) {
            throw new Error('Carrito no encontrado');
        }
        return cart;
    }

    async addProductToCart(cartId, productId) {
        const cart = await this.getCartById(cartId);
        
        // Verificar si el producto ya existe en el carrito
        const existingProductIndex = cart.products.findIndex(
            p => p.product.toString() === productId.toString()
        );

        if (existingProductIndex !== -1) {
            // Si el producto ya existe, incrementar la cantidad
            cart.products[existingProductIndex].quantity += 1;
        } else {
            // Si el producto no existe, agregarlo con cantidad 1
            cart.products.push({
                product: productId,
                quantity: 1
            });
        }

        await cart.save();
        return await Cart.findById(cart._id).populate('products.product');
    }

    async removeProductFromCart(cartId, productId) {
        const cart = await this.getCartById(cartId);

        const productIndex = cart.products.findIndex(
            p => p.product.toString() === productId.toString()
        );

        if (productIndex === -1) {
            throw new Error('Producto no encontrado en el carrito');
        }

        cart.products.splice(productIndex, 1);
        await cart.save();
        return await Cart.findById(cart._id).populate('products.product');
    }

    async updateProductQuantity(cartId, productId, quantity) {
        const cart = await this.getCartById(cartId);
        const newQuantity = parseInt(quantity);

        const existingProduct = cart.products.find(
            p => p.product.toString() === productId.toString()
        );

        if (!existingProduct) {
            throw new Error('Producto no encontrado en el carrito');
        }

        existingProduct.quantity = newQuantity;
        await cart.save();
        return await Cart.findById(cart._id).populate('products.product');
    }

    async clearCart(cartId) {
        const cart = await this.getCartById(cartId);
        cart.products = [];
        await cart.save();
        return await Cart.findById(cart._id).populate('products.product');
    }

    async updateCartProducts(cartId, products) {
        const cart = await this.getCartById(cartId);
        
        // Validar que todos los productos existen
        for (const item of products) {
            if (!item.product || !item.quantity || item.quantity < 1) {
                throw new Error('Cada producto debe tener product y quantity válidos');
            }
            // Verificar que el producto existe
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error(`Producto con ID ${item.product} no encontrado`);
            }
        }

        // Actualizar todos los productos del carrito
        cart.products = products;
        await cart.save();
        return await Cart.findById(cart._id).populate('products.product');
    }
}

module.exports = CartManager;
