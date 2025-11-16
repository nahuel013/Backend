const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const exphbs = require('express-handlebars');
const ProductManager = require('./src/managers/ProductManager');

const app = express();
const PORT = 8080;
const server = http.createServer(app);
const io = new Server(server);
const productManager = new ProductManager();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'src', 'public')));

// Handlebars view engine
app.engine('handlebars', exphbs.engine());
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
app.get('/home', (req, res) => {
	// Recargar desde disco en cada request para reflejar cambios recientes
	if (typeof productManager.loadProducts === 'function') {
		productManager.loadProducts();
	}
	const products = productManager.getProducts();
	res.render('home', { title: 'Home', products });
});

app.get('/realtime', (req, res) => {
	res.render('realtime', { title: 'Realtime', message: 'Socket.IO conectado' });
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
