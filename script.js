class WeeklyScheduler {
    constructor() {
        this.activities = JSON.parse(localStorage.getItem('schedulerActivities')) || [];
        this.currentWeek = this.getWeekStart(new Date());
        this.editingActivity = null;
        this.notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
        this.init();
    }

    init() {
        this.requestNotificationPermission();
        this.renderScheduler();
        this.updateWeekDisplay();
        this.updateStats();
        this.scheduleNotifications();
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    renderScheduler() {
        const scheduler = document.getElementById('scheduler');
        scheduler.innerHTML = '';

        // Header row
        scheduler.appendChild(this.createTimeHeader());
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        days.forEach((day, index) => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            const date = new Date(this.currentWeek);
            date.setDate(date.getDate() + index);
            dayHeader.innerHTML = `${day}<br><small>${date.getDate()}/${date.getMonth() + 1}</small>`;
            scheduler.appendChild(dayHeader);
        });

        // Time slots and schedule cells
        for (let hour = 6; hour <= 22; hour++) {
            // Time slot
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            scheduler.appendChild(timeSlot);

            // Day cells
            for (let day = 0; day < 7; day++) {
                const cell = document.createElement('div');
                cell.className = 'schedule-cell';
                cell.dataset.day = day;
                cell.dataset.hour = hour;
                cell.addEventListener('click', () => this.openModal(day, hour));
                scheduler.appendChild(cell);
            }
        }

        this.renderActivities();
        this.checkConflicts();
    }

    createTimeHeader() {
        const header = document.createElement('div');
        header.className = 'time-slot';
        header.textContent = 'Time';
        header.style.background = '#4a5568';
        header.style.color = 'white';
        header.style.fontWeight = 'bold';
        return header;
    }

    renderActivities() {
        this.activities.forEach((activity, index) => {
            if (this.isActivityInCurrentWeek(activity)) {
                const element = this.createActivityElement(activity, index);
                this.positionActivity(element, activity);
            }
        });
    }

    isActivityInCurrentWeek(activity) {
        const activityDate = new Date(this.currentWeek);
        activityDate.setDate(activityDate.getDate() + activity.day);
        const weekEnd = new Date(this.currentWeek);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return activityDate >= this.currentWeek && activityDate <= weekEnd;
    }

    createActivityElement(activity, index) {
        const element = document.createElement('div');
        element.className = `activity ${activity.category}`;
        element.textContent = activity.name;
        element.title = `${activity.name}\n${activity.startTime} - ${activity.endTime}${activity.notes ? '\n' + activity.notes : ''}`;
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editActivity(index);
        });
        return element;
    }

    positionActivity(element, activity) {
        const [startHour, startMinute] = activity.startTime.split(':').map(Number);
        const [endHour, endMinute] = activity.endTime.split(':').map(Number);
        
        if (startHour < 6 || startHour > 22) return;

        const cell = document.querySelector(`[data-day="${activity.day}"][data-hour="${startHour}"]`);
        if (!cell) return;

        const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        const cellHeight = 60;
        const height = (duration / 60) * cellHeight;
        const top = (startMinute / 60) * cellHeight;

        element.style.top = `${top}px`;
        element.style.height = `${height - 4}px`;
        
        cell.appendChild(element);
    }

    checkConflicts() {
        const conflicts = new Set();
        
        for (let i = 0; i < this.activities.length; i++) {
            for (let j = i + 1; j < this.activities.length; j++) {
                if (this.activitiesConflict(this.activities[i], this.activities[j])) {
                    conflicts.add(i);
                    conflicts.add(j);
                }
            }
        }

        document.querySelectorAll('.activity').forEach((element, index) => {
            if (conflicts.has(index)) {
                element.classList.add('conflict');
            }
        });
    }

    activitiesConflict(a1, a2) {
        if (a1.day !== a2.day) return false;
        
        const start1 = this.timeToMinutes(a1.startTime);
        const end1 = this.timeToMinutes(a1.endTime);
        const start2 = this.timeToMinutes(a2.startTime);
        const end2 = this.timeToMinutes(a2.endTime);
        
        return start1 < end2 && start2 < end1;
    }

    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    openModal(day = 0, hour = 9) {
        this.editingActivity = null;
        document.getElementById('modalTitle').textContent = 'Add New Activity';
        document.getElementById('deleteBtn').style.display = 'none';
        
        document.getElementById('activityName').value = '';
        document.getElementById('activityCategory').value = 'classes';
        document.getElementById('activityDay').value = day;
        document.getElementById('startTime').value = `${hour.toString().padStart(2, '0')}:00`;
        document.getElementById('endTime').value = `${(hour + 1).toString().padStart(2, '0')}:00`;
        document.getElementById('activityNotes').value = '';
        document.getElementById('reminderTime').value = '15';
        
        document.getElementById('activityModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('activityModal').style.display = 'none';
    }

    editActivity(index) {
        this.editingActivity = index;
        const activity = this.activities[index];
        
        document.getElementById('modalTitle').textContent = 'Edit Activity';
        document.getElementById('deleteBtn').style.display = 'inline-block';
        
        document.getElementById('activityName').value = activity.name;
        document.getElementById('activityCategory').value = activity.category;
        document.getElementById('activityDay').value = activity.day;
        document.getElementById('startTime').value = activity.startTime;
        document.getElementById('endTime').value = activity.endTime;
        document.getElementById('activityNotes').value = activity.notes || '';
        document.getElementById('reminderTime').value = activity.reminderTime || '15';
        
        document.getElementById('activityModal').style.display = 'block';
    }

    saveActivity(formData) {
        const activity = {
            name: formData.get('name'),
            category: formData.get('category'),
            day: parseInt(formData.get('day')),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            notes: formData.get('notes'),
            reminderTime: parseInt(formData.get('reminderTime'))
        };

        if (this.editingActivity !== null) {
            this.activities[this.editingActivity] = activity;
            this.showNotification('Activity updated successfully!');
        } else {
            this.activities.push(activity);
            this.showNotification('Activity added successfully!');
        }

        this.saveToStorage();
        this.renderScheduler();
        this.updateStats();
        this.scheduleNotifications();
        this.closeModal();
    }

    deleteActivity() {
        if (this.editingActivity !== null) {
            this.activities.splice(this.editingActivity, 1);
            this.saveToStorage();
            this.renderScheduler();
            this.updateStats();
            this.closeModal();
            this.showNotification('Activity deleted successfully!');
        }
    }

    saveToStorage() {
        localStorage.setItem('schedulerActivities', JSON.stringify(this.activities));
    }

    updateWeekDisplay() {
        const weekEnd = new Date(this.currentWeek);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const options = { month: 'short', day: 'numeric' };
        const startStr = this.currentWeek.toLocaleDateString('en-US', options);
        const endStr = weekEnd.toLocaleDateString('en-US', options);
        
        document.getElementById('weekDisplay').textContent = `${startStr} - ${endStr}, ${this.currentWeek.getFullYear()}`;
    }

    previousWeek() {
        this.currentWeek.setDate(this.currentWeek.getDate() - 7);
        this.updateWeekDisplay();
        this.renderScheduler();
        this.updateStats();
    }

    nextWeek() {
        this.currentWeek.setDate(this.currentWeek.getDate() + 7);
        this.updateWeekDisplay();
        this.renderScheduler();
        this.updateStats();
    }

    updateStats() {
        const currentWeekActivities = this.activities.filter(activity => 
            this.isActivityInCurrentWeek(activity)
        );

        const categoryStats = {};
        const categories = ['classes', 'workouts', 'meals', 'study', 'work', 'free-time', 'relax-time', 'reading'];
        
        categories.forEach(cat => categoryStats[cat] = 0);

        currentWeekActivities.forEach(activity => {
            const duration = this.timeToMinutes(activity.endTime) - this.timeToMinutes(activity.startTime);
            categoryStats[activity.category] += duration;
        });

        const statsContainer = document.getElementById('stats');
        statsContainer.innerHTML = '';

        Object.entries(categoryStats).forEach(([category, minutes]) => {
            const hours = Math.round((minutes / 60) * 10) / 10;
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <h3>${category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}</h3>
                <div class="value">${hours}h</div>
            `;
            statsContainer.appendChild(card);
        });
    }

    saveTemplate() {
        const template = {
            name: prompt('Enter template name:') || 'My Template',
            activities: this.activities.map(activity => ({...activity}))
        };
        
        const templates = JSON.parse(localStorage.getItem('schedulerTemplates')) || [];
        templates.push(template);
        localStorage.setItem('schedulerTemplates', JSON.stringify(templates));
        
        this.showNotification('Template saved successfully!');
    }

    loadTemplate() {
        const templates = JSON.parse(localStorage.getItem('schedulerTemplates')) || [];
        
        if (templates.length === 0) {
            this.showNotification('No templates found!');
            return;
        }

        const templateNames = templates.map((t, i) => `${i + 1}. ${t.name}`).join('\n');
        const selection = prompt(`Select template:\n${templateNames}\n\nEnter number:`);
        
        if (selection && !isNaN(selection)) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < templates.length) {
                this.activities = templates[index].activities.map(activity => ({...activity}));
                this.saveToStorage();
                this.renderScheduler();
                this.updateStats();
                this.showNotification('Template loaded successfully!');
            }
        }
    }

    clearSchedule() {
        if (confirm('Are you sure you want to clear all activities?')) {
            this.activities = [];
            this.saveToStorage();
            this.renderScheduler();
            this.updateStats();
            this.showNotification('Schedule cleared!');
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    toggleNotifications() {
        this.notificationsEnabled = !this.notificationsEnabled;
        localStorage.setItem('notificationsEnabled', this.notificationsEnabled);
        
        if (this.notificationsEnabled && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.scheduleNotifications();
                    this.showNotification('Notifications enabled!');
                }
            });
        } else {
            this.showNotification(this.notificationsEnabled ? 'Notifications enabled!' : 'Notifications disabled!');
            if (this.notificationsEnabled) {
                this.scheduleNotifications();
            }
        }
    }

    scheduleNotifications() {
        if (!this.notificationsEnabled || Notification.permission !== 'granted') return;

        // Clear existing timeouts
        if (this.notificationTimeouts) {
            this.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
        }
        this.notificationTimeouts = [];

        const now = new Date();
        
        this.activities.forEach(activity => {
            if (activity.reminderTime > 0) {
                const activityDate = new Date(this.currentWeek);
                activityDate.setDate(activityDate.getDate() + activity.day);
                
                const [hours, minutes] = activity.startTime.split(':').map(Number);
                activityDate.setHours(hours, minutes, 0, 0);
                
                const reminderTime = new Date(activityDate.getTime() - activity.reminderTime * 60000);
                
                if (reminderTime > now) {
                    const timeout = setTimeout(() => {
                        new Notification('Upcoming Activity', {
                            body: `${activity.name} starts in ${activity.reminderTime} minutes`,
                            icon: '📅'
                        });
                    }, reminderTime.getTime() - now.getTime());
                    
                    this.notificationTimeouts.push(timeout);
                }
            }
        });
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize the scheduler
const scheduler = new WeeklyScheduler();

// Event handlers
document.getElementById('activityForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('activityName').value);
    formData.append('category', document.getElementById('activityCategory').value);
    formData.append('day', document.getElementById('activityDay').value);
    formData.append('startTime', document.getElementById('startTime').value);
    formData.append('endTime', document.getElementById('endTime').value);
    formData.append('notes', document.getElementById('activityNotes').value);
    formData.append('reminderTime', document.getElementById('reminderTime').value);
    
    scheduler.saveActivity(formData);
});

// Global functions for buttons
function openModal() { scheduler.openModal(); }
function closeModal() { scheduler.closeModal(); }
function deleteActivity() { scheduler.deleteActivity(); }
function saveTemplate() { scheduler.saveTemplate(); }
function loadTemplate() { scheduler.loadTemplate(); }
function clearSchedule() { scheduler.clearSchedule(); }
function toggleNotifications() { scheduler.toggleNotifications(); }
function previousWeek() { scheduler.previousWeek(); }
function nextWeek() { scheduler.nextWeek(); }

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('activityModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
    if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        openModal();
    }
});
