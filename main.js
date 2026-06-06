const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');

if (menuToggle && sidebar) {
	menuToggle.addEventListener('click', () => {
		menuToggle.classList.toggle('is-active');
		sidebar.classList.toggle('is-active');
	});
}

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const TODO_STORAGE_KEY = 'game-todo-list';
const RESOURCE_STORAGE_PREFIX = 'game-resources';
const NOTE_STORAGE_PREFIX = 'game-notes-';

const getNoteStorageKey = () => {
	const pageName = location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
	return `${NOTE_STORAGE_PREFIX}${pageName}`;
};

const loadTodos = () => {
	try {
		return JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) || '[]');
	} catch (error) {
		return [];
	}
};

const saveTodos = todos => {
	try {
		localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
	} catch (error) {
		console.warn('Unable to save todos to localStorage', error);
	}
};

const getResourceStorageKey = () => {
	const pageName = location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
	return `${RESOURCE_STORAGE_PREFIX}-${pageName}`;
};

const loadResources = () => {
	try {
		return JSON.parse(localStorage.getItem(getResourceStorageKey()) || '{}');
	} catch (error) {
		return {};
	}
};

const saveResources = resources => {
	try {
		localStorage.setItem(getResourceStorageKey(), JSON.stringify(resources));
	} catch (error) {
		console.warn('Unable to save resources to localStorage', error);
	}
};

const createFileCard = (file, zone) => {
	const fileCard = document.createElement('div');
	fileCard.className = 'draggable file-card';
	fileCard.draggable = true;
	fileCard.id = file.id || `file-card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	fileCard.innerHTML = `
		<span class="file-name">${file.name}</span>
		<button type="button" class="file-remove" aria-label="Remove file">×</button>
	`;

	zone.appendChild(fileCard);
	makeDraggable(fileCard);

	fileCard.querySelector('.file-remove').addEventListener('click', event => {
		event.stopPropagation();
		const zoneKey = zone.dataset.zone || 'default';
		const resources = loadResources();
		resources[zoneKey] = (resources[zoneKey] || []).filter(saved => saved.id !== fileCard.id);
		saveResources(resources);
		fileCard.remove();

		if (!zone.querySelector('.draggable')) {
			const placeholder = document.createElement('p');
			placeholder.className = 'drag-drop-note';
			placeholder.textContent = 'Drag files from your desktop into this area.';
			zone.appendChild(placeholder);
		}
	});
};

const renderResources = () => {
	const resources = loadResources();
	const zones = document.querySelectorAll('.drop-zone');

	zones.forEach(zone => {
		const zoneKey = zone.dataset.zone || 'default';
		const files = resources[zoneKey] || [];
		if (!files.length) return;

		const placeholder = zone.querySelector('.drag-drop-note');
		if (placeholder) placeholder.remove();

		files.forEach(file => createFileCard(file, zone));
	});
};

const renderTodos = todos => {
	todoList.innerHTML = '';

	todos.forEach((todo, index) => {
		const item = document.createElement('li');
		item.className = 'todo-item' + (todo.done ? ' done' : '');
		item.innerHTML = `
			<span class="todo-text">${todo.text}</span>
			<button type="button" class="todo-remove" aria-label="Remove item">×</button>
		`;

		item.querySelector('.todo-text').addEventListener('click', () => {
			todos[index].done = !todos[index].done;
			saveTodos(todos);
			renderTodos(todos);
		});

		item.querySelector('.todo-remove').addEventListener('click', () => {
			todos.splice(index, 1);
			saveTodos(todos);
			renderTodos(todos);
		});

		todoList.appendChild(item);
	});
};

const noteArea = document.getElementById('note-area');

if (noteArea) {
	noteArea.value = localStorage.getItem(getNoteStorageKey()) || '';
	noteArea.addEventListener('input', () => {
		localStorage.setItem(getNoteStorageKey(), noteArea.value);
	});
}

if (todoForm && todoInput && todoList) {
	let todos = loadTodos();

	const addTodo = text => {
		const value = text.trim();
		if (!value) return;
		todos.push({ text: value, done: false });
		saveTodos(todos);
		renderTodos(todos);
	};

	todoForm.addEventListener('submit', event => {
		event.preventDefault();
		addTodo(todoInput.value);
		todoInput.value = '';
		todoInput.focus();
	});

	renderTodos(todos);
}

const makeDraggable = item => {
	item.addEventListener('dragstart', event => {
		item.classList.add('dragging');
		event.dataTransfer.setData('text/plain', item.id);
		event.dataTransfer.effectAllowed = 'move';
	});

	item.addEventListener('dragend', () => {
		item.classList.remove('dragging');
	});
};

const setupDragAndDrop = () => {
	const dragItems = document.querySelectorAll('.draggable');
	const dropZones = document.querySelectorAll('.drop-zone');
	if (!dropZones.length) return;

	dragItems.forEach(makeDraggable);

	dropZones.forEach(zone => {
		zone.addEventListener('dragover', event => {
			event.preventDefault();
			zone.classList.add('over');
		});

		zone.addEventListener('dragleave', () => {
			zone.classList.remove('over');
		});

		zone.addEventListener('drop', event => {
			event.preventDefault();
			zone.classList.remove('over');

			const files = event.dataTransfer.files;
			const zoneKey = zone.dataset.zone || 'default';
			const resources = loadResources();
			resources[zoneKey] = resources[zoneKey] || [];

			if (files && files.length) {
				const placeholder = zone.querySelector('.drag-drop-note');
				if (placeholder) placeholder.remove();
				Array.from(files).forEach(file => {
					const fileItem = {
						id: `file-card-${Date.now()}-${Math.random().toString(16).slice(2)}`,
						name: file.name,
					};
					resources[zoneKey].push(fileItem);
					createFileCard(fileItem, zone);
				});
				saveResources(resources);
				return;
			}

			const id = event.dataTransfer.getData('text/plain');
			const dragged = document.getElementById(id);
			if (!dragged) return;
			const placeholder = zone.querySelector('.drag-drop-note');
			if (placeholder) {
				placeholder.remove();
			}
			zone.appendChild(dragged);
		});
	});
};

renderResources();
setupDragAndDrop();