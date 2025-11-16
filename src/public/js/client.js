(() => {
	const logEl = document.getElementById('log');
	const messagesEl = document.getElementById('messages');
	const msgForm = document.getElementById('msgForm');
	const msgInput = document.getElementById('msgInput');
	const btnPing = document.getElementById('btnPing');

	const log = (data) => {
		if (!logEl) return;
		const line = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
		logEl.textContent += `${line}\n`;
		logEl.scrollTop = logEl.scrollHeight;
	};

	const socket = io();

	socket.on('connect', () => log({ type: 'connect', id: socket.id }));
	socket.on('disconnect', (reason) => log({ type: 'disconnect', reason }));
	socket.on('server:welcome', (payload) => log({ type: 'welcome', payload }));
	socket.on('server:pong', (payload) => log({ type: 'pong', payload }));
	socket.on('chat:message', (payload) => {
		if (!messagesEl) return;
		const li = document.createElement('li');
		li.textContent = `${new Date(payload.at).toLocaleTimeString()}: ${payload.text}`;
		messagesEl.appendChild(li);
	});

	if (btnPing) {
		btnPing.addEventListener('click', () => {
			socket.emit('client:ping', { at: Date.now(), note: 'ping desde cliente' });
		});
	}

	if (msgForm && msgInput) {
		msgForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const text = msgInput.value.trim();
			if (!text) return;
			socket.emit('chat:message', { text });
			msgInput.value = '';
			msgInput.focus();
		});
	}
})();


