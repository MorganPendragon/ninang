let calendar; // Global variable to store the calendar instance

document.addEventListener('DOMContentLoaded', function () {
    const supabaseUrl = 'https://hddkqyxhojtgvlautvzx.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZGtxeXhob2p0Z3ZsYXV0dnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1NTI4ODUsImV4cCI6MjA1NDEyODg4NX0.4FAo2vDcCCjgDACSnJXiDaA_gktK5XgoYTuOPcIG2Cg'; // Replace with your API key';
    const database = supabase.createClient(supabaseUrl, supabaseKey);

    // Initialize the calendar
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // Default view
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: [], // Events will be populated dynamically
            eventDidMount: function (info) {
                // Change color if the task is completed
                if (info.event.extendedProps.progress === 100) {
                    info.el.style.backgroundColor = '#4CAF50'; // Green for completed tasks
                }
            },
        });
        calendar.render();
    }

    // Fetch tasks and render the calendar
    fetchTasksAndRenderCalendar(database);
});

    calendar.render();

    async function fetchTasksAndRenderCalendar(database) {
        const { data: tasks, error } = await database
            .from('tasks')
            .select('*');
    
        if (error) {
            console.error('Error fetching tasks:', error);
            return;
        }
    
        // Map tasks to FullCalendar events
        const events = tasks.map(task => ({
            id: task.id, // Add task ID to identify events
            title: task.task_name,
            start: task.due_date, // Deadline date
            extendedProps: {
                priority: task.priority, // Add priority to extendedProps
                progress: task.progress // Add progress to extendedProps
            },
            color: task.progress === 100 ? '#4CAF50' : '#ff942e', // Green for completed, orange for incomplete
        }));
    
        // Clear existing events and add new events to the calendar
        calendar.removeAllEvents();
        calendar.addEventSource(events);
    }