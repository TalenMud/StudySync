function openSettings() {
    const pathSegments = window.location.pathname.split('/');
    const code = pathSegments[pathSegments.length - 1]; // Extract the code from the current URL
            // Redirect to the settings view page
 
            window.location.href = `/settings/view/${code}`;

}