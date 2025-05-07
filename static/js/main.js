// This is a placeholder file that will be replaced by the React build process
console.log('React app loading...');

// Create a temporary loading indicator until the React app loads
document.addEventListener('DOMContentLoaded', function() {
    const root = document.getElementById('root');
    
    if (root) {
        const loadingEl = document.createElement('div');
        loadingEl.style.textAlign = 'center';
        loadingEl.style.padding = '40px';
        loadingEl.style.fontFamily = 'Poppins, sans-serif';
        
        const titleEl = document.createElement('h1');
        titleEl.textContent = 'Baby Pool App';
        titleEl.style.color = '#ff66b3';
        titleEl.style.marginBottom = '20px';
        
        const spinnerEl = document.createElement('div');
        spinnerEl.innerHTML = 'Loading application...';
        spinnerEl.style.fontSize = '18px';
        spinnerEl.style.color = '#666';
        
        loadingEl.appendChild(titleEl);
        loadingEl.appendChild(spinnerEl);
        root.appendChild(loadingEl);
    }
});