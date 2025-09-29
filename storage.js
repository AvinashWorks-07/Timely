// Storage Management for Scheduler App
class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            EVENTS: 'scheduler_events',
            TASKS: 'scheduler_tasks',
            SETTINGS: 'scheduler_settings'
        };
        
        // Initialize storage if not exists
        this.initializeStorage();
    }

    // Initialize default storage structure
    initializeStorage() {
        if (!this.getEvents()) {
            this.saveEvents([]);
        }
        
        if (!this.getTasks()) {
            this.saveTasks([]);
        }
        
        if (!this.getSettings()) {
            this.saveSettings({
                theme: 'light',
                defaultReminderTime: 15,
                notifications: true
            });
        }
    }

    // Generic storage methods
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    getFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    }

    // Events storage methods
    saveEvents(events) {
        return this.saveToStorage(this.STORAGE_KEYS.EVENTS, events);
    }

    getEvents() {
        return this.getFromStorage(this.STORAGE_KEYS.EVENTS) || [];
    }

    addEvent(event) {
        const events = this.getEvents();
        events.push(event);
        return this.saveEvents(events);
    }

    updateEvent(eventId, updatedEvent) {
        const events = this.getEvents();
        const index = events.findIndex(event => event.id === eventId);
        
        if (index !== -1) {
            events[index] = { ...events[index], ...updatedEvent };
            return this.saveEvents(events);
        }
        
        return false;
    }

    deleteEvent(eventId) {
        const events = this.getEvents();
        const filteredEvents = events.filter(event => event.id !== eventId);
        return this.saveEvents(filteredEvents);
    }

    getEventById(eventId) {
        const events = this.getEvents();
        return events.find(event => event.id === eventId);
    }

    getEventsByDate(date) {
        const events = this.getEvents();
        const targetDate = new Date(date).toDateString();
        
        return events.filter(event => {
            const eventDate = new Date(event.date).toDateString();
            return eventDate === targetDate;
        });
    }

    getUpcomingEvents() {
        const events = this.getEvents();
        const now = new Date();
        
        return events.filter(event => {
            const eventDateTime = new Date(`${event.date} ${event.time}`);
            return eventDateTime > now && !event.isCompleted;
        }).sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });
    }

    getAttendedEvents() {
        const events = this.getEvents();
        const now = new Date();
        
        return events.filter(event => {
            const eventDateTime = new Date(`${event.date} ${event.time}`);
            return eventDateTime < now || event.isCompleted;
        }).sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA; // Most recent first
        });
    }

    // Tasks storage methods
    saveTasks(tasks) {
        return this.saveToStorage(this.STORAGE_KEYS.TASKS, tasks);
    }

    getTasks() {
        return this.getFromStorage(this.STORAGE_KEYS.TASKS) || [];
    }

    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        return this.saveTasks(tasks);
    }

    updateTask(taskId, updatedTask) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(task => task.id === taskId);
        
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updatedTask };
            return this.saveTasks(tasks);
        }
        
        return false;
    }

    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        return this.saveTasks(filteredTasks);
    }

    getTaskById(taskId) {
        const tasks = this.getTasks();
        return tasks.find(task => task.id === taskId);
    }

    getTasksByCategory(category) {
        const tasks = this.getTasks();
        return tasks.filter(task => task.category === category);
    }

    getTasksByPriority(priority) {
        const tasks = this.getTasks();
        return tasks.filter(task => task.priority === priority);
    }

    getCompletedTasks() {
        const tasks = this.getTasks();
        return tasks.filter(task => task.isCompleted);
    }

    getPendingTasks() {
        const tasks = this.getTasks();
        return tasks.filter(task => !task.isCompleted);
    }

    // Settings storage methods
    saveSettings(settings) {
        return this.saveToStorage(this.STORAGE_KEYS.SETTINGS, settings);
    }

    getSettings() {
        return this.getFromStorage(this.STORAGE_KEYS.SETTINGS) || {};
    }

    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        return this.saveSettings(updatedSettings);
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    exportData() {
        return {
            events: this.getEvents(),
            tasks: this.getTasks(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.events) {
                this.saveEvents(data.events);
            }
            
            if (data.tasks) {
                this.saveTasks(data.tasks);
            }
            
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    clearAllData() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.EVENTS);
            localStorage.removeItem(this.STORAGE_KEYS.TASKS);
            localStorage.removeItem(this.STORAGE_KEYS.SETTINGS);
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Get storage usage statistics
    getStorageStats() {
        const events = this.getEvents();
        const tasks = this.getTasks();
        
        return {
            totalEvents: events.length,
            upcomingEvents: this.getUpcomingEvents().length,
            attendedEvents: this.getAttendedEvents().length,
            totalTasks: tasks.length,
            completedTasks: this.getCompletedTasks().length,
            pendingTasks: this.getPendingTasks().length
        };
    }
}

// Create global storage instance
const storage = new StorageManager();

