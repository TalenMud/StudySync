const pathSegments = window.location.pathname.split('/');
const code = pathSegments[pathSegments.length - 1]; // Extract the code from the current URL

function openSettings(){
    // Redirect to the settings view page
    window.location.href = `/settings/view/${code}`;

}

function saveSettings() {
    fetch('/tasks', {  // Correct the endpoint to /tasks
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: groupName }) 
    })
    .then(response => {
        if (response.status === 429) {
        return response.json().then(data => {
            throw new Error(data.error); // Pass the specific error message from backend
        });
    }
        if (!response.ok) {
            throw new Error('An error occurred. Please try again later.');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('codeDisplay').innerText = "Your code is: " + data.code;
        // Clear the input field after successful submission
        document.getElementById('groupNameInput').value = '';
    })
    .catch(error => {
        alert(error.message);
    });

}