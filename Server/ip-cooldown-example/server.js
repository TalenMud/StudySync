const { error } = require('console');
const express = require('express');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const groupsFilePath = path.join(__dirname, 'groups.json'); // File for groups
const tasksDir = path.join(__dirname, 'tasks'); // Directory for task files
const settingsDir = path.join(__dirname, 'settings');
const app = express();
const groupCreationLog = new Map(); // Map of userId -> [{ timestamp }]
const MaxGroups = 5; // Maximum allowed groups within 30 minutes
const THIRTY_MINUTES = 30 * 60 * 1000; // Milliseconds in 30 minutes
const defaultSettings = {
    notifications: false
};
// Example arrays for color schemes
const colorSchemes = [
    { name: "gray-black", hex: "#999794-#333" },
    { name: "blue-navy", hex: "#87CEFA-#1E3A5F" },
    { name: "green-olive", hex: "#8FBC8F-#556B2F" }
];

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

if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir); 
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

function saveSettings(code, settings) {
    const filePath = path.join(tasksDir, `${code}-settings.json`); // File path based on code
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2)); // Save tasks as JSON
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

function loadSettings(code) {
    const filePath = path.join(tasksDir, `${code}-settings.json`); // File path based on code
    if (fs.existsSync(filePath)) {
        try {
            const fileData = fs.readFileSync(filePath, 'utf-8'); // Read settings file
            return JSON.parse(fileData); // Parse and return settings if found
        } catch (error) {
            console.error(`Error reading settings for group ${code}:`, error);
            saveSettings(code, defaultSettings);
            return { ...defaultSettings }; // Return defaults if an error occurs
        }
    } else {
        // If the settings file doesn't exist, create it with default settings
        saveSettings(code, defaultSettings);
        return { ...defaultSettings }; 
    }
}


function logGroupCreation(req) {
    const now = Date.now();
    const ip = req.ip
    // Get existing log or initialize a new one
    let userLog = groupCreationLog.get(ip) || [];
    
    // Remove entries older than 30 minutes
    userLog = userLog.filter(timestamp => now - timestamp < THIRTY_MINUTES);
    
    // Add the new group creation time to the log
    userLog.push(now);
    
    // Update the map
    groupCreationLog.set(ip, userLog);
    
    // Return the count of groups created in the last 30 minutes
    return userLog.length;
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

app.get('/settings/view/:code', (req, res) => {
    const { code } = req.params;
    const settings = loadSettings(code); // Load tasks for the group
    const groups = loadGroups(); // Load all groups to find the specific group by code
    const group = groups.find(g => g.code === code); // Find the group object using the code
    
    if(group) {
        const currentColorScheme = colorSchemes.find(scheme => scheme.hex === settings.color_scheme) || colorSchemes[0];
        
        res.render('settings', {
            group,
            settings,
            colorSchemes,
            currentColorName: currentColorScheme.name // current color name
        });
    } else {
        res.status(404).send('Group not found');
    }
});

app.get('/settings/data/:code', (req, res) => {
    const { code } = req.params;
    const settings = loadSettings(code); // Load settings for the given code

    if (settings) {
        res.json(settings); // Send settings data as JSON
    } else {
        res.status(404).json({ error: 'Settings not found' }); // Return 404 if no settings exist
    }
});

app.post('/settings/update/:code', (req, res) => {
    const { code } = req.params;
    const { notifications } = req.body; // Get updated notifications value
    const settings = loadSettings(code); // Load current settings for the code

    // Update the notifications setting
    settings.notifications = notifications;

    //Change the colour scheme accordingly
   

    // Save the updated settings
    saveSettings(code, settings);

    res.json({ success: true, settings }); // Respond with updated settings
});

// Endpoint to create a new group
app.post('/tasks', (req, res) => {
    const { name } = req.body; // Get the group name from the request body
    let code = GenerateRandomCode(); // Generate a unique code
    const ip = req.ip

    const recentGroupCount = logGroupCreation(ip);

    if (recentGroupCount > MaxGroups){
        return res.status(429).json({error: 'Too many groups created. Try again later.'})
    }

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
