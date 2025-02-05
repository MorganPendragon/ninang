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

// Function to add a task to the Projects section
function addTask() {
    let taskName = document.getElementById("taskName").value;
    let priority = document.getElementById("priority").value;
    let progressPercentage = document.getElementById("progressPercentage").value;

    if (taskName === "" || progressPercentage === "") {
        alert("Please fill in all fields.");
        return;
    }

    // Create a new project box
    let projectBoxWrapper = document.createElement("div");
    projectBoxWrapper.classList.add("project-box-wrapper");

    let projectBox = document.createElement("div");
    projectBox.classList.add("project-box");
    projectBox.style.backgroundColor = getRandomColor(); // Assign a random color

    // Project box header
    let projectBoxHeader = document.createElement("div");
    projectBoxHeader.classList.add("project-box-header");
    projectBoxHeader.innerHTML = `
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
    `;

    // Project box content header
    let projectBoxContentHeader = document.createElement("div");
    projectBoxContentHeader.classList.add("project-box-content-header");
    projectBoxContentHeader.innerHTML = `
        <p class="box-content-header">${taskName}</p>
        <p class="box-content-subheader">${priority}</p>
    `;

    // Progress bar
    let boxProgressWrapper = document.createElement("div");
    boxProgressWrapper.classList.add("box-progress-wrapper");
    boxProgressWrapper.innerHTML = `
        <p class="box-progress-header">Progress</p>
        <div class="box-progress-bar">
            <span class="box-progress" style="width: ${progressPercentage}%; background-color: #ff942e"></span>
        </div>
        <p class="box-progress-percentage">${progressPercentage}%</p>
    `;

    // Project box footer
    let projectBoxFooter = document.createElement("div");
    projectBoxFooter.classList.add("project-box-footer");
    projectBoxFooter.innerHTML = `
        <div class="participants">
            <button class="add-participant" style="color: #ff942e;">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>
        </div>
        <div class="days-left" style="color: #ff942e;">
            2 Days Left
        </div>
    `;

    // Append all elements to the project box
    projectBox.appendChild(projectBoxHeader);
    projectBox.appendChild(projectBoxContentHeader);
    projectBox.appendChild(boxProgressWrapper);
    projectBox.appendChild(projectBoxFooter);

    // Append the project box to the wrapper
    projectBoxWrapper.appendChild(projectBox);

    // Append the wrapper to the project boxes section
    document.getElementById("projectBoxes").appendChild(projectBoxWrapper);

    // Clear input fields
    document.getElementById("taskName").value = "";
    document.getElementById("progressPercentage").value = "";
}

// Function to generate a random color for the project box
function getRandomColor() {
    const colors = ["#fee4cb", "#e9e7fd", "#ffd3e2", "#c8f7dc", "#d5deff"];
    return colors[Math.floor(Math.random() * colors.length)];
}
