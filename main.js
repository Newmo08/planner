const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');

if (menuToggle && sidebar) {
	menuToggle.addEventListener('click', () => {
		menuToggle.classList.toggle('is-active');
		sidebar.classList.toggle('is-active');
	});
}

// Daily health reminders
(() => {
	const weeklyReminders = [
		'Have you had enough water today?',
		'Have you gone outside and enjoyed some fresh air?',
		'Just have a great day!',
		'Take a break and stretch your body.',
		'Go for a walk and give your mind a reset.',
		'Practice gratitude and notice something good.',
		'Eat something nutritious and keep your energy up.',
	];

	const reminderEl = document.querySelector('.reminder-random h2, .reminder-random h3');
	if (reminderEl) {
		const dayOfWeek = new Date().getDay();
		reminderEl.textContent = weeklyReminders[dayOfWeek];
	}
})();

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
	const isFavorite = !!file.favorite;
	fileCard.className = `draggable file-card${isFavorite ? ' favorite' : ''}`;
	fileCard.draggable = true;
	fileCard.id = file.id || `file-card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	fileCard.innerHTML = `
		<button type="button" class="file-favorite" aria-pressed="${isFavorite}" title="Toggle favorite">
			${isFavorite ? '★' : '☆'}
		</button>
		<span class="file-name">${file.name}</span>
		<button type="button" class="file-remove" aria-label="Remove file">×</button>
	`;

	zone.appendChild(fileCard);
	makeDraggable(fileCard);

	fileCard.querySelector('.file-favorite').addEventListener('click', event => {
		event.stopPropagation();
		const zoneKey = zone.dataset.zone || 'default';
		const resources = loadResources();
		resources[zoneKey] = resources[zoneKey] || [];
		const fileIndex = resources[zoneKey].findIndex(saved => saved.id === fileCard.id);
		if (fileIndex === -1) return;
		resources[zoneKey][fileIndex].favorite = !resources[zoneKey][fileIndex].favorite;
		saveResources(resources);
		renderResources();
	});

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
		const files = (resources[zoneKey] || []).slice().sort((a, b) => Number(b.favorite) - Number(a.favorite));
		zone.innerHTML = '';

		if (!files.length) {
			const placeholder = document.createElement('p');
			placeholder.className = 'drag-drop-note';
			placeholder.textContent = 'Drag files from your desktop into this area.';
			zone.appendChild(placeholder);
			return;
		}

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

/* Planner: tasks and daily notes */
(() => {
	const PLANNER_TASKS_PREFIX = 'planner-tasks-';
	const PLANNER_NOTES_PREFIX = 'planner-notes-';
	const plannerDate = document.getElementById('planner-date');
	const taskForm = document.getElementById('planner-task-form');
	const taskInput = document.getElementById('planner-task-input');
	const taskList = document.getElementById('planner-task-list');
	const plannerNote = document.getElementById('planner-note');

	if (!plannerDate) return;

	const formatDate = d => new Date(d).toISOString().split('T')[0];
	const today = new Date();
	if (!plannerDate.value) plannerDate.value = formatDate(today);

	const getTasksKey = date => PLANNER_TASKS_PREFIX + date;
	const getNotesKey = date => PLANNER_NOTES_PREFIX + date;

	const loadPlanner = () => {
		const date = plannerDate.value;
		const tasks = JSON.parse(localStorage.getItem(getTasksKey(date)) || '[]');
		if (taskList) {
			taskList.innerHTML = '';
			tasks.forEach((task, idx) => {
				const item = document.createElement('li');
				item.className = 'todo-item' + (task.done ? ' done' : '');
				item.innerHTML = `\n\t\t\t\t\t<span class="todo-text">${escapeHtml(task.text)}</span>\n\t\t\t\t\t<button type="button" class="todo-remove" aria-label="Remove">×</button>`;
				item.querySelector('.todo-text').addEventListener('click', () => {
					tasks[idx].done = !tasks[idx].done;
					localStorage.setItem(getTasksKey(date), JSON.stringify(tasks));
					loadPlanner();
				});
				item.querySelector('.todo-remove').addEventListener('click', () => {
					tasks.splice(idx, 1);
					localStorage.setItem(getTasksKey(date), JSON.stringify(tasks));
					loadPlanner();
				});
				taskList.appendChild(item);
			});
		}
		if (plannerNote) {
			plannerNote.value = localStorage.getItem(getNotesKey(date)) || '';
		}
	};

	const escapeHtml = str => String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

	plannerDate.addEventListener('change', loadPlanner);
	const prevBtn = document.getElementById('prev-day');
	const nextBtn = document.getElementById('next-day');
	if (prevBtn) prevBtn.addEventListener('click', () => {
		const d = new Date(plannerDate.value); d.setDate(d.getDate() - 1);
		plannerDate.value = formatDate(d);
		loadPlanner();
	});
	if (nextBtn) nextBtn.addEventListener('click', () => {
		const d = new Date(plannerDate.value); d.setDate(d.getDate() + 1);
		plannerDate.value = formatDate(d);
		loadPlanner();
	});

	if (taskForm && taskInput) {
		taskForm.addEventListener('submit', e => {
			e.preventDefault();
			const text = taskInput.value.trim();
			if (!text) return;
			const date = plannerDate.value;
			const key = getTasksKey(date);
			const tasks = JSON.parse(localStorage.getItem(key) || '[]');
			tasks.push({ text, done: false });
			localStorage.setItem(key, JSON.stringify(tasks));
			taskInput.value = '';
			loadPlanner();
		});
	}

	if (plannerNote) {
		plannerNote.addEventListener('input', () => {
			localStorage.setItem(getNotesKey(plannerDate.value), plannerNote.value);
		});
	}

	loadPlanner();
})();

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
						favorite: false,
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

// Math resources: clear/export controls (if present on the page)
(() => {
	const clearBtn = document.getElementById('clear-resources');
	const exportBtn = document.getElementById('export-resources');
	const zoneKey = getResourceStorageKey();

	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			try {
				const key = getResourceStorageKey();
				localStorage.removeItem(key);
				const zones = document.querySelectorAll('.drop-zone');
				zones.forEach(z => {
					z.innerHTML = '<p class="drag-drop-note">Drag files from your desktop into this area.</p>';
				});
				alert('All saved resources removed for this page.');
			} catch (err) {
				console.error(err);
			}
		});
	}

	if (exportBtn) {
		exportBtn.addEventListener('click', () => {
			const key = getResourceStorageKey();
			const resources = JSON.parse(localStorage.getItem(key) || '{}');
			const blob = new Blob([JSON.stringify(resources, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${location.pathname.split('/').pop().replace('.html','')}-resources.json`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		});
	}
})();

