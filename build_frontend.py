import os
import subprocess
import shutil

print("Starting React frontend build process...")

# Change to the frontend directory
os.chdir('frontend')

# Install dependencies (if needed)
print("Installing frontend dependencies...")
subprocess.run(['npm', 'install'], check=True)

# Build the React app
print("Building React application...")
subprocess.run(['npm', 'run', 'build'], check=True)

# Check if the build directory exists
if os.path.exists('build'):
    # Create the static/js and static/css directories if they don't exist
    os.makedirs('../static/js', exist_ok=True)
    os.makedirs('../static/css', exist_ok=True)
    os.makedirs('../static/media', exist_ok=True)
    
    # Copy JS files
    for file in os.listdir('build/static/js'):
        if file.endswith('.js') or file.endswith('.js.map'):
            shutil.copy2(f'build/static/js/{file}', f'../static/js/{file}')
            print(f"Copied {file} to static/js/")
    
    # Copy CSS files
    for file in os.listdir('build/static/css'):
        if file.endswith('.css') or file.endswith('.css.map'):
            shutil.copy2(f'build/static/css/{file}', f'../static/css/{file}')
            print(f"Copied {file} to static/css/")
    
    # Copy media files if they exist
    if os.path.exists('build/static/media'):
        for file in os.listdir('build/static/media'):
            shutil.copy2(f'build/static/media/{file}', f'../static/media/{file}')
            print(f"Copied {file} to static/media/")
    
    # Copy the main index.html to our Flask templates directory
    shutil.copy2('build/index.html', '../templates/index.html')
    print("Copied index.html to templates/")
    
    # Copy other files in the build root (like favicon, manifest, etc.)
    for file in os.listdir('build'):
        if file != 'index.html' and file != 'static':
            shutil.copy2(f'build/{file}', f'../static/{file}')
            print(f"Copied {file} to static/")
    
    print("Frontend build process completed successfully!")
else:
    print("Error: Build directory not found. React build failed.")