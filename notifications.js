// Notifications and Reminders System
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.reminderIntervals = new Map();
        this.permissionGranted = false;
        
        this.initializeNotifications();
        this.startReminderSystem();
    }

    async initializeNotifications() {
        // Request notification permission
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.permissionGranted = permission === 'granted';
            
            if (!this.permissionGranted) {
                console.warn('Notification permission denied. Using in-app notifications only.');
            }
        } else {
            console.warn('Browser does not support notifications. Using in-app notifications only.');
        }

        // Create notifications container if it doesn't exist
        if (!document.getElementById('notifications')) {
            const container = document.createElement('div');
            container.id = 'notifications';
            container.className = 'notifications';
            document.body.appendChild(container);
        }
    }

    startReminderSystem() {
        // Check for reminders every minute
        setInterval(() => {
            this.checkEventReminders();
        }, 60000); // 60 seconds

        // Initial check
        this.checkEventReminders();
    }

    checkEventReminders() {
        const events = storage.getUpcomingEvents();
        const now = new Date();

        events.forEach(event => {
            if (event.isCompleted) return;

            const eventDateTime = new Date(`${event.date} ${event.time}`);
            const timeDiff = eventDateTime - now;
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));

            // Check if we should send a reminder
            if (minutesDiff === event.reminderMinutes) {
                this.sendEventReminder(event);
            }

            // Also check for overdue events
            if (minutesDiff < 0 && Math.abs(minutesDiff) <= 60) {
                this.sendOverdueNotification(event);
            }
        });
    }

    sendEventReminder(event) {
        const message = `Reminder: ${event.title} starts in ${event.reminderMinutes} minutes`;
        const options = {
            type: 'reminder',
            icon: 'fas fa-bell',
            duration: 10000, // 10 seconds
            actions: [
                {
                    text: 'View Event',
                    action: () => this.openEvent(event.id)
                },
                {
                    text: 'Mark Complete',
                    action: () => this.completeEvent(event.id)
                }
            ]
        };

        this.show(message, 'warning', options);
        this.sendBrowserNotification(message, {
            icon: '/favicon.ico',
            tag: `event-reminder-${event.id}`,
            requireInteraction: true
        });
    }

    sendOverdueNotification(event) {
        const message = `Overdue: ${event.title} was scheduled for ${this.formatTime(event.time)}`;
        const options = {
            type: 'overdue',
            icon: 'fas fa-exclamation-triangle',
            duration: 15000, // 15 seconds
            actions: [
                {
                    text: 'Mark Complete',
                    action: () => this.completeEvent(event.id)
                },
                {
                    text: 'Reschedule',
                    action: () => this.rescheduleEvent(event.id)
                }
            ]
        };

        this.show(message, 'error', options);
    }

    show(message, type = 'info', options = {}) {
        const notification = {
            id: this.generateId(),
            message,
            type,
            timestamp: new Date(),
            ...options
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        // Auto-remove after duration
        const duration = options.duration || 5000;
        setTimeout(() => {
            this.remove(notification.id);
        }, duration);

        return notification.id;
    }

    renderNotification(notification) {
        const container = document.getElementById('notifications');
        if (!container) return;

        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.dataset.notificationId = notification.id;

        const icon = notification.icon || this.getTypeIcon(notification.type);
        const actionsHTML = notification.actions ? 
            notification.actions.map(action => 
                `<button class="notification-action" data-action="${action.text}">${action.text}</button>`
            ).join('') : '';

        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <i class="${icon}"></i>
                    <span class="notification-message">${notification.message}</span>
                    <button class="notification-close" data-notification-id="${notification.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                ${actionsHTML ? `<div class="notification-actions">${actionsHTML}</div>` : ''}
            </div>
        `;

        // Add event listeners
        element.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(notification.id);
        });

        if (notification.actions) {
            element.querySelectorAll('.notification-action').forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    notification.actions[index].action();
                    this.remove(notification.id);
                });
            });
        }

        // Add to container with animation
        container.appendChild(element);
        
        // Trigger animation
        setTimeout(() => {
            element.classList.add('notification-show');
        }, 10);
    }

    remove(notificationId) {
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
            element.classList.add('notification-hide');
            setTimeout(() => {
                element.remove();
            }, 300);
        }

        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    }

    sendBrowserNotification(message, options = {}) {
        if (!this.permissionGranted) return;

        try {
            const notification = new Notification(message, {
                icon: options.icon || '/favicon.ico',
                badge: '/favicon.ico',
                tag: options.tag || 'scheduler-notification',
                requireInteraction: options.requireInteraction || false,
                ...options
            });

            // Auto-close after 10 seconds if not requiring interaction
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 10000);
            }

            return notification;
        } catch (error) {
            console.error('Failed to send browser notification:', error);
        }
    }

    // Event-specific actions
    openEvent(eventId) {
        if (window.eventsManager) {
            // Switch to events module
            document.querySelector('[data-module="events"]').click();
            // Edit the event
            setTimeout(() => {
                window.eventsManager.editEvent(eventId);
            }, 100);
        }
    }

    completeEvent(eventId) {
        if (window.eventsManager) {
            const success = storage.updateEvent(eventId, { isCompleted: true });
            if (success) {
                this.show('Event marked as completed', 'success');
                if (window.eventsManager) {
                    window.eventsManager.refreshEvents();
                }
                if (window.calendarManager) {
                    window.calendarManager.refreshCalendar();
                }
            }
        }
    }

    rescheduleEvent(eventId) {
        if (window.eventsManager) {
            // Switch to events module and edit
            document.querySelector('[data-module="events"]').click();
            setTimeout(() => {
                window.eventsManager.editEvent(eventId);
            }, 100);
        }
    }

    // Task-specific notifications
    sendTaskReminder(task) {
        const message = `Task due: ${task.title}`;
        const options = {
            type: 'task-reminder',
            icon: 'fas fa-tasks',
            duration: 8000,
            actions: [
                {
                    text: 'Mark Complete',
                    action: () => this.completeTask(task.id)
                },
                {
                    text: 'View Task',
                    action: () => this.openTask(task.id)
                }
            ]
        };

        this.show(message, 'info', options);
    }

    completeTask(taskId) {
        if (window.todoManager) {
            window.todoManager.toggleTaskCompletion(taskId);
        }
    }

    openTask(taskId) {
        if (window.todoManager) {
            // Switch to todo module
            document.querySelector('[data-module="todo"]').click();
            // Edit the task
            setTimeout(() => {
                window.todoManager.editTask(taskId);
            }, 100);
        }
    }

    // Utility methods
    getTypeIcon(type) {
        const icons = {
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle',
            reminder: 'fas fa-bell',
            overdue: 'fas fa-clock'
        };
        return icons[type] || icons.info;
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Public API methods
    clearAll() {
        const container = document.getElementById('notifications');
        if (container) {
            container.innerHTML = '';
        }
        this.notifications = [];
    }

    getNotifications() {
        return [...this.notifications];
    }

    // Settings management
    updateSettings(settings) {
        const currentSettings = storage.getSettings();
        const newSettings = { ...currentSettings, ...settings };
        storage.saveSettings(newSettings);
    }

    isNotificationsEnabled() {
        const settings = storage.getSettings();
        return settings.notifications !== false;
    }

    // Test notification
    testNotification() {
        this.show('Test notification - your scheduler app is working!', 'success', {
            duration: 3000
        });
        
        this.sendBrowserNotification('Test notification from Scheduler App', {
            requireInteraction: false
        });
    }
}

// Add notification styles
const notificationStyles = `
.notifications {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    pointer-events: none;
}

.notification {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    margin-bottom: 10px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease-in-out;
    pointer-events: auto;
    overflow: hidden;
}

.notification-show {
    opacity: 1;
    transform: translateX(0);
}

.notification-hide {
    opacity: 0;
    transform: translateX(100%);
}

.notification-info {
    border-left: 4px solid var(--primary-color);
}

.notification-success {
    border-left: 4px solid var(--accent-color);
}

.notification-warning {
    border-left: 4px solid var(--warning-color);
}

.notification-error {
    border-left: 4px solid var(--danger-color);
}

.notification-content {
    padding: 1rem;
}

.notification-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.notification-header i {
    color: var(--text-secondary);
    margin-top: 0.125rem;
    flex-shrink: 0;
}

.notification-message {
    flex: 1;
    color: var(--text-primary);
    font-weight: 500;
    line-height: 1.4;
}

.notification-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
    flex-shrink: 0;
}

.notification-close:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
}

.notification-actions {
    margin-top: 0.75rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.notification-action {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.notification-action:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
}

.notification-action:nth-child(2) {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

.notification-action:nth-child(2):hover {
    background: var(--border-color);
}

@media (max-width: 480px) {
    .notifications {
        left: 10px;
        right: 10px;
        max-width: none;
    }
    
    .notification-actions {
        flex-direction: column;
    }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialize notification manager when DOM is loaded
let notificationManager;
document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new NotificationManager();
    window.notificationManager = notificationManager; // Make globally accessible
});

