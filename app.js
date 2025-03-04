
document.addEventListener('DOMContentLoaded', function () {
    const supabaseUrl = 'https://hddkqyxhojtgvlautvzx.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZGtxeXhob2p0Z3ZsYXV0dnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1NTI4ODUsImV4cCI6MjA1NDEyODg4NX0.4FAo2vDcCCjgDACSnJXiDaA_gktK5XgoYTuOPcIG2Cg'; // Replace with your API key';
    const database = supabase.createClient(supabaseUrl, supabaseKey);

    console.log('Supabase client initialized:', database);

    let isEditMode = false; // Track if we're in edit mode
    let currentTaskId = null; // Track the task being edited

    const modal = document.getElementById('taskManagerModal');
    const addBtn = document.querySelector('.add-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const addTaskBtn = document.getElementById('addTask');

    // Open modal when "Add New Project" button is clicked
    addBtn.addEventListener('click', () => {
        modal.style.display = 'flex'; // Show the modal
        clearForm(); // Clear the form when opening the modal
    });

    // Close modal when the close button is clicked
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none'; // Hide the modal
    });

    // Close modal when clicking outside the modal
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none'; // Hide the modal
        }
    });

    // Ensure the event listener is only added once
    addTaskBtn.removeEventListener('click', handleAddTask); // Remove existing listener
    addTaskBtn.addEventListener('click', handleAddTask); // Add new listener

    function handleAddTask() {
        addTask().then(() => {
            modal.style.display = 'none'; // Hide the modal after adding/editing
        });
    }

    function getRandomColor() {
        const colors = ["#fee4cb", "#e9e7fd", "#ffd3e2", "#c8f7dc", "#d5deff"];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    async function addTask() {
        let taskName = document.getElementById("taskName").value;
        let priority = document.getElementById("priority").value;
        let dueDate = document.getElementById("deadline").value;

        // Collect subtasks from individual inputs
        const subtaskInputs = document.querySelectorAll('.subtask-input');
        let subTasks = Array.from(subtaskInputs)
            .map(input => input.value.trim())
            .filter(subTask => subTask !== "");

        if (!taskName || !dueDate) {
            alert("Please fill in all fields.");
            return;
        }

        // Validate subtask limit (max 4 subtasks)
        if (subTasks.length > 4) {
            alert("You can only add up to 4 subtasks.");
            return;
        }

        if (isEditMode) {
            // Update existing task
            await editTask(currentTaskId, taskName, priority, dueDate, subTasks);
            isEditMode = false; // Exit edit mode
            currentTaskId = null; // Reset current task ID
            document.getElementById("addTask").textContent = "Add Task"; // Change button text back
        } else {
            // Add new task
            const { data, error } = await database
                .from('tasks')
                .insert([{ task_name: taskName, priority, progress: 0, due_date: dueDate }])
                .select();

            if (error) {
                console.error('Error inserting task:', error);
                alert('Failed to add task. Please try again.');
                return;
            }

            const taskId = data[0].id;

            if (subTasks.length > 0) {
                // Insert subtasks in order
                const subtaskInserts = subTasks.map((subTask, index) => ({
                    task_id: taskId,
                    subtask_name: subTask,
                    completed: false,
                    order: index + 1, // Add an order field to track the order
                }));
                await database.from('subtasks').insert(subtaskInserts);
            }
        }

        fetchTasks();
        clearForm(); // Clear the form after adding/editing
    }

    async function deleteTask(taskId) {
        await database.from('tasks').delete().eq('id', taskId);
        await database.from('subtasks').delete().eq('task_id', taskId);
        fetchTasks();
    }

    async function deleteSubtask(taskId, subtaskName) {
        await database.from('subtasks').delete().eq('task_id', taskId).eq('subtask_name', subtaskName);
        fetchTasks();
    }

    async function toggleSubtaskCompletion(taskId, subtaskName, isCompleted) {
        await database
            .from('subtasks')
            .update({ completed: isCompleted })
            .eq('task_id', taskId)
            .eq('subtask_name', subtaskName);

        updateProgressBar(taskId);
    }

    async function editTask(taskId, taskName, priority, dueDate, subTasks) {
        // Validate subtask limit (max 4 subtasks)
        if (subTasks.length > 4) {
            alert("You can only add up to 4 subtasks.");
            return;
        }

        // Update task details
        const { error: taskError } = await database
            .from('tasks')
            .update({ task_name: taskName, priority, due_date: dueDate })
            .eq('id', taskId);

        if (taskError) {
            console.error('Error updating task:', taskError);
            alert('Failed to update task. Please try again.');
            return;
        }

        // Fetch existing subtasks
        const { data: existingSubtasks, error: subtaskError } = await database
            .from('subtasks')
            .select('*')
            .eq('task_id', taskId);

        if (subtaskError) {
            console.error('Error fetching subtasks:', subtaskError);
            return;
        }

        // Delete existing subtasks
        await database.from('subtasks').delete().eq('task_id', taskId);

        // Insert updated subtasks in order
        if (subTasks.length > 0) {
            const subtaskInserts = subTasks.map((subTask, index) => ({
                task_id: taskId,
                subtask_name: subTask,
                completed: false,
                order: index + 1, // Add an order field to track the order
            }));
            await database.from('subtasks').insert(subtaskInserts);
        }
    }

    function updateProgressBar(taskId) {
        const subtaskCheckboxes = document.querySelectorAll(`.subtask-checkbox[data-task-id='${taskId}']`);
        const progressBar = document.querySelector(`.box-progress[data-task-id='${taskId}']`);
        const progressPercentage = document.querySelector(`.box-progress-percentage[data-task-id='${taskId}']`);
        const daysLeftText = document.querySelector(`.days-left[data-task-id='${taskId}']`);

        if (!progressBar || !progressPercentage || !daysLeftText) return;

        const totalSubtasks = subtaskCheckboxes.length;
        const completedSubtasks = Array.from(subtaskCheckboxes).filter(checkbox => checkbox.checked).length;
        const progress = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

        progressBar.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;

        if (progress === 100) {
            daysLeftText.textContent = "Completed";
            progressBar.style.backgroundColor = '#4CAF50';
        } else {
            const dueDate = daysLeftText.getAttribute('data-due-date');
            const daysLeft = calculateDaysLeft(dueDate);
            daysLeftText.textContent = daysLeft;
            progressBar.style.backgroundColor = '#ff942e';
        }

        // Update progress in the database
        database
            .from('tasks')
            .update({ progress: progress })
            .eq('id', taskId)
            .then(({ error }) => {
                if (error) {
                    console.error('Error updating progress:', error);
                } else {
                    // Refresh the calendar to reflect changes
                    fetchTasksAndRenderCalendar(database, calendar);
                }
            });
    }

    function updateCalendarEvent(taskId, progress) {
        if (!calendar) return; // Ensure the calendar is initialized

        // Find the event in the calendar
        const event = calendar.getEventById(taskId);

        if (event) {
            // Update the event's progress and color
            event.setExtendedProp('progress', progress);
            event.setProp('color', progress === 100 ? '#4CAF50' : '#ff942e'); // Green for completed, orange for incomplete
        }
    }

    function createProjectBox(taskId, taskName, priority, progressPercentage, dueDate, subTasks) {
        let projectBoxWrapper = document.createElement("div");
        projectBoxWrapper.classList.add("project-box-wrapper");

        let projectBox = document.createElement("div");
        projectBox.classList.add("project-box");

        // Change background color if the task is completed
        if (progressPercentage === 100) {
            projectBox.style.backgroundColor = '#e8f5e9'; // Light green for completed tasks
        } else {
            projectBox.style.backgroundColor = getRandomColor();
        }

        // Sort subtasks by their order
        subTasks.sort((a, b) => a.order - b.order);

        let subTaskHtml = subTasks.length > 0 ? `<p>Subtasks:</p><ul>${subTasks.map(subTask => `
        <li>
            <input type='checkbox' class='subtask-checkbox' data-task-id='${taskId}' data-subtask='${subTask.subtask_name}' ${subTask.completed ? 'checked' : ''}>
            ${subTask.subtask_name}
           
        </li>
    `).join('')}</ul>` : "";

        let daysLeftText = calculateDaysLeft(dueDate);

        projectBox.innerHTML = `
        <button class="edit-task" data-task-id="${taskId}">✏️</button>
        <button class='delete-task' data-task-id='${taskId}'>❌</button>
        <div class="project-box-content-header">
            <p class="box-content-header">${taskName}</p>
            <p class="box-content-subheader">${priority}</p>
        </div>
        <div class="box-progress-wrapper">
            <p class="box-progress-header">Progress</p>
            <div class="box-progress-bar">
                <span class="box-progress" data-task-id='${taskId}' style="width: ${progressPercentage}%; background-color: ${progressPercentage === 100 ? '#4CAF50' : '#ff942e'}"></span>
            </div>
            <p class="box-progress-percentage" data-task-id='${taskId}'>${progressPercentage}%</p>
        </div>
        <div class="subtask-list">
            ${subTaskHtml}
        </div>
        <div class="project-box-footer">
            <div class="days-left" data-task-id='${taskId}' data-due-date='${dueDate}'>
                ${progressPercentage === 100 ? "Completed" : daysLeftText}
            </div>
        </div>
    `;

        // Add event listeners for delete and edit
        projectBox.querySelector('.delete-task').addEventListener('click', () => deleteTask(taskId));
        projectBox.querySelectorAll('.delete-subtask').forEach(button => {
            button.addEventListener('click', (event) => {
                const subtaskName = event.target.getAttribute('data-subtask');
                deleteSubtask(taskId, subtaskName);
            });
        });

        // Add event listener for checkbox changes
        projectBox.querySelectorAll('.subtask-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const subtaskName = event.target.getAttribute('data-subtask');
                const isCompleted = event.target.checked;
                toggleSubtaskCompletion(taskId, subtaskName, isCompleted);
            });
        });

        projectBox.querySelector('.edit-task').addEventListener('click', () => {
            // Populate the form with task details
            document.getElementById("taskName").value = taskName;
            document.getElementById("priority").value = priority;
            document.getElementById("deadline").value = dueDate;

            // Populate subtask inputs
            const subtaskInputs = document.querySelectorAll('.subtask-input');
            subtaskInputs.forEach((input, index) => {
                input.value = subTasks[index]?.subtask_name || "";
            });

            // Enter edit mode
            isEditMode = true;
            currentTaskId = taskId;
            document.getElementById("addTask").textContent = "Save Task"; // Change button text
            modal.style.display = 'flex'; // Show the modal
        });

        document.getElementById("projectBoxes").appendChild(projectBox);
    }

    function calculateDaysLeft(dueDate) {
        let deadlineDate = new Date(dueDate);
        let today = new Date();

        // Normalize both dates to midnight to avoid time-related discrepancies
        deadlineDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Calculate the difference in days
        let difference = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

        if (difference < 0) {
            return "Deadline Passed";
        } else if (difference === 0) {
            return "Due Today";
        } else {
            return `${difference} Days Left`;
        }
    }

    function clearForm() {
        document.getElementById("taskName").value = "";
        document.getElementById("priority").value = "High";
        document.getElementById("deadline").value = "";
        const subtaskInputs = document.querySelectorAll('.subtask-input');
        subtaskInputs.forEach(input => input.value = "");
    }

    async function fetchTasks() {
        const { data: tasks, error: taskError } = await database
            .from('tasks')
            .select('*');

        if (taskError) {
            console.error('Error fetching tasks:', taskError);
            return;
        }

        document.getElementById("projectBoxes").innerHTML = '';

        let now = new Date();
        let deadlinePast = 0;
        let workingOnIt = 0;
        let completedTasks = 0;
        let totalTasks = tasks.length;

        for (let task of tasks) {
            const { data: subtasks, error: subtaskError } = await database
                .from('subtasks')
                .select('*')
                .eq('task_id', task.id)
                .order('order', { ascending: true });

            if (subtaskError) {
                console.error('Error fetching subtasks:', subtaskError);
                continue;
            }

            // Create the project box
            createProjectBox(task.id, task.task_name, task.priority, task.progress, task.due_date, subtasks);

            let taskDeadline = new Date(task.due_date);

            if (task.progress === 100) {
                completedTasks++; // Task is completed
            } else if (taskDeadline < now) {
                deadlinePast++; // Task is overdue
            } else {
                workingOnIt++; // Task is still active
            }
        }

        // Update the UI with the task counts
        document.querySelector('.status-number.deadline-past').textContent = deadlinePast;
        document.querySelector('.status-number.working-on-it').textContent = workingOnIt;
        document.querySelector('.status-number.total-tasks').textContent = totalTasks;
        document.querySelector('.status-number.completed-tasks').textContent = completedTasks;

        // Update the calendar with completed tasks
        updateCalendar(tasks);

        // Check for deadlines
        checkDeadlines(tasks);
    }

    function updateCalendar(tasks) {
        if (!calendar) return; // Ensure the calendar is initialized

        // Clear existing events
        calendar.removeAllEvents();

        // Add new events
        tasks.forEach(task => {
            calendar.addEvent({
                title: task.task_name,
                start: task.due_date,
                end: task.due_date,
                color: task.progress === 100 ? '#4CAF50' : '#ff942e', // Green for completed, orange for incomplete
                extendedProps: {
                    progress: task.progress, // Store progress for dynamic styling
                },
            });
        });

        // Re-render the calendar
        calendar.render();
    }

    function updateCalendar(tasks) {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return; // Ensure the calendar element exists

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            events: tasks.map(task => ({
                title: task.task_name,
                start: task.due_date,
                end: task.due_date,
                color: task.progress === 100 ? '#4CAF50' : '#ff942e', // Green for completed, orange for incomplete
            })),
        });

        calendar.render();
    }

    function updateCalendar(tasks) {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return; // Ensure the calendar element exists

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            events: tasks.map(task => ({
                title: task.task_name,
                start: task.due_date,
                end: task.due_date,
                color: task.progress === 100 ? '#4CAF50' : '#ff942e', // Green for completed, orange for incomplete
            })),
        });

        calendar.render();
    }

    //alarm


    function updateDateTime() {
        const now = new Date();
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        document.querySelector('.time').textContent = now.toLocaleDateString('en-US', options);
    }

    // Update immediately
    updateDateTime();

    // Refresh every second (optional)
    setInterval(updateDateTime, 1000);

    // Fetch tasks on page load
    fetchTasks();

    setInterval(fetchTasks, 3600000);
    setTimeout(() => {
    }, 3);

    let audio; // Declare audio globally so we can stop it later

    const passedDeadlinesModal = document.getElementById('passedDeadlinesModal');
    const closePassedDeadlinesModal = passedDeadlinesModal.querySelector('.close-modal');
    const passedDeadlinesList = document.getElementById('passedDeadlinesList');

    // Open modal when "Check Status" button is clicked
    document.getElementById('checkTasks').addEventListener('click', async () => {
        const tasks = await fetchTasksWithPassedDeadlines();
        displayPassedDeadlines(tasks);

        // Only play the alert sound if there are tasks with passed deadlines
        if (tasks.length > 0) {
            playAlertSound();
        }

        passedDeadlinesModal.style.display = 'flex';
    });

    // Close modal when the close button is clicked
    closePassedDeadlinesModal.addEventListener('click', () => {
        passedDeadlinesModal.style.display = 'none';
        stopAlertSound();
    });

    // Close modal when clicking outside the modal
    window.addEventListener('click', (event) => {
        if (event.target === passedDeadlinesModal) {
            passedDeadlinesModal.style.display = 'none';
            stopAlertSound();
        }
    });

    async function fetchTasksWithPassedDeadlines() {
        const now = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const { data: tasks, error } = await database
            .from('tasks')
            .select('*')
            .lt('due_date', now); // Fetch tasks with due dates before today

        if (error) {
            console.error('Error fetching tasks with passed deadlines:', error);
            return [];
        }

        return tasks;
    }

    function displayPassedDeadlines(tasks) {
        passedDeadlinesList.innerHTML = ''; // Clear the list
        if (tasks.length === 0) {
            passedDeadlinesList.innerHTML = '<p>No tasks with passed deadlines.</p>';
            return;
        }

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');
            taskElement.innerHTML = `
            <p><strong>${task.task_name}</strong></p>
            <p>Due Date: ${task.due_date}</p>
            <p>Priority: ${task.priority}</p>
        `;
            passedDeadlinesList.appendChild(taskElement);
        });
    }

    function playAlertSound() {
        // Only play the sound if there are tasks with passed deadlines
        if (passedDeadlinesList.children.length > 0) {
            audio = new Audio('./sounds/alert.mp3');
            audio.loop = true; // Loop the sound until stopped
            audio.play().catch(error => console.error('Audio play error:', error));
        }
    }

    function stopAlertSound() {
        if (audio) {
            audio.pause();
            audio.currentTime = 0; // Reset audio to start
        }
    }

    document.getElementById("searchBox").addEventListener("input", function () {
        let filter = this.value.toLowerCase();
        let projectBoxes = document.querySelectorAll(".project-box");

        projectBoxes.forEach(box => {
            let taskTitle = box.querySelector(".box-content-header").textContent.toLowerCase();

            // Show only if the task title matches the search input
            box.style.display = taskTitle.includes(filter) ? "block" : "none";
        });
    });


});



