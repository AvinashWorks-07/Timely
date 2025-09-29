// Main Application Controller
class SchedulerApp {
    constructor() {
        this.currentModule = 'calendar';
        this.theme = 'light';
        
        this.initializeApp();
    }

    initializeApp() {
        this.loadSettings();
        this.initializeNavigation();
        this.initializeTheme();
        this.updateCurrentDate();
        this.startDateUpdater();
        
        // Show welcome notification
        setTimeout(() => {
            if (window.notificationManager) {
                window.notificationManager.show('Welcome to Scheduler App!', 'success', {
                    duration: 3000
                });
            }
        }, 1000);
    }

    loadSettings() {
        const settings = storage.getSettings();
        this.theme = settings.theme || 'light';
    }

    initializeNavigation() {
        // Navigation between modules
        document.querySelectorAll('.nav-item').forEach(navItem => {
            navItem.addEventListener('click', (e) => {
                const module = e.currentTarget.dataset.module;
                this.switchModule(module);
            });
        });

        // Set initial active module
        this.switchModule(this.currentModule);
    }

    switchModule(module) {
        this.currentModule = module;
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.module === module);
        });

        // Show/hide modules
        document.querySelectorAll('.module').forEach(moduleEl => {
            moduleEl.classList.toggle('active', moduleEl.id === `${module}Module`);
        });

        // Update page title
        document.title = `Scheduler App - ${this.capitalizeFirst(module)}`;
    }

    initializeTheme() {
        // Theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Apply initial theme
        this.applyTheme(this.theme);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.theme);
        this.saveSettings();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            themeToggle.title = 'Switch to light mode';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.title = 'Switch to dark mode';
        }
    }

    updateCurrentDate() {
        const currentDateEl = document.getElementById('currentDate');
        const now = new Date();
        
        currentDateEl.textContent = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    startDateUpdater() {
        // Update date every minute
        setInterval(() => {
            this.updateCurrentDate();
        }, 60000);
    }

    saveSettings() {
        const settings = {
            theme: this.theme,
            lastModule: this.currentModule,
            notifications: true
        };
        
        storage.updateSettings(settings);
    }

    // Utility methods
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Public API methods
    exportData() {
        const data = storage.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `scheduler_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        if (window.notificationManager) {
            window.notificationManager.show('Data exported successfully', 'success');
        }
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const success = storage.importData(data);
                    
                    if (success) {
                        if (window.notificationManager) {
                            window.notificationManager.show('Data imported successfully', 'success');
                        }
                        
                        // Refresh all modules
                        this.refreshAllModules();
                    } else {
                        throw new Error('Import failed');
                    }
                } catch (error) {
                    if (window.notificationManager) {
                        window.notificationManager.show('Failed to import data', 'error');
                    }
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    refreshAllModules() {
        // Refresh events
        if (window.eventsManager) {
            window.eventsManager.refreshEvents();
        }
        
        // Refresh calendar
        if (window.calendarManager) {
            window.calendarManager.refreshCalendar();
        }
        
        // Refresh todos
        if (window.todoManager) {
            window.todoManager.refreshTasks();
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            const success = storage.clearAllData();
            
            if (success) {
                if (window.notificationManager) {
                    window.notificationManager.show('All data cleared successfully', 'success');
                }
                
                // Refresh all modules
                this.refreshAllModules();
            } else {
                if (window.notificationManager) {
                    window.notificationManager.show('Failed to clear data', 'error');
                }
            }
        }
    }

    getAppStats() {
        return storage.getStorageStats();
    }

    // Keyboard shortcuts
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when no modal is open
            if (document.querySelector('.modal.active')) return;
            
            // Ctrl/Cmd + key combinations
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchModule('calendar');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchModule('events');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchModule('todo');
                        break;
                    case 'n':
                        e.preventDefault();
                        if (this.currentModule === 'events' && window.eventsManager) {
                            window.eventsManager.openEventModal();
                        } else if (this.currentModule === 'todo' && window.todoManager) {
                            window.todoManager.openTaskModal();
                        }
                        break;
                    case 't':
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportData();
                        break;
                }
            }
            
            // Escape key to close modals
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                }
            }
        });
    }

    // Help and about
    showHelp() {
        const helpContent = `
            <h3>Keyboard Shortcuts</h3>
            <ul>
                <li><strong>Ctrl+1</strong> - Switch to Calendar</li>
                <li><strong>Ctrl+2</strong> - Switch to Events</li>
                <li><strong>Ctrl+3</strong> - Switch to To-Do</li>
                <li><strong>Ctrl+N</strong> - Add new item</li>
                <li><strong>Ctrl+T</strong> - Toggle theme</li>
                <li><strong>Ctrl+E</strong> - Export data</li>
                <li><strong>Escape</strong> - Close modal</li>
            </ul>
            
            <h3>Features</h3>
            <ul>
                <li>Calendar with month/week/day views</li>
                <li>Event management with reminders</li>
                <li>Task management with priorities</li>
                <li>Dark/light theme support</li>
                <li>Data export/import</li>
                <li>Browser notifications</li>
            </ul>
        `;
        
        if (window.notificationManager) {
            window.notificationManager.show('Help information available in console', 'info');
        }
        
        console.log('Scheduler App Help:', helpContent);
    }

    showAbout() {
        const aboutInfo = {
            name: 'Scheduler App',
            version: '1.0.0',
            description: 'A comprehensive scheduling application with events, calendar, and task management',
            features: [
                'Events Management',
                'Calendar Views (Month/Week/Day)',
                'To-Do List with Priorities',
                'Notifications & Reminders',
                'Dark/Light Theme',
                'Data Export/Import'
            ],
            storage: storage.getStorageStats()
        };
        
        console.log('About Scheduler App:', aboutInfo);
        
        if (window.notificationManager) {
            window.notificationManager.show('About information available in console', 'info');
        }
    }
}

// Initialize the application when DOM is loaded
let schedulerApp;
document.addEventListener('DOMContentLoaded', () => {
    schedulerApp = new SchedulerApp();
    window.schedulerApp = schedulerApp; // Make globally accessible
    
    // Initialize keyboard shortcuts
    schedulerApp.initializeKeyboardShortcuts();
    
    // Add global helper functions
    window.exportData = () => schedulerApp.exportData();
    window.importData = () => schedulerApp.importData();
    window.clearAllData = () => schedulerApp.clearAllData();
    window.showHelp = () => schedulerApp.showHelp();
    window.showAbout = () => schedulerApp.showAbout();
    window.testNotification = () => {
        if (window.notificationManager) {
            window.notificationManager.testNotification();
        }
    };
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => {
        //         console.log('SW registered: ', registration);
        //     })
        //     .catch(registrationError => {
        //         console.log('SW registration failed: ', registrationError);
        //     });
    });
}

