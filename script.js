class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.renderTodos();
        this.updateStats();
        this.showEmptyState();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addTodo');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.clearAllBtn = document.getElementById('clearAll');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
    }

    bindEvents() {
        // Add todo
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Clear buttons
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        this.showEmptyState();
        
        this.todoInput.value = '';
        this.todoInput.focus();
        
        // Add ripple effect to add button
        this.addRippleEffect(this.addBtn);
        
        // Show success animation
        this.showNotification('Task added successfully!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const wasCompleted = todo.completed;
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            if (todo.completed && !wasCompleted) {
                // Add confetti when completing a task
                this.addConfetti();
                this.showNotification('🎉 Task completed! Great job!', 'success');
            } else {
                const message = todo.completed ? 'Task completed!' : 'Task marked as pending';
                this.showNotification(message, 'info');
            }
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingId = id;
        this.renderTodos();
        
        // Focus on the input field
        setTimeout(() => {
            const editInput = document.querySelector(`[data-edit-id="${id}"]`);
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 100);
    }

    saveEdit(id) {
        const editInput = document.querySelector(`[data-edit-id="${id}"]`);
        if (!editInput) return;

        const newText = editInput.value.trim();
        if (!newText) {
            this.deleteTodo(id);
            return;
        }

        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            this.saveTodos();
            this.renderTodos();
            this.showNotification('Task updated successfully!', 'success');
        }

        this.editingId = null;
    }

    cancelEdit() {
        this.editingId = null;
        this.renderTodos();
    }

    deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showEmptyState();
            this.showNotification('Task deleted!', 'warning');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        this.renderTodos();
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'info');
            return;
        }

        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        this.showEmptyState();
        
        // Add confetti for clearing completed tasks
        this.addConfetti();
        this.showNotification(`🎉 ${completedCount} completed tasks cleared!`, 'success');
    }

    clearAll() {
        if (this.todos.length === 0) {
            this.showNotification('No tasks to clear!', 'info');
            return;
        }

        if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
            const totalCount = this.todos.length;
            this.todos = [];
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showEmptyState();
            this.showNotification(`${totalCount} tasks cleared!`, 'warning');
        }
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.innerHTML = `
                <div class="empty-filter-state">
                    <i class="fas fa-filter"></i>
                    <p>No ${this.currentFilter} tasks found</p>
                </div>
            `;
            return;
        }

        this.todoList.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="todoApp.toggleTodo(${todo.id})"></div>
                
                ${this.editingId === todo.id ? 
                    `<input type="text" class="todo-edit-input" value="${todo.text}" 
                            data-edit-id="${todo.id}" 
                            onblur="todoApp.saveEdit(${todo.id})" 
                            onkeypress="if(event.key === 'Enter') todoApp.saveEdit(${todo.id})"
                            onkeyup="if(event.key === 'Escape') todoApp.cancelEdit()">` :
                    `<span class="todo-text">${this.escapeHtml(todo.text)}</span>`
                }
                
                <div class="todo-actions">
                    <button class="action-icon edit" onclick="todoApp.editTodo(${todo.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-icon delete" onclick="todoApp.deleteTodo(${todo.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add styles for edit input
        const style = document.createElement('style');
        style.textContent = `
            .todo-edit-input {
                flex: 1;
                padding: 0.5rem;
                border: 2px solid #3b82f6;
                border-radius: 6px;
                font-size: 1rem;
                background: white;
                outline: none;
            }
            .empty-filter-state {
                text-align: center;
                padding: 2rem;
                color: #6b7280;
            }
            .empty-filter-state i {
                font-size: 2rem;
                margin-bottom: 1rem;
                color: #d1d5db;
            }
        `;
        document.head.appendChild(style);
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.pendingTasksEl.textContent = pending;

        // Add animation to stats
        [this.totalTasksEl, this.completedTasksEl, this.pendingTasksEl].forEach(el => {
            el.style.transform = 'scale(1.1)';
            setTimeout(() => {
                el.style.transform = 'scale(1)';
            }, 200);
        });
    }

    showEmptyState() {
        if (this.todos.length === 0) {
            this.emptyState.classList.add('show');
        } else {
            this.emptyState.classList.remove('show');
        }
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        // Add notification styles
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 12px;
                padding: 1rem 1.5rem;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 1000;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid;
            }
            .notification-success {
                border-left-color: #10b981;
                color: #065f46;
            }
            .notification-warning {
                border-left-color: #f59e0b;
                color: #92400e;
            }
            .notification-info {
                border-left-color: #3b82f6;
                color: #1e40af;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'info': return 'info-circle';
            default: return 'info-circle';
        }
    }

    addRippleEffect(element) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            width: 100px;
            height: 100px;
            top: 50%;
            left: 50%;
            margin-top: -50px;
            margin-left: -50px;
        `;
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    addConfetti() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4ade80'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    top: -10px;
                    left: ${Math.random() * window.innerWidth}px;
                    animation: confettiFall 3s linear forwards;
                    z-index: 1000;
                    border-radius: 50%;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 3000);
            }, i * 50);
        }
    }
}

// Initialize the app
const todoApp = new TodoApp();

// Add some sample todos for demonstration
if (todoApp.todos.length === 0) {
    const sampleTodos = [
        { id: Date.now() - 3, text: 'Welcome to your beautiful todo app!', completed: true, createdAt: new Date().toISOString() },
        { id: Date.now() - 2, text: 'Click the checkbox to mark tasks as complete', completed: false, createdAt: new Date().toISOString() },
        { id: Date.now() - 1, text: 'Use the filters to view different task states', completed: false, createdAt: new Date().toISOString() },
        { id: Date.now(), text: 'Try editing a task by clicking the edit icon', completed: false, createdAt: new Date().toISOString() }
    ];
    
    todoApp.todos = sampleTodos;
    todoApp.saveTodos();
    todoApp.renderTodos();
    todoApp.updateStats();
    todoApp.showEmptyState();
} 