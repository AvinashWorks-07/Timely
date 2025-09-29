// To-Do List Management Module
class TodoManager {
    constructor() {
        this.currentFilters = {
            category: 'all',
            priority: 'all',
            status: 'all'
        };
        this.editingTaskId = null;
        
        this.initializeTodoHandlers();
        this.loadTasks();
    }

    initializeTodoHandlers() {
        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // Filter handlers
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.loadTasks();
        });

        document.getElementById('priorityFilter').addEventListener('change', (e) => {
            this.currentFilters.priority = e.target.value;
            this.loadTasks();
        });

        // Modal handlers
        document.getElementById('closeTaskModal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('cancelTask').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Close modal on outside click
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                this.closeTaskModal();
            }
        });
    }

    loadTasks() {
        const container = document.getElementById('tasksList');
        let tasks = storage.getTasks();
        
        // Apply filters
        tasks = this.applyFilters(tasks);
        
        // Sort tasks
        tasks = this.sortTasks(tasks);

        if (tasks.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        // Create task stats
        const statsHTML = this.createTaskStatsHTML();
        
        // Create tasks list
        const tasksHTML = tasks.map(task => this.createTaskCardHTML(task)).join('');
        
        container.innerHTML = `
            ${statsHTML}
            <div class="tasks-container">
                ${tasksHTML}
            </div>
        `;
        
        this.attachTaskHandlers(container);
    }

    applyFilters(tasks) {
        return tasks.filter(task => {
            // Category filter
            if (this.currentFilters.category !== 'all' && task.category !== this.currentFilters.category) {
                return false;
            }
            
            // Priority filter
            if (this.currentFilters.priority !== 'all' && task.priority !== this.currentFilters.priority) {
                return false;
            }
            
            // Status filter
            if (this.currentFilters.status === 'completed' && !task.isCompleted) {
                return false;
            }
            if (this.currentFilters.status === 'pending' && task.isCompleted) {
                return false;
            }
            
            return true;
        });
    }

    sortTasks(tasks) {
        return tasks.sort((a, b) => {
            // Completed tasks go to bottom
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
            }
            
            // Sort by priority (high -> medium -> low)
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            // Sort by due date (earliest first)
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            
            // Sort by creation date (newest first)
            return new Date(b.createdDate) - new Date(a.createdDate);
        });
    }

    createTaskStatsHTML() {
        const allTasks = storage.getTasks();
        const completed = allTasks.filter(task => task.isCompleted).length;
        const pending = allTasks.length - completed;
        const overdue = this.getOverdueTasks().length;
        
        return `
            <div class="task-stats">
                <div class="stat-item">
                    <span class="stat-number">${allTasks.length}</span>
                    <span class="stat-label">Total Tasks</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${pending}</span>
                    <span class="stat-label">Pending</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${completed}</span>
                    <span class="stat-label">Completed</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${overdue}</span>
                    <span class="stat-label">Overdue</span>
                </div>
            </div>
        `;
    }

    createTaskCardHTML(task) {
        const isOverdue = this.isTaskOverdue(task);
        const isDueToday = this.isTaskDueToday(task);
        const isDueSoon = this.isTaskDueSoon(task);
        
        let dueDateBadge = '';
        if (task.dueDate && !task.isCompleted) {
            let badgeClass = 'due-date-badge';
            let badgeText = this.formatDate(task.dueDate);
            
            if (isOverdue) {
                badgeClass += ' overdue';
                badgeText = 'Overdue';
            } else if (isDueToday) {
                badgeClass += ' due-today';
                badgeText = 'Due Today';
            } else if (isDueSoon) {
                badgeClass += ' due-soon';
                badgeText = `Due ${badgeText}`;
            } else {
                badgeText = `Due ${badgeText}`;
            }
            
            dueDateBadge = `<span class="${badgeClass}"><i class="fas fa-calendar"></i> ${badgeText}</span>`;
        }

        return `
            <div class="task-item ${task.priority}-priority ${task.isCompleted ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox ${task.isCompleted ? 'checked' : ''}" data-task-id="${task.id}"></div>
                    <div class="task-content">
                        <h3 class="task-title">${task.title}</h3>
                        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                        
                        <div class="task-meta">
                            <div class="task-meta-item">
                                <i class="fas fa-folder"></i>
                                <span>${task.category}</span>
                            </div>
                            <div class="task-meta-item">
                                <i class="fas fa-flag"></i>
                                <span>${task.priority} priority</span>
                            </div>
                            ${task.dueDate ? `
                                <div class="task-meta-item">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>${this.formatDate(task.dueDate)}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="task-badges">
                            <span class="task-badge category ${task.category}">${task.category}</span>
                            <span class="task-badge priority ${task.priority}">${task.priority}</span>
                            ${dueDateBadge}
                        </div>
                    </div>
                </div>
                
                <div class="task-actions">
                    <button class="task-action-btn edit" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getEmptyStateHTML() {
        return `
            <div class="tasks-empty">
                <i class="fas fa-tasks"></i>
                <h3>No tasks found</h3>
                <p>Add your first task to get started with organizing your work!</p>
                <button class="btn-primary" onclick="todoManager.openTaskModal()">Add Task</button>
            </div>
        `;
    }

    attachTaskHandlers(container) {
        // Checkbox handlers
        container.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = checkbox.dataset.taskId;
                this.toggleTaskCompletion(taskId);
            });
        });

        // Edit task buttons
        container.querySelectorAll('.task-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = e.target.closest('.task-item').dataset.taskId;
                this.editTask(taskId);
            });
        });

        // Delete task buttons
        container.querySelectorAll('.task-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = e.target.closest('.task-item').dataset.taskId;
                this.deleteTask(taskId);
            });
        });
    }

    openTaskModal(taskId = null) {
        this.editingTaskId = taskId;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('taskModalTitle');

        if (taskId) {
            // Edit mode
            const task = storage.getTaskById(taskId);
            if (task) {
                title.textContent = 'Edit Task';
                this.populateTaskForm(task);
            }
        } else {
            // Add mode
            title.textContent = 'Add Task';
            form.reset();
        }

        modal.classList.add('active');
    }

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.remove('active');
        this.editingTaskId = null;
        document.getElementById('taskForm').reset();
    }

    populateTaskForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDueDate').value = task.dueDate || '';
    }

    saveTask() {
        const formData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            category: document.getElementById('taskCategory').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value || null
        };

        if (!formData.title) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        if (this.editingTaskId) {
            // Update existing task
            const success = storage.updateTask(this.editingTaskId, formData);
            if (success) {
                this.showNotification('Task updated successfully', 'success');
                this.closeTaskModal();
                this.loadTasks();
            } else {
                this.showNotification('Failed to update task', 'error');
            }
        } else {
            // Create new task
            const task = {
                id: storage.generateId(),
                ...formData,
                isCompleted: false,
                createdDate: new Date().toISOString()
            };

            const success = storage.addTask(task);
            if (success) {
                this.showNotification('Task added successfully', 'success');
                this.closeTaskModal();
                this.loadTasks();
            } else {
                this.showNotification('Failed to add task', 'error');
            }
        }
    }

    toggleTaskCompletion(taskId) {
        const task = storage.getTaskById(taskId);
        if (task) {
            const success = storage.updateTask(taskId, { 
                isCompleted: !task.isCompleted,
                completedDate: !task.isCompleted ? new Date().toISOString() : null
            });
            
            if (success) {
                this.showNotification(
                    task.isCompleted ? 'Task marked as pending' : 'Task completed!', 
                    'success'
                );
                this.loadTasks();
            } else {
                this.showNotification('Failed to update task', 'error');
            }
        }
    }

    editTask(taskId) {
        this.openTaskModal(taskId);
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            const success = storage.deleteTask(taskId);
            if (success) {
                this.showNotification('Task deleted successfully', 'success');
                this.loadTasks();
            } else {
                this.showNotification('Failed to delete task', 'error');
            }
        }
    }

    // Utility methods
    isTaskOverdue(task) {
        if (!task.dueDate || task.isCompleted) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    isTaskDueToday(task) {
        if (!task.dueDate || task.isCompleted) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        return dueDate.toDateString() === today.toDateString();
    }

    isTaskDueSoon(task) {
        if (!task.dueDate || task.isCompleted) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 7;
    }

    getOverdueTasks() {
        const tasks = storage.getTasks();
        return tasks.filter(task => this.isTaskOverdue(task));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show(message, type);
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    // Public API methods
    refreshTasks() {
        this.loadTasks();
    }

    getTaskStats() {
        return storage.getStorageStats();
    }

    exportTasks() {
        const tasks = storage.getTasks();
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `tasks_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Initialize todo manager when DOM is loaded
let todoManager;
document.addEventListener('DOMContentLoaded', () => {
    todoManager = new TodoManager();
    window.todoManager = todoManager; // Make globally accessible
});

