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
            eventClick: function (info) {
                // Fetch task details and display them in the modal
                fetchTaskDetails(info.event.id, database).then(task => {
                    if (task) {
                        displayTaskDetails(task);
                    }
                });
            },
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

    // Close modal when the close button is clicked
    const closeModalBtn = document.querySelector('.close-modalcalendar');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('taskDetailsModal').style.display = 'none';
        });
    }

    // Close modal when clicking outside the modal
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('taskDetailsModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

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

async function fetchTaskDetails(taskId, database) {
    const { data: task, error } = await database
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (error) {
        console.error('Error fetching task details:', error);
        return null;
    }

    // Fetch subtasks for the task
    const { data: subtasks, error: subtaskError } = await database
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId);

    if (subtaskError) {
        console.error('Error fetching subtasks:', subtaskError);
    }

    return { ...task, subtasks: subtasks || [] };
}

function displayTaskDetails(task) {
    const modal = document.getElementById('taskDetailsModal');
    const content = document.getElementById('taskDetailsContent');

    if (!modal || !content) {
        console.error('Modal or content element not found');
        return;
    }

    // Generate a random color for the project box
    const randomColor = getRandomColor();

    // Generate HTML for the task details
    const taskHtml = `
        <div class="project-box" style="background-color: ${randomColor}; width: 100%; height: 100%;">
            <div class="project-box-content-header">
                <p class="box-content-header">${task.task_name}</p>
                <p class="box-content-subheader">${task.priority}</p>
            </div>
            <div class="box-progress-wrapper">
                <p class="box-progress-header">Progress</p>
                <div class="box-progress-bar">
                    <span class="box-progress" style="width: ${task.progress}%; background-color: ${task.progress === 100 ? '#4CAF50' : '#ff942e'}"></span>
                </div>
                <p class="box-progress-percentage">${task.progress}%</p>
            </div>
            <div class="subtask-list">
                ${task.subtasks.length > 0 ? `<p>Subtasks:</p><ul>${task.subtasks.map(subTask => `
                    <li>
                        <input type='checkbox' class='subtask-checkbox' ${subTask.completed ? 'checked' : ''} disabled>
                        ${subTask.subtask_name}
                    </li>
                `).join('')}</ul>` : "<p>No subtasks.</p>"}
            </div>
            <div class="project-box-footer">
                <div class="days-left">
                    ${task.progress === 100 ? "Completed" : calculateDaysLeft(task.due_date)}
                </div>
            </div>
        </div>
    `;

    // Populate the modal with task details
    content.innerHTML = taskHtml;
    modal.style.display = 'flex';
}

function calculateDaysLeft(dueDate) {
    const deadlineDate = new Date(dueDate);
    const today = new Date();
    const difference = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (difference < 0) {
        return "Deadline Passed";
    } else if (difference === 0) {
        return "Due Today";
    } else {
        return `${difference} Days Left`;
    }
}

function getRandomColor() {
    const colors = ["#fee4cb", "#e9e7fd", "#ffd3e2", "#c8f7dc", "#d5deff"];
    return colors[Math.floor(Math.random() * colors.length)];
}