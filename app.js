document.addEventListener('DOMContentLoaded', function () {
    const supabaseUrl = 'https://hddkqyxhojtgvlautvzx.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZGtxeXhob2p0Z3ZsYXV0dnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1NTI4ODUsImV4cCI6MjA1NDEyODg4NX0.4FAo2vDcCCjgDACSnJXiDaA_gktK5XgoYTuOPcIG2Cg'; // Replace with your API key';
    const database = supabase.createClient(supabaseUrl, supabaseKey);

    console.log('Supabase client initialized:', database);

    let isEditMode = false; // Track if we're in edit mode
    let currentTaskId = null; // Track the task being edited

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

        // Update "Days Left" text if progress is 100%
        if (progress === 100) {
            daysLeftText.textContent = "Completed";
        } else {
            const dueDate = daysLeftText.getAttribute('data-due-date');
            const daysLeft = calculateDaysLeft(dueDate);
            daysLeftText.textContent = daysLeft;
        }

        // Update progress in the database
        database
            .from('tasks')
            .update({ progress: progress })
            .eq('id', taskId)
            .then(({ error }) => {
                if (error) console.error('Error updating progress:', error);
            });
    }

    function createProjectBox(taskId, taskName, priority, progressPercentage, dueDate, subTasks) {
        let projectBoxWrapper = document.createElement("div");
        projectBoxWrapper.classList.add("project-box-wrapper");

        let projectBox = document.createElement("div");
        projectBox.classList.add("project-box");
        projectBox.style.backgroundColor = getRandomColor();

        // Sort subtasks by their order
        subTasks.sort((a, b) => a.order - b.order);

        let subTaskHtml = subTasks.length > 0 ? `<p>Subtasks:</p><ul>${subTasks.map(subTask => `
            <li>
                <input type='checkbox' class='subtask-checkbox' data-task-id='${taskId}' data-subtask='${subTask.subtask_name}' ${subTask.completed ? 'checked' : ''}>
                ${subTask.subtask_name}
                <button class='check-subtask' data-task-id='${taskId}' data-subtask='${subTask.subtask_name}'>✔</button>
                <button class='delete-subtask' data-task-id='${taskId}' data-subtask='${subTask.subtask_name}'>❌</button>
            </li>
        `).join('')}</ul>` : "";

        let daysLeftText = calculateDaysLeft(dueDate);

        projectBox.innerHTML = `
            <input type='checkbox' class='task-checkbox' data-task-id='${taskId}'>
            <div class="project-box-content-header">
                <p class="box-content-header">${taskName}</p>
                <p class="box-content-subheader">${priority}</p>
            </div>
            <div class="box-progress-wrapper">
                <p class="box-progress-header">Progress</p>
                <div class="box-progress-bar">
                    <span class="box-progress" data-task-id='${taskId}' style="width: ${progressPercentage}%; background-color: #ff942e"></span>
                </div>
                <p class="box-progress-percentage" data-task-id='${taskId}'>${progressPercentage}%</p>
            </div>
            <div class="subtask-list">
                ${subTaskHtml}
            </div>
            <div class="project-box-footer">
                <div class="participants">
                    <button class="add-participant" style="color: #ff942e;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>
                </div>
                <div class="days-left" data-task-id='${taskId}' data-due-date='${dueDate}'>
                    ${progressPercentage === 100 ? "Completed" : daysLeftText}
                </div>
            </div>
            <button class="edit-task" data-task-id="${taskId}">✏️ Edit Task</button>
            <button class='delete-task' data-task-id='${taskId}'>❌ Delete Task</button>
        `;

        projectBox.querySelector('.delete-task').addEventListener('click', () => deleteTask(taskId));
        projectBox.querySelectorAll('.delete-subtask').forEach(button => {
            button.addEventListener('click', (event) => {
                const subtaskName = event.target.getAttribute('data-subtask');
                deleteSubtask(taskId, subtaskName);
            });
        });

        projectBox.querySelectorAll('.check-subtask').forEach(button => {
            button.addEventListener('click', (event) => {
                const subtaskName = event.target.getAttribute('data-subtask');
                const checkbox = event.target.parentElement.querySelector('.subtask-checkbox');
                const isCompleted = checkbox.checked;
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
        });

        document.getElementById("projectBoxes").appendChild(projectBox);
    }

    function calculateDaysLeft(dueDate) {
        let deadlineDate = new Date(dueDate);
        let today = new Date();
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
        let totalTasks = tasks.length;

        for (let task of tasks) {
            const { data: subtasks, error: subtaskError } = await database
                .from('subtasks')
                .select('*')
                .eq('task_id', task.id)
                .order('order', { ascending: true }); // Fetch subtasks in order

            if (subtaskError) {
                console.error('Error fetching subtasks:', subtaskError);
                continue;
            }

            createProjectBox(task.id, task.task_name, task.priority, task.progress, task.due_date, subtasks);

            let taskDeadline = new Date(task.due_date);

            if (taskDeadline < now) {
                deadlinePast++; // Task is overdue
            } else {
                workingOnIt++; // Task is still active
            }
        }

        // Update the UI with the task counts
        document.querySelector('.status-number.deadline-past').textContent = deadlinePast;
        document.querySelector('.status-number.working-on-it').textContent = workingOnIt;
        document.querySelector('.status-number.total-tasks').textContent = totalTasks;
    }

    document.getElementById("addTask").addEventListener('click', addTask);

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
});


document.addEventListener('DOMContentLoaded', function () {
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

    // Handle task addition/editing
    addTaskBtn.addEventListener('click', () => {
        addTask().then(() => {
            modal.style.display = 'none'; // Hide the modal after adding/editing
        });
    });

    // Edit task functionality
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-task')) {
            const taskId = event.target.getAttribute('data-task-id');
            const taskBox = event.target.closest('.project-box');
            const taskName = taskBox.querySelector('.box-content-header').textContent;
            const priority = taskBox.querySelector('.box-content-subheader').textContent;
            const dueDate = taskBox.querySelector('.days-left').getAttribute('data-due-date');

            // Populate the form with task details
            document.getElementById('taskName').value = taskName;
            document.getElementById('priority').value = priority;
            document.getElementById('deadline').value = dueDate;

            // Fetch subtasks and populate subtask inputs
            database
                .from('subtasks')
                .select('*')
                .eq('task_id', taskId)
                .then(({ data: subtasks }) => {
                    const subtaskInputs = document.querySelectorAll('.subtask-input');
                    subtaskInputs.forEach((input, index) => {
                        input.value = subtasks[index]?.subtask_name || '';
                    });
                });

            // Enter edit mode
            isEditMode = true;
            currentTaskId = taskId;
            addTaskBtn.textContent = 'Save Task'; // Change button text
            modal.style.display = 'flex'; // Show the modal automatically
        }
    });
});