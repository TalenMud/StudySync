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

document.addEventListener("DOMContentLoaded", () => {
    const colorSchemes = window.colorSchemes; // Array of color schemes
    let currentColorIndex = colorSchemes.findIndex(scheme => scheme.name === window.currentColorName); // Start at current scheme

    const colorSchemeNameEl = document.getElementById("colorSchemeName");
    const prevColorBtn = document.getElementById("prevColorBtn");
    const nextColorBtn = document.getElementById("nextColorBtn");

    function applyColorScheme(index) {
        const scheme = colorSchemes[index];
        const [backgroundColor, textColor] = scheme.hex.split('-');
        document.body.style.backgroundColor = backgroundColor;
        document.body.style.color = textColor;
        colorSchemeNameEl.innerText = scheme.name;
    }

    // Initial color scheme application
    applyColorScheme(currentColorIndex);

    // Event listeners for buttons
    prevColorBtn.addEventListener("click", () => {
        currentColorIndex = (currentColorIndex - 1 + colorSchemes.length) % colorSchemes.length;
        applyColorScheme(currentColorIndex);
    });

    nextColorBtn.addEventListener("click", () => {
        currentColorIndex = (currentColorIndex + 1) % colorSchemes.length;
        applyColorScheme(currentColorIndex);
    });
});