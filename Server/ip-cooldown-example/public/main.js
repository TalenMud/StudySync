let clickCount = 0;
const maxClicks = 5; // Set the maximum number of allowed clicks

function GenerateRandomCode(length = 8) {
    // Define characters that are included: letters, numbers, and special characters
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}<>?';
    let code = '';

    if (clickCount >= maxClicks) { //make sure they don't spam
        alert("You have reached the maximum number of code generations.");
        return;
    }
    
    clickCount++;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
    
        code += characters[randomIndex];
    }
    return code;
    
}
module.exports = { GenerateRandomCode }; // Export the function
