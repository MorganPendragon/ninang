document.addEventListener('DOMContentLoaded', function () {
    var modeSwitch = document.querySelector('.mode-switch');

    modeSwitch.addEventListener('click', function () {
        document.documentElement.classList.toggle('dark');
        modeSwitch.classList.toggle('active');
    });

    var listView = document.querySelector('.list-view');
    var gridView = document.querySelector('.grid-view');
    var projectsList = document.querySelector('.project-boxes');

    listView.addEventListener('click', function () {
        gridView.classList.remove('active');
        listView.classList.add('active');
        projectsList.classList.remove('jsGridView');
        projectsList.classList.add('jsListView');
    });

    gridView.addEventListener('click', function () {
        gridView.classList.add('active');
        listView.classList.remove('active');
        projectsList.classList.remove('jsListView');
        projectsList.classList.add('jsGridView');
    });

    document.querySelector('.messages-btn').addEventListener('click', function () {
        document.querySelector('.messages-section').classList.add('show');
    });

    document.querySelector('.messages-close').addEventListener('click', function () {
        document.querySelector('.messages-section').classList.remove('show');
    });
});
document.addEventListener('DOMContentLoaded', function () {
    // Initialize Supabase client
    const supabaseUrl = 'https://hddkqyxhojtgvlautvzx.supabase.co'; // Replace with your URL
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZGtxeXhob2p0Z3ZsYXV0dnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1NTI4ODUsImV4cCI6MjA1NDEyODg4NX0.4FAo2vDcCCjgDACSnJXiDaA_gktK5XgoYTuOPcIG2Cg'; // Replace with your API key
    const database = supabase.createClient(supabaseUrl, supabaseKey);

    console.log('Supabase client initialized:', database); // Debugging

    // Function to generate a random color for the project box
    function getRandomColor() {
        const colors = ["#fee4cb", "#e9e7fd", "#ffd3e2", "#c8f7dc", "#d5deff"];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Function to add a task
    async function addTask() {
        let taskName = document.getElementById("taskName").value;
        let priority = document.getElementById("priority").value;
        let progressPercentage = document.getElementById("progressPercentage").value;
        let dueDate = document.getElementById("deadline").value; // Matches database column name

        if (taskName === "" || progressPercentage === "" || dueDate === "") {
            alert("Please fill in all fields.");
            return;
        }

        // Insert task into Supabase with due_date
        const { data, error } = await database
            .from('tasks')
            .insert([{
                task_name: taskName,
                priority: priority,
                progress: progressPercentage,
                due_date: dueDate // Changed to due_date
            }]);

        if (error) {
            console.error('Error inserting task:', error);
            alert('Failed to add task. Please try again.');
            return;
        }

        // Create a new project box
        createProjectBox(taskName, priority, progressPercentage, dueDate);

        // Clear input fields
        document.getElementById("taskName").value = "";
        document.getElementById("progressPercentage").value = "";
        document.getElementById("deadline").value = "";
    }


    // Function to create a project box
    function createProjectBox(taskName, priority, progressPercentage, dueDate) {
        let projectBoxWrapper = document.createElement("div");
        projectBoxWrapper.classList.add("project-box-wrapper");

        let projectBox = document.createElement("div");
        projectBox.classList.add("project-box");
        projectBox.style.backgroundColor = getRandomColor();

        // Calculate days left
        let daysLeftText = calculateDaysLeft(dueDate);

        projectBox.innerHTML = `
            <div class="project-box-header">
                <span>${new Date().toLocaleDateString()}</span>
                <div class="more-wrapper">
                    <button class="project-btn-more">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-more-vertical">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                        </svg>
                    </button>
                </div>
            </div>
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
        `;

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



    // Function to fetch tasks
    async function fetchTasks() {
        const { data, error } = await database
            .from('tasks')
            .select('*');

        if (error) {
            console.error('Error fetching tasks:', error);
            return;
        }

        console.log('Fetched tasks:', data);

        // Clear existing project boxes
        document.getElementById("projectBoxes").innerHTML = '';

        // Create a project box for each task
        data.forEach(task => {
            createProjectBox(task.task_name, task.priority, task.progress, task.due_date);
        });
    }

    async function fetchTasks() {
        const { data, error } = await database
            .from('tasks')
            .select('*');

        if (error) {
            console.error('Error fetching tasks:', error);
            return;
        }

        console.log('Fetched tasks:', data);

        // Clear existing project boxes
        document.getElementById("projectBoxes").innerHTML = '';

        let now = new Date();
        let deadlinePast = 0;
        let workingOnIt = 0;
        let totalTasks = data.length;

        // Loop through each task
        data.forEach(task => {
            let taskDeadline = new Date(task.due_date);

            if (taskDeadline < now) {
                deadlinePast++; // Task is overdue
            } else {
                workingOnIt++; // Task is still active
            }

            // Create a project box for each task
            createProjectBox(task.task_name, task.priority, task.progress, task.due_date);
        });

        // Update the UI with the task counts
        document.querySelector('.status-number.deadline-past').textContent = deadlinePast;
        document.querySelector('.status-number.working-on-it').textContent = workingOnIt;
        document.querySelector('.status-number.total-tasks').textContent = totalTasks;
    }

    // Fetch tasks on page load
    fetchTasks();


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