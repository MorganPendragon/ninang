document.addEventListener('DOMContentLoaded', function () {
    const supabaseUrl = 'https://hddkqyxhojtgvlautvzx.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZGtxeXhob2p0Z3ZsYXV0dnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1NTI4ODUsImV4cCI6MjA1NDEyODg4NX0.4FAo2vDcCCjgDACSnJXiDaA_gktK5XgoYTuOPcIG2Cg'; // Replace with your API key';
    const database = supabase.createClient(supabaseUrl, supabaseKey);

    // Initialize FullCalendar
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Default view
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [], // Events will be populated dynamically
        eventContent: function (arg) {
            // Customize event content (e.g., add priority color)
            const priorityColor = arg.event.extendedProps.priority === 'High' ? 'red' :
                arg.event.extendedProps.priority === 'Medium' ? 'yellow' : 'blue';
            return {
                html: `<div style="background-color: ${priorityColor}; padding: 5px; border-radius: 5px;">
                    ${arg.event.title}
                </div>`
            };
        }
    });

    calendar.render();

    // Fetch tasks from Supabase and add them to the calendar
    async function fetchTasksAndRenderCalendar() {
        const { data: tasks, error } = await database
            .from('tasks')
            .select('*');

        if (error) {
            console.error('Error fetching tasks:', error);
            return;
        }

        // Map tasks to FullCalendar events
        const events = tasks.map(task => ({
            title: task.task_name,
            start: task.due_date, // Deadline date
            extendedProps: {
                priority: task.priority // Add priority to extendedProps
            }
        }));

        // Add events to the calendar
        calendar.addEventSource(events);
    }

    // Fetch tasks and render the calendar
    fetchTasksAndRenderCalendar();
});