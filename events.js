// Events Management Module
class EventsManager {
    constructor() {
        this.currentTab = 'upcoming';
        this.editingEventId = null;
        
        this.initializeEventHandlers();
        this.loadEvents();
    }

    initializeEventHandlers() {
        // Tab switching
        document.querySelectorAll('.events-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add event button
        document.getElementById('addEventBtn').addEventListener('click', () => {
            this.openEventModal();
        });

        // Modal handlers
        document.getElementById('closeEventModal').addEventListener('click', () => {
            this.closeEventModal();
        });

        document.getElementById('cancelEvent').addEventListener('click', () => {
            this.closeEventModal();
        });

        // Form submission
        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // Close modal on outside click
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') {
                this.closeEventModal();
            }
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.events-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Show/hide event lists
        document.getElementById('upcomingEvents').classList.toggle('hidden', tab !== 'upcoming');
        document.getElementById('attendedEvents').classList.toggle('hidden', tab !== 'attended');

        this.loadEvents();
    }

    loadEvents() {
        if (this.currentTab === 'upcoming') {
            this.loadUpcomingEvents();
        } else {
            this.loadAttendedEvents();
        }
    }

    loadUpcomingEvents() {
        const container = document.getElementById('upcomingEvents');
        const events = storage.getUpcomingEvents();

        if (events.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('upcoming');
            return;
        }

        container.innerHTML = events.map(event => this.createEventCardHTML(event)).join('');
        this.attachEventHandlers(container);
    }

    loadAttendedEvents() {
        const container = document.getElementById('attendedEvents');
        const events = storage.getAttendedEvents();

        if (events.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('attended');
            return;
        }

        container.innerHTML = events.map(event => this.createEventCardHTML(event, true)).join('');
        this.attachEventHandlers(container);
    }

    createEventCardHTML(event, isAttended = false) {
        const eventDate = new Date(`${event.date} ${event.time}`);
        const now = new Date();
        const isOverdue = eventDate < now && !event.isCompleted;
        const isToday = eventDate.toDateString() === now.toDateString();
        
        let statusClass = '';
        let statusText = '';
        
        if (event.isCompleted) {
            statusClass = 'completed';
            statusText = '<i class="fas fa-check-circle"></i> Completed';
        } else if (isOverdue) {
            statusClass = 'overdue';
            statusText = '<i class="fas fa-exclamation-triangle"></i> Overdue';
        } else if (isToday) {
            statusClass = 'today';
            statusText = '<i class="fas fa-clock"></i> Today';
        } else {
            statusClass = 'upcoming';
            statusText = '<i class="fas fa-calendar-alt"></i> Upcoming';
        }

        return `
            <div class="event-card ${event.type} ${event.isCompleted ? 'completed' : ''}" data-event-id="${event.id}">
                <div class="event-header">
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-actions">
                        ${!isAttended && !event.isCompleted ? `
                            <button class="event-action-btn complete" title="Mark as completed">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="event-action-btn edit" title="Edit event">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="event-action-btn delete" title="Delete event">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                
                <div class="event-details">
                    <div class="event-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(event.date)}</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-clock"></i>
                        <span>${this.formatTime(event.time)}</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-bell"></i>
                        <span>${event.reminderMinutes} min before</span>
                    </div>
                </div>
                
                <div class="event-badges">
                    <span class="event-type ${event.type}">${this.getTypeIcon(event.type)} ${event.type}</span>
                </div>
                
                <div class="event-status ${statusClass}">
                    ${statusText}
                </div>
            </div>
        `;
    }

    getEmptyStateHTML(type) {
        const isUpcoming = type === 'upcoming';
        return `
            <div class="events-empty">
                <i class="fas fa-calendar-${isUpcoming ? 'plus' : 'check'}"></i>
                <h3>No ${isUpcoming ? 'upcoming' : 'attended'} events</h3>
                <p>${isUpcoming ? 'Add your first event to get started!' : 'Your completed events will appear here.'}</p>
                ${isUpcoming ? '<button class="btn-primary" onclick="eventsManager.openEventModal()">Add Event</button>' : ''}
            </div>
        `;
    }

    attachEventHandlers(container) {
        // Complete event buttons
        container.querySelectorAll('.event-action-btn.complete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = e.target.closest('.event-card').dataset.eventId;
                this.completeEvent(eventId);
            });
        });

        // Edit event buttons
        container.querySelectorAll('.event-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = e.target.closest('.event-card').dataset.eventId;
                this.editEvent(eventId);
            });
        });

        // Delete event buttons
        container.querySelectorAll('.event-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = e.target.closest('.event-card').dataset.eventId;
                this.deleteEvent(eventId);
            });
        });

        // Event card click
        container.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.event-actions')) {
                    const eventId = card.dataset.eventId;
                    this.viewEvent(eventId);
                }
            });
        });
    }

    openEventModal(eventId = null) {
        this.editingEventId = eventId;
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const title = document.getElementById('eventModalTitle');

        if (eventId) {
            // Edit mode
            const event = storage.getEventById(eventId);
            if (event) {
                title.textContent = 'Edit Event';
                this.populateEventForm(event);
            }
        } else {
            // Add mode
            title.textContent = 'Add Event';
            form.reset();
            
            // Set default values
            const today = new Date();
            document.getElementById('eventDate').value = today.toISOString().split('T')[0];
            document.getElementById('eventTime').value = '09:00';
            document.getElementById('reminderTime').value = '15';
        }

        modal.classList.add('active');
    }

    closeEventModal() {
        const modal = document.getElementById('eventModal');
        modal.classList.remove('active');
        this.editingEventId = null;
        document.getElementById('eventForm').reset();
    }

    populateEventForm(event) {
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time;
        document.getElementById('eventType').value = event.type;
        document.getElementById('reminderTime').value = event.reminderMinutes;
    }

    saveEvent() {
        const formData = {
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            type: document.getElementById('eventType').value,
            reminderMinutes: parseInt(document.getElementById('reminderTime').value)
        };

        if (!formData.title || !formData.date || !formData.time) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (this.editingEventId) {
            // Update existing event
            const success = storage.updateEvent(this.editingEventId, formData);
            if (success) {
                this.showNotification('Event updated successfully', 'success');
                this.closeEventModal();
                this.loadEvents();
                
                // Trigger calendar update if available
                if (window.calendarManager) {
                    window.calendarManager.loadCalendar();
                }
            } else {
                this.showNotification('Failed to update event', 'error');
            }
        } else {
            // Create new event
            const event = {
                id: storage.generateId(),
                ...formData,
                isCompleted: false,
                createdDate: new Date().toISOString()
            };

            const success = storage.addEvent(event);
            if (success) {
                this.showNotification('Event added successfully', 'success');
                this.closeEventModal();
                this.loadEvents();
                
                // Trigger calendar update if available
                if (window.calendarManager) {
                    window.calendarManager.loadCalendar();
                }
            } else {
                this.showNotification('Failed to add event', 'error');
            }
        }
    }

    completeEvent(eventId) {
        const success = storage.updateEvent(eventId, { isCompleted: true });
        if (success) {
            this.showNotification('Event marked as completed', 'success');
            this.loadEvents();
            
            // Trigger calendar update if available
            if (window.calendarManager) {
                window.calendarManager.loadCalendar();
            }
        } else {
            this.showNotification('Failed to complete event', 'error');
        }
    }

    editEvent(eventId) {
        this.openEventModal(eventId);
    }

    deleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            const success = storage.deleteEvent(eventId);
            if (success) {
                this.showNotification('Event deleted successfully', 'success');
                this.loadEvents();
                
                // Trigger calendar update if available
                if (window.calendarManager) {
                    window.calendarManager.loadCalendar();
                }
            } else {
                this.showNotification('Failed to delete event', 'error');
            }
        }
    }

    viewEvent(eventId) {
        const event = storage.getEventById(eventId);
        if (event) {
            // For now, just edit the event
            // In future, could show a detailed view modal
            this.editEvent(eventId);
        }
    }

    // Utility methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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

    getTypeIcon(type) {
        const icons = {
            meeting: 'fas fa-users',
            birthday: 'fas fa-birthday-cake',
            festival: 'fas fa-star',
            custom: 'fas fa-calendar-alt'
        };
        
        return `<i class="${icons[type] || icons.custom}"></i>`;
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
    getEventsByDate(date) {
        return storage.getEventsByDate(date);
    }

    refreshEvents() {
        this.loadEvents();
    }
}

// Initialize events manager when DOM is loaded
let eventsManager;
document.addEventListener('DOMContentLoaded', () => {
    eventsManager = new EventsManager();
    window.eventsManager = eventsManager; // Make globally accessible
});

