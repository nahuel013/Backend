const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const exphbs = require('express-handlebars');
const connectDB = require('./src/config/database');
const ProductManager = require('./src/managers/ProductManager');
const CartManager = require('./src/managers/CartManager');

const app = express();
const PORT = 8080;
const server = http.createServer(app);
const io = new Server(server);
const productManager = new ProductManager();
const cartManager = new CartManager();

// Conectar a MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'src', 'public')));

// Handlebars view engine con helpers
const hbs = exphbs.create({
	helpers: {
		eq: function(a, b) {
			return a === b;
		},
		multiply: function(a, b) {
			return a * b;
		},
		gt: function(a, b) {
			return a > b;
		}
	}
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'src', 'views'));

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
		},
		views: {
			'GET /home': 'Render de ejemplo con Handlebars',
			'GET /realtime': 'Página con conexión WebSocket'
		}
	});
});

// Rutas para vistas
app.get('/home', async (req, res) => {
	try {
		// Obtener todos los productos desde MongoDB
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
		
		// Obtener categorías únicas para el filtro
		const allProducts = await productManager.getProducts();
		const categories = [...new Set(allProducts.map(p => p.category))];
		
		res.render('home', { 
			title: 'Home', 
			products: paginatedProducts,
			pagination: {
				page,
				limit,
				totalPages,
				totalProducts,
				hasPrevPage: page > 1,
				hasNextPage: page < totalPages,
				prevPage: page > 1 ? page - 1 : null,
				nextPage: page < totalPages ? page + 1 : null
			},
			filters: {
				query: req.query.query || '',
				category: req.query.category || '',
				status: req.query.status || '',
				sort: req.query.sort || ''
			},
			categories
		});
	} catch (error) {
		console.error('Error en /home:', error);
		res.status(500).render('home', {
			title: 'Home',
			products: [],
			pagination: {
				page: 1,
				limit: 10,
				totalPages: 0,
				totalProducts: 0,
				hasPrevPage: false,
				hasNextPage: false,
				prevPage: null,
				nextPage: null
			},
			filters: {
				query: '',
				category: '',
				status: '',
				sort: ''
			},
			categories: []
		});
	}
});

app.get('/realtime', (req, res) => {
	res.render('realtime', { title: 'Realtime', message: 'Socket.IO conectado' });
});

// GET /products - Vista de productos con paginación
app.get('/products', async (req, res) => {
	try {
		// Obtener todos los productos desde MongoDB
		let products = await productManager.getProducts();
		
		// Convertir a objetos planos para el filtrado
		products = products.map(p => p.toObject());
		
		// Búsqueda por query
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
		
		// Obtener categorías únicas para el filtro
		const allProducts = await productManager.getProducts();
		const categories = [...new Set(allProducts.map(p => p.category))];
		
		res.render('products/index', {
			title: 'Productos',
			products: paginatedProducts,
			pagination: {
				page,
				limit,
				totalPages,
				totalProducts,
				hasPrevPage: page > 1,
				hasNextPage: page < totalPages,
				prevPage: page > 1 ? page - 1 : null,
				nextPage: page < totalPages ? page + 1 : null
			},
			filters: {
				query: req.query.query || '',
				category: req.query.category || '',
				status: req.query.status || '',
				sort: req.query.sort || ''
			},
			categories
		});
	} catch (error) {
		console.error('Error en /products:', error);
		res.status(500).render('products/index', {
			title: 'Productos',
			products: [],
			pagination: {
				page: 1,
				limit: 10,
				totalPages: 0,
				totalProducts: 0,
				hasPrevPage: false,
				hasNextPage: false,
				prevPage: null,
				nextPage: null
			},
			filters: {
				query: '',
				category: '',
				status: '',
				sort: ''
			},
			categories: []
		});
	}
});

// GET /products/:pid - Vista de detalle de producto
app.get('/products/:pid', async (req, res) => {
	try {
		const { pid } = req.params;
		const product = await productManager.getProductById(pid);
		
		res.render('products/detail', {
			title: product.title,
			product: product.toObject()
		});
	} catch (error) {
		console.error('Error en /products/:pid:', error);
		res.status(404).render('products/detail', {
			title: 'Producto no encontrado',
			product: null
		});
	}
});

// GET /carts/:cid - Vista de carrito
app.get('/carts/:cid', async (req, res) => {
	try {
		const { cid } = req.params;
		const cart = await cartManager.getCartById(cid);
		
		// Calcular total
		let total = 0;
		if (cart.products && cart.products.length > 0) {
			total = cart.products.reduce((sum, item) => {
				if (item.product && item.product.price) {
					return sum + (item.product.price * item.quantity);
				}
				return sum;
			}, 0);
		}
		
		res.render('carts/detail', {
			title: 'Carrito de Compras',
			cart: cart.toObject(),
			total: total.toFixed(2)
		});
	} catch (error) {
		console.error('Error en /carts/:cid:', error);
		res.status(404).render('carts/detail', {
			title: 'Carrito no encontrado',
			cart: null,
			total: '0.00'
		});
	}
});

// Socket.IO
io.on('connection', (socket) => {
	console.log('🟢 Cliente conectado:', socket.id);

	socket.emit('server:welcome', { message: 'Bienvenido al WebSocket!', socketId: socket.id });

	socket.on('client:ping', (payload) => {
		io.emit('server:pong', { at: Date.now(), data: payload });
	});

	socket.on('chat:message', ({ text }) => {
		const trimmed = typeof text === 'string' ? text.trim() : '';
		if (!trimmed) return;
		io.emit('chat:message', { at: Date.now(), text: trimmed });
	});

	socket.on('disconnect', (reason) => {
		console.log('🔴 Cliente desconectado:', socket.id, reason);
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
server.listen(PORT, () => {
	console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
	console.log(`📝 Documentación de API disponible en http://localhost:${PORT}`);
});

module.exports = app;