(() => {
	const timerDisplay = document.getElementById('timer-display');
	const timerStart = document.getElementById('timer-start');
	const timerPause = document.getElementById('timer-pause');
	const timerReset = document.getElementById('timer-reset');
	const timerMinutes = document.getElementById('timer-minutes');
	const TIMER_STORAGE_KEY = 'focus-timer-duration';

	if (!timerDisplay || !timerStart || !timerPause || !timerReset || !timerMinutes) {
		return;
	}

	let intervalId = null;
	let remainingSeconds = 25 * 60;

	const formatTime = seconds => {
		const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
		const secs = String(seconds % 60).padStart(2, '0');
		return `${minutes}:${secs}`;
	};

	const updateDisplay = () => {
		timerDisplay.textContent = formatTime(remainingSeconds);
	};

	const saveDuration = minutes => {
		localStorage.setItem(TIMER_STORAGE_KEY, String(minutes));
	};

	const loadDuration = () => {
		const saved = localStorage.getItem(TIMER_STORAGE_KEY);
		const minutes = saved && !Number.isNaN(Number(saved)) ? Number(saved) : 25;
		timerMinutes.value = Math.min(120, Math.max(1, minutes));
		remainingSeconds = Number(timerMinutes.value) * 60;
		updateDisplay();
	};

	const stopTimer = () => {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	};

	const resetTimer = () => {
		stopTimer();
		remainingSeconds = Number(timerMinutes.value) * 60;
		updateDisplay();
	};

	timerStart.addEventListener('click', () => {
		if (intervalId !== null) {
			return;
		}
		intervalId = setInterval(() => {
			if (remainingSeconds <= 0) {
				stopTimer();
				alert('Focus session complete! Take a break.');
				return;
			}
			remainingSeconds -= 1;
			updateDisplay();
		}, 1000);
	});

	timerPause.addEventListener('click', () => {
		stopTimer();
	});

	timerReset.addEventListener('click', () => {
		resetTimer();
	});

	timerMinutes.addEventListener('change', () => {
		const minutes = Math.max(1, Math.min(120, Number(timerMinutes.value) || 25));
		timerMinutes.value = minutes;
		saveDuration(minutes);
		resetTimer();
	});

	loadDuration();
})();

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('./sw.js')
			.then(() => console.log('Service worker registered successfully.'))
			.catch(error => console.error('Service worker registration failed:', error));
	});
}
