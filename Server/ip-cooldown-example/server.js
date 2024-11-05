const express = require('express');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const groupsFilePath = path.join(__dirname, 'groups.json'); // File for groups
const tasksDir = path.join(__dirname, 'tasks'); // Directory for task files
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Ensure the groups file exists
if (!fs.existsSync(groupsFilePath)) {
    fs.writeFileSync(groupsFilePath, JSON.stringify({ groups: [] }, null, 2)); // Initialize with an empty array
}

// Ensure the tasks directory exists
if (!fs.existsSync(tasksDir)) {
    fs.mkdirSync(tasksDir); // Create tasks directory if it doesn't exist
}

// Function to load all groups from the groups.json file
function loadGroups() {
    try {
        const fileData = fs.readFileSync(groupsFilePath);
        return JSON.parse(fileData).groups || []; // Ensure it returns an array
    } catch (error) {
        console.error('Error loading groups:', error);
        return []; // Return an empty array if there is an error
    }
}

// Function to save groups back to the groups.json file
function saveGroups(groups) {
    fs.writeFileSync(groupsFilePath, JSON.stringify({ groups }, null, 2)); // Save the updated groups
}

// Function to save tasks to a specific file
function saveTasks(code, tasks) {
    const filePath = path.join(tasksDir, `${code}-tasks.json`); // File path based on code
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2)); // Save tasks as JSON
}

// Function to load tasks for a specific group
function loadTasks(code) {
    const filePath = path.join(tasksDir, `${code}-tasks.json`); // File path based on code
    if (fs.existsSync(filePath)) {
        try {
            const fileData = fs.readFileSync(filePath);
            return JSON.parse(fileData); // Parse and return tasks
        } catch (error) {
            console.error(`Error reading tasks for group ${code}:`, error);
            return []; // Return an empty array if there is an error
        }
    }
    return []; // Return an empty array if no tasks file exists
}


// Function to generate a random code
function GenerateRandomCode(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Endpoint to serve tasks page for a specific group
app.get('/tasks/view/:code', (req, res) => {
    const { code } = req.params;
    const groups = loadGroups();
    const group = groups.find(g => g.code === code); // Find the group by code

    if (group) {
        const tasks = loadTasks(code); // Load tasks for the group
        res.render('tasks', { group, tasks }); // Render the tasks page with group and tasks data
    } else {
        res.status(404).send('Group not found'); // Handle case where group is not found
    }
});

// Endpoint to create a new group
app.post('/tasks', (req, res) => {
    const { name } = req.body; // Get the group name from the request body
    let code = GenerateRandomCode(); // Generate a unique code

    const groups = loadGroups(); // Load existing groups

    // Ensure the code is unique
    while (groups.some(group => group.code === code)) {
        code = GenerateRandomCode(); // Regenerate if code already exists
    }

    const newGroup = {
        code,
        name // Do not include tasks in the group object
    };

    groups.push(newGroup); // Add the new group to the list
    saveGroups(groups); // Save the updated groups

    res.status(201).json({ code, name }); // Respond with the new group info
});

// Endpoint to add a task to a specific group
app.post('/tasks/:code/task', (req, res) => {
    const { code } = req.params;
    const { title, color_scheme, date, completed = false } = req.body; // Get task details

    const groups = loadGroups();
    const group = groups.find(g => g.code === code); // Find the group

    if (group) {
        const tasks = loadTasks(code); // Load existing tasks
        const newTask = { title, color_scheme, date, completed }; // Create new task object
        tasks.push(newTask); // Add the new task to the tasks array

        saveTasks(code, tasks); // Save the updated tasks for the group
        res.status(201).json(newTask); // Respond with the new task details
    } else {
        res.status(404).json({ error: 'Group not found' }); // Handle case where group is not found
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
