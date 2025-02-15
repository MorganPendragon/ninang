document.addEventListener('DOMContentLoaded', function () {
    const supabaseUrl = 'https://hddkqyxhojtgvlautvzx.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZGtxeXhob2p0Z3ZsYXV0dnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1NTI4ODUsImV4cCI6MjA1NDEyODg4NX0.4FAo2vDcCCjgDACSnJXiDaA_gktK5XgoYTuOPcIG2Cg'; // Replace with your API key';
    const database = supabase.createClient(supabaseUrl, supabaseKey);

    console.log('Supabase client initialized:', database);

    function getRandomColor() {
        const colors = ["#fee4cb", "#e9e7fd", "#ffd3e2", "#c8f7dc", "#d5deff"];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    async function addTask() {
        let taskName = document.getElementById("taskName").value;
        let priority = document.getElementById("priority").value;
        let progressPercentage = document.getElementById("progressPercentage").value;
        let dueDate = document.getElementById("deadline").value;
        let subTasksInput = document.getElementById("subTasks");
        let subTasks = subTasksInput ? subTasksInput.value.split(',').map(subTask => subTask.trim()).filter(subTask => subTask !== "") : [];

        if (!taskName || !progressPercentage || !dueDate) {
            alert("Please fill in all fields.");
            return;
        }

        const { data, error } = await database
            .from('tasks')
            .insert([{ task_name: taskName, priority, progress: progressPercentage, due_date: dueDate }])
            .select();

        if (error) {
            console.error('Error inserting task:', error);
            alert('Failed to add task. Please try again.');
            return;
        }

        const taskId = data[0].id;

        if (subTasks.length > 0) {
            const subtaskInserts = subTasks.map(subTask => ({ task_id: taskId, subtask_name: subTask, completed: false }));
            await database.from('subtasks').insert(subtaskInserts);
        }

        fetchTasks();
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

    function createProjectBox(taskId, taskName, priority, progressPercentage, dueDate, subTasks) {
        let projectBoxWrapper = document.createElement("div");
        projectBoxWrapper.classList.add("project-box-wrapper");

        let projectBox = document.createElement("div");
        projectBox.classList.add("project-box");
        projectBox.style.backgroundColor = getRandomColor();

        let subTaskHtml = subTasks.length > 0 ? `<p>Subtasks:</p><ul>${subTasks.map(subTask => `<li><input type='checkbox' class='subtask-checkbox' data-task-id='${taskId}' data-subtask='${subTask}'> ${subTask} <button class='delete-subtask' data-task-id='${taskId}' data-subtask='${subTask}'>❌</button></li>`).join('')}</ul>` : "";

        let formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });

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
                    <span class="box-progress" style="width: ${progressPercentage}%; background-color: #ff942e"></span>
                </div>
                <p class="box-progress-percentage">${progressPercentage}%</p>
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
                <div class="days-left" style="color: #ff942e;">
                    ${daysLeftText}
                </div>
            </div>
            <button class='edit-task' data-task-id='${taskId}'>✏️ Edit</button>
            <button class='delete-task' data-task-id='${taskId}'>❌ Delete</button>
        `;

        projectBox.querySelector('.delete-task').addEventListener('click', () => deleteTask(taskId));
        projectBox.querySelectorAll('.delete-subtask').forEach(button => {
            button.addEventListener('click', (event) => {
                const subtaskName = event.target.getAttribute('data-subtask');
                deleteSubtask(taskId, subtaskName);
            });
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
                .select('subtask_name')
                .eq('task_id', task.id);

            if (subtaskError) {
                console.error('Error fetching subtasks:', subtaskError);
                continue;
            }

            let subTaskNames = subtasks.map(subtask => subtask.subtask_name);
            createProjectBox(task.id, task.task_name, task.priority, task.progress, task.due_date, subTaskNames);

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

    document.querySelector('.task button').addEventListener('click', addTask);

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