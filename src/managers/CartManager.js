const fs = require('fs');
const path = require('path');

class CartManager {
    constructor() {
        this.carts = [];
        this.path = path.join(__dirname, '../../data/carts.json');
        this.init();
    }

    init() {
        // Crear el directorio data si no existe
        const dataDir = path.dirname(this.path);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Cargar carritos existentes o crear archivo vacío
        if (fs.existsSync(this.path)) {
            this.loadCarts();
        } else {
            this.saveCarts();
        }
    }

    loadCarts() {
        try {
            const data = fs.readFileSync(this.path, 'utf8');
            this.carts = JSON.parse(data);
        } catch (error) {
            console.error('Error al cargar carritos:', error);
            this.carts = [];
        }
    }

    saveCarts() {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.carts, null, 2));
        } catch (error) {
            console.error('Error al guardar carritos:', error);
        }
    }

    generateId() {
        if (this.carts.length === 0) return 1;
        const maxId = Math.max(...this.carts.map(c => c.id));
        return maxId + 1;
    }

    createCart() {
        const newCart = {
            id: this.generateId(),
            products: []
        };

        this.carts.push(newCart);
        this.saveCarts();
        return newCart;
    }

    getCartById(id) {
        const cart = this.carts.find(c => c.id === parseInt(id));
        if (!cart) {
            throw new Error('Carrito no encontrado');
        }
        return cart;
    }

    addProductToCart(cartId, productId) {
        const cart = this.getCartById(cartId);
        const productIdNum = parseInt(productId);

        // Buscar si el producto ya existe en el carrito
        const existingProduct = cart.products.find(p => p.product === productIdNum);

        if (existingProduct) {
            // Si el producto ya existe, incrementar la cantidad
            existingProduct.quantity += 1;
        } else {
            // Si el producto no existe, agregarlo con cantidad 1
            cart.products.push({
                product: productIdNum,
                quantity: 1
            });
        }

        this.saveCarts();
        return cart;
    }

    removeProductFromCart(cartId, productId) {
        const cart = this.getCartById(cartId);
        const productIdNum = parseInt(productId);

        const productIndex = cart.products.findIndex(p => p.product === productIdNum);
        if (productIndex === -1) {
            throw new Error('Producto no encontrado en el carrito');
        }

        cart.products.splice(productIndex, 1);
        this.saveCarts();
        return cart;
    }

    updateProductQuantity(cartId, productId, quantity) {
        const cart = this.getCartById(cartId);
        const productIdNum = parseInt(productId);
        const newQuantity = parseInt(quantity);

        const existingProduct = cart.products.find(p => p.product === productIdNum);
        if (!existingProduct) {
            throw new Error('Producto no encontrado en el carrito');
        }

        existingProduct.quantity = newQuantity;
        this.saveCarts();
        return cart;
    }

    clearCart(cartId) {
        const cart = this.getCartById(cartId);
        cart.products = [];
        this.saveCarts();
        return cart;
    }
}

module.exports = CartManager;
