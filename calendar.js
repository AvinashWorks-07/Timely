// Calendar Management Module
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.selectedDate = null;
        
        this.initializeCalendarHandlers();
        this.loadCalendar();
    }

    initializeCalendarHandlers() {
        // View selector buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Navigation buttons
        document.getElementById('prevPeriod').addEventListener('click', () => {
            this.navigatePeriod(-1);
        });

        document.getElementById('nextPeriod').addEventListener('click', () => {
            this.navigatePeriod(1);
        });

        // Calendar grid click handler
        document.getElementById('calendarGrid').addEventListener('click', (e) => {
            this.handleCalendarClick(e);
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.loadCalendar();
    }

    navigatePeriod(direction) {
        const currentDate = new Date(this.currentDate);
        
        switch (this.currentView) {
            case 'month':
                currentDate.setMonth(currentDate.getMonth() + direction);
                break;
            case 'week':
                currentDate.setDate(currentDate.getDate() + (direction * 7));
                break;
            case 'day':
                currentDate.setDate(currentDate.getDate() + direction);
                break;
        }
        
        this.currentDate = currentDate;
        this.loadCalendar();
    }

    loadCalendar() {
        this.updatePeriodDisplay();
        
        switch (this.currentView) {
            case 'month':
                this.loadMonthView();
                break;
            case 'week':
                this.loadWeekView();
                break;
            case 'day':
                this.loadDayView();
                break;
        }
    }

    updatePeriodDisplay() {
        const periodElement = document.getElementById('currentPeriod');
        let periodText = '';
        
        switch (this.currentView) {
            case 'month':
                periodText = this.currentDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                });
                break;
            case 'week':
                const weekStart = this.getWeekStart(this.currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                periodText = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                break;
            case 'day':
                periodText = this.currentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
                break;
        }
        
        periodElement.textContent = periodText;
    }

    loadMonthView() {
        const grid = document.getElementById('calendarGrid');
        grid.className = 'calendar-grid month-view';
        
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = this.getWeekStart(firstDay);
        
        let html = '';
        
        // Day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            html += `<div class="calendar-header day-name">${day}</div>`;
        });
        
        // Calendar cells
        const currentDate = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const cellDate = new Date(currentDate);
                const isCurrentMonth = cellDate.getMonth() === this.currentDate.getMonth();
                const isToday = this.isToday(cellDate);
                const isSelected = this.selectedDate && this.isSameDate(cellDate, this.selectedDate);
                
                let cellClass = 'calendar-cell';
                if (!isCurrentMonth) cellClass += ' other-month';
                if (isToday) cellClass += ' today';
                if (isSelected) cellClass += ' selected';
                
                const events = storage.getEventsByDate(cellDate);
                const eventsHTML = this.createEventsHTML(events, 'month');
                
                html += `
                    <div class="${cellClass}" data-date="${cellDate.toISOString().split('T')[0]}">
                        <div class="date-number">${cellDate.getDate()}</div>
                        ${eventsHTML}
                    </div>
                `;
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        grid.innerHTML = html;
    }

    loadWeekView() {
        const grid = document.getElementById('calendarGrid');
        grid.className = 'calendar-grid week-view';
        
        const weekStart = this.getWeekStart(this.currentDate);
        let html = '';
        
        // Time column header
        html += '<div class="calendar-header">Time</div>';
        
        // Day headers
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const isToday = this.isToday(date);
            
            html += `
                <div class="calendar-header day-name ${isToday ? 'today' : ''}">
                    ${date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                </div>
            `;
        }
        
        // Time slots and cells
        for (let hour = 0; hour < 24; hour++) {
            // Time slot
            const timeString = this.formatHour(hour);
            html += `<div class="time-slot">${timeString}</div>`;
            
            // Day cells for this hour
            for (let day = 0; day < 7; day++) {
                const cellDate = new Date(weekStart);
                cellDate.setDate(cellDate.getDate() + day);
                cellDate.setHours(hour, 0, 0, 0);
                
                const events = this.getEventsForHour(cellDate);
                const eventsHTML = this.createEventsHTML(events, 'week');
                
                html += `
                    <div class="time-cell" data-datetime="${cellDate.toISOString()}">
                        ${eventsHTML}
                    </div>
                `;
            }
        }
        
        grid.innerHTML = html;
        this.addCurrentTimeLine();
    }

    loadDayView() {
        const grid = document.getElementById('calendarGrid');
        grid.className = 'calendar-grid day-view';
        
        let html = '';
        
        // Headers
        html += '<div class="calendar-header">Time</div>';
        html += `
            <div class="calendar-header day-name">
                ${this.currentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                })}
            </div>
        `;
        
        // Time slots and cells
        for (let hour = 0; hour < 24; hour++) {
            const timeString = this.formatHour(hour);
            html += `<div class="time-slot">${timeString}</div>`;
            
            const cellDate = new Date(this.currentDate);
            cellDate.setHours(hour, 0, 0, 0);
            
            const events = this.getEventsForHour(cellDate);
            const eventsHTML = this.createEventsHTML(events, 'day');
            
            html += `
                <div class="time-cell" data-datetime="${cellDate.toISOString()}">
                    ${eventsHTML}
                </div>
            `;
        }
        
        grid.innerHTML = html;
        this.addCurrentTimeLine();
    }

    createEventsHTML(events, view) {
        if (!events || events.length === 0) return '';
        
        let html = '';
        const maxVisible = view === 'month' ? 3 : events.length;
        
        for (let i = 0; i < Math.min(events.length, maxVisible); i++) {
            const event = events[i];
            const eventClass = `calendar-event ${event.type} ${event.isCompleted ? 'completed' : ''}`;
            
            if (view === 'month') {
                html += `
                    <div class="${eventClass}" data-event-id="${event.id}" title="${event.title}">
                        ${event.title}
                    </div>
                `;
            } else {
                const eventTime = new Date(`${event.date} ${event.time}`);
                const duration = this.getEventDuration(event);
                const top = this.calculateEventPosition(eventTime);
                const height = Math.max(20, duration * 40); // 40px per hour
                
                html += `
                    <div class="${eventClass}" 
                         data-event-id="${event.id}" 
                         style="top: ${top}px; height: ${height}px;"
                         title="${event.title} - ${event.time}">
                        <strong>${event.title}</strong>
                        <br><small>${event.time}</small>
                    </div>
                `;
            }
        }
        
        if (events.length > maxVisible && view === 'month') {
            html += `
                <div class="more-events" data-date="${events[0].date}">
                    +${events.length - maxVisible} more
                </div>
            `;
        }
        
        return html;
    }

    handleCalendarClick(e) {
        const cell = e.target.closest('.calendar-cell, .time-cell');
        if (!cell) return;
        
        if (e.target.classList.contains('calendar-event')) {
            // Event clicked
            const eventId = e.target.dataset.eventId;
            if (window.eventsManager) {
                window.eventsManager.editEvent(eventId);
            }
        } else if (e.target.classList.contains('more-events')) {
            // More events clicked
            const date = e.target.dataset.date;
            this.showDayEvents(date);
        } else {
            // Empty cell clicked - create new event
            const date = cell.dataset.date || cell.dataset.datetime;
            if (date) {
                this.createEventAtDate(date);
            }
        }
    }

    createEventAtDate(dateString) {
        if (window.eventsManager) {
            window.eventsManager.openEventModal();
            
            // Pre-fill date and time
            setTimeout(() => {
                const date = new Date(dateString);
                document.getElementById('eventDate').value = date.toISOString().split('T')[0];
                
                if (this.currentView !== 'month') {
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    document.getElementById('eventTime').value = `${hours}:${minutes}`;
                }
            }, 100);
        }
    }

    showDayEvents(date) {
        // Switch to day view for the selected date
        this.currentDate = new Date(date);
        this.switchView('day');
    }

    // Utility methods
    getWeekStart(date) {
        const start = new Date(date);
        const day = start.getDay();
        start.setDate(start.getDate() - day);
        start.setHours(0, 0, 0, 0);
        return start;
    }

    isToday(date) {
        const today = new Date();
        return this.isSameDate(date, today);
    }

    isSameDate(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    formatHour(hour) {
        const date = new Date();
        date.setHours(hour, 0, 0, 0);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
        });
    }

    getEventsForHour(dateTime) {
        const events = storage.getEventsByDate(dateTime);
        return events.filter(event => {
            const eventTime = new Date(`${event.date} ${event.time}`);
            return eventTime.getHours() === dateTime.getHours();
        });
    }

    getEventDuration(event) {
        // Default duration of 1 hour if not specified
        return event.duration || 1;
    }

    calculateEventPosition(eventTime) {
        const minutes = eventTime.getMinutes();
        return (minutes / 60) * 40; // 40px per hour
    }

    addCurrentTimeLine() {
        if (!this.isToday(this.currentDate) && this.currentView !== 'week') return;
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        
        // Find the appropriate time cell
        const timeCells = document.querySelectorAll('.time-cell');
        const targetCell = Array.from(timeCells).find(cell => {
            const cellDate = new Date(cell.dataset.datetime);
            return cellDate.getHours() === currentHour && 
                   (this.currentView === 'day' || this.isSameDate(cellDate, now));
        });
        
        if (targetCell) {
            const line = document.createElement('div');
            line.className = 'current-time-line';
            line.style.top = `${(currentMinutes / 60) * 40}px`;
            targetCell.appendChild(line);
        }
    }

    // Public API methods
    goToDate(date) {
        this.currentDate = new Date(date);
        this.loadCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.loadCalendar();
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.loadCalendar();
    }

    refreshCalendar() {
        this.loadCalendar();
    }
}

// Initialize calendar manager when DOM is loaded
let calendarManager;
document.addEventListener('DOMContentLoaded', () => {
    calendarManager = new CalendarManager();
    window.calendarManager = calendarManager; // Make globally accessible
});

