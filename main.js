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
