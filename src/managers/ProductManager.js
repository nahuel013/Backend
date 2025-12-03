const mongoose = require('mongoose');
const Product = require('../models/Product');

class ProductManager {
    async addProduct(productData) {
        // Validar campos requeridos
        const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
        for (const field of requiredFields) {
            if (!productData[field]) {
                throw new Error(`El campo ${field} es requerido`);
            }
        }

        // Validar que el código no se repita
        const existingProduct = await Product.findOne({ code: productData.code });
        if (existingProduct) {
            throw new Error('El código del producto ya existe');
        }

        // Crear nuevo producto
        const newProduct = new Product({
            title: productData.title,
            description: productData.description,
            code: productData.code,
            price: Number(productData.price),
            status: productData.status !== undefined ? Boolean(productData.status) : true,
            stock: Number(productData.stock),
            category: productData.category,
            thumbnails: productData.thumbnails || []
        });

        await newProduct.save();
        return newProduct;
    }

    async getProducts() {
        return await Product.find({});
    }

    async getProductById(id) {
        // Verificar si es ObjectId válido
        let product;
        if (mongoose.Types.ObjectId.isValid(id)) {
            product = await Product.findById(id);
        } else {
            // Si no es ObjectId válido, intentar buscar por _id como string
            product = await Product.findById(id);
        }
        
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        return product;
    }

    async updateProduct(id, updateData) {
        // Validar código único si se está actualizando
        if (updateData.code) {
            const existingProduct = await Product.findOne({ 
                code: updateData.code, 
                _id: { $ne: id } 
            });
            
            if (existingProduct) {
                throw new Error('El código del producto ya existe');
            }
        }

        // Actualizar producto
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            throw new Error('Producto no encontrado');
        }

        return updatedProduct;
    }

    async deleteProduct(id) {
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            throw new Error('Producto no encontrado');
        }

        return deletedProduct;
    }

    // Método para compatibilidad con código existente (carga desde disco)
    async loadProducts() {
        // Ya no es necesario, los productos se cargan desde MongoDB
        return await this.getProducts();
    }
}

module.exports = ProductManager;
