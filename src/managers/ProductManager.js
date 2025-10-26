const fs = require('fs');
const path = require('path');

class ProductManager {
    constructor() {
        this.products = [];
        this.path = path.join(__dirname, '../../data/products.json');
        this.init();
    }

    init() {
        // Crear el directorio data si no existe
        const dataDir = path.dirname(this.path);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Cargar productos existentes o crear archivo vacío
        if (fs.existsSync(this.path)) {
            this.loadProducts();
        } else {
            this.saveProducts();
        }
    }

    loadProducts() {
        try {
            const data = fs.readFileSync(this.path, 'utf8');
            this.products = JSON.parse(data);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            this.products = [];
        }
    }

    saveProducts() {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.products, null, 2));
        } catch (error) {
            console.error('Error al guardar productos:', error);
        }
    }

    generateId() {
        if (this.products.length === 0) return 1;
        const maxId = Math.max(...this.products.map(p => p.id));
        return maxId + 1;
    }

    addProduct(productData) {
        // Validar campos requeridos
        const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
        for (const field of requiredFields) {
            if (!productData[field]) {
                throw new Error(`El campo ${field} es requerido`);
            }
        }

        // Validar que el código no se repita
        const existingProduct = this.products.find(p => p.code === productData.code);
        if (existingProduct) {
            throw new Error('El código del producto ya existe');
        }

        // Crear nuevo producto
        const newProduct = {
            id: this.generateId(),
            title: productData.title,
            description: productData.description,
            code: productData.code,
            price: Number(productData.price),
            status: productData.status !== undefined ? Boolean(productData.status) : true,
            stock: Number(productData.stock),
            category: productData.category,
            thumbnails: productData.thumbnails || []
        };

        this.products.push(newProduct);
        this.saveProducts();
        return newProduct;
    }

    getProducts() {
        return this.products;
    }

    getProductById(id) {
        const product = this.products.find(p => p.id === parseInt(id));
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        return product;
    }

    updateProduct(id, updateData) {
        const productIndex = this.products.findIndex(p => p.id === parseInt(id));
        if (productIndex === -1) {
            throw new Error('Producto no encontrado');
        }

        // Validar código único si se está actualizando
        if (updateData.code) {
            const existingProduct = this.products.find(p => p.code === updateData.code && p.id !== parseInt(id));
            if (existingProduct) {
                throw new Error('El código del producto ya existe');
            }
        }

        // Actualizar producto manteniendo el ID original
        const updatedProduct = {
            ...this.products[productIndex],
            ...updateData,
            id: this.products[productIndex].id // Mantener el ID original
        };

        this.products[productIndex] = updatedProduct;
        this.saveProducts();
        return updatedProduct;
    }

    deleteProduct(id) {
        const productIndex = this.products.findIndex(p => p.id === parseInt(id));
        if (productIndex === -1) {
            throw new Error('Producto no encontrado');
        }

        const deletedProduct = this.products[productIndex];
        this.products.splice(productIndex, 1);
        this.saveProducts();
        return deletedProduct;
    }
}

module.exports = ProductManager;
