
// Simplified React app bundle
// This is a temporary solution until we can get the full build process working

// Create React elements manually
const renderApp = () => {
    // Display a loading message
    document.getElementById('root').innerHTML = `
        <div style="font-family: 'Poppins', sans-serif; padding: 2rem; text-align: center;">
            <h1 style="color: #ff66b3; margin-bottom: 1rem;">Baby Pool App</h1>
            <p style="margin-bottom: 2rem;">Create and join baby shower prediction games!</p>
            
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #ff66b3; margin-bottom: 1rem;">Welcome!</h2>
                
                <div style="display: flex; flex-direction: column; gap: 1rem; margin: 2rem 0;">
                    <a href="/auth/host_login" style="text-decoration: none; background-color: #ff99cc; color: white; padding: 0.75rem 1.5rem; border-radius: 30px; font-weight: 500; box-shadow: 0 4px 8px rgba(255, 153, 204, 0.3); transition: all 0.3s ease;">Login as Host</a>
                    <a href="/auth/guest_login" style="text-decoration: none; background-color: #99ccff; color: #333; padding: 0.75rem 1.5rem; border-radius: 30px; font-weight: 500; box-shadow: 0 4px 8px rgba(153, 204, 255, 0.3); transition: all 0.3s ease;">Join as Guest</a>
                    <div style="margin: 1rem 0; position: relative; text-align: center;">
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 0; position: absolute; top: 50%; width: 100%;">
                        <span style="background: white; padding: 0 10px; position: relative; color: #888;">or</span>
                    </div>
                    <a href="/google_auth/google_login" style="text-decoration: none; display: flex; align-items: center; justify-content: center; background-color: white; border: 1px solid #ddd; color: #444; padding: 0.75rem 1.5rem; border-radius: 30px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google Logo" style="height: 20px; margin-right: 10px;">
                        Sign in with Google
                    </a>
                </div>
                
                <div style="margin-top: 2rem;">
                    <h3 style="font-size: 1.2rem; color: #ff66b3; margin-bottom: 1rem;">Features</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; text-align: center;">
                        <div style="padding: 1rem; border-radius: 8px; background-color: #f8f9fa;">
                            <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">Date & Time Guessing</h4>
                            <p style="font-size: 0.9rem; color: #666;">Predict when the baby will arrive!</p>
                        </div>
                        <div style="padding: 1rem; border-radius: 8px; background-color: #f8f9fa;">
                            <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">Name Suggestions</h4>
                            <p style="font-size: 0.9rem; color: #666;">Guess the baby's name!</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <footer style="margin-top: 3rem; font-size: 0.9rem; color: #666;">
                &copy; 2025 Baby Pool App
            </footer>
        </div>
    `;

    // Add event listeners
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('mouseenter', (e) => {
            e.target.style.transform = 'translateY(-2px)';
            if (e.target.textContent.includes('Host')) {
                e.target.style.backgroundColor = '#ff66b3';
            } else if (e.target.textContent.includes('Guest')) {
                e.target.style.backgroundColor = '#66b3ff';
            } else if (e.target.textContent.includes('Google')) {
                e.target.style.backgroundColor = '#f8f8f8';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }
        });
        
        link.addEventListener('mouseleave', (e) => {
            e.target.style.transform = 'translateY(0)';
            if (e.target.textContent.includes('Host')) {
                e.target.style.backgroundColor = '#ff99cc';
            } else if (e.target.textContent.includes('Guest')) {
                e.target.style.backgroundColor = '#99ccff';
            } else if (e.target.textContent.includes('Google')) {
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }
        });
    });
};

// Call the render function when the DOM is loaded
document.addEventListener('DOMContentLoaded', renderApp);
