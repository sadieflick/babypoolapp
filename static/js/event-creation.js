document.addEventListener('DOMContentLoaded', function() {
    // Find the root element
    const eventCreationRoot = document.getElementById('event-creation-root');
    
    // Step state
    let currentStep = 1;
    const totalSteps = 6;
    
    // Form data
    const formData = {
        title: '',
        mother_name: '',
        partner_name: '',
        event_date: '',
        due_date: '',
        show_host_email: false,
        shower_link: '',
        guess_price: 1.0,
        image_file: null,
        theme: 'default',
        theme_mode: 'light',
        guest_emails: [],
        venmo_username: '',
        venmo_phone_last4: '',
        name_game_enabled: false,
        baby_name_chosen: false,
        baby_name: ''
    };
    
    // Initialize the form
    renderForm();
    
    /**
     * Render the current form step
     */
    function renderForm() {
        // Clear the container
        eventCreationRoot.innerHTML = '';
        
        // Create form card
        const formCard = document.createElement('div');
        formCard.className = 'form-card';
        
        // Add step indicator
        formCard.appendChild(createStepIndicator());
        
        // Add error message area
        const errorMsg = document.createElement('div');
        errorMsg.id = 'error-message';
        errorMsg.className = 'alert alert-danger d-none';
        formCard.appendChild(errorMsg);
        
        // Add current step content
        const stepContent = document.createElement('form');
        stepContent.id = 'event-form';
        stepContent.noValidate = true;
        
        switch (currentStep) {
            case 1:
                stepContent.appendChild(renderBasicInfoStep());
                break;
            case 2:
                stepContent.appendChild(renderImageStep());
                break;
            case 3:
                stepContent.appendChild(renderThemeStep());
                break;
            case 4:
                stepContent.appendChild(renderGuestsStep());
                break;
            case 5:
                stepContent.appendChild(renderVenmoStep());
                break;
            case 6:
                stepContent.appendChild(renderNameGameStep());
                break;
            default:
                stepContent.innerHTML = '<p>Unknown step</p>';
        }
        
        // Add navigation buttons
        const btnGroup = document.createElement('div');
        btnGroup.className = 'd-flex justify-content-between mt-4';
        
        if (currentStep > 1) {
            const backBtn = document.createElement('button');
            backBtn.type = 'button';
            backBtn.className = 'btn btn-outline-secondary';
            backBtn.textContent = 'Back';
            backBtn.addEventListener('click', prevStep);
            btnGroup.appendChild(backBtn);
        } else {
            // Empty div for flex spacing
            btnGroup.appendChild(document.createElement('div'));
        }
        
        if (currentStep < totalSteps) {
            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'btn btn-primary';
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', nextStep);
            btnGroup.appendChild(nextBtn);
        } else {
            const submitBtn = document.createElement('button');
            submitBtn.type = 'button';
            submitBtn.className = 'btn btn-primary';
            submitBtn.textContent = 'Create Event';
            submitBtn.addEventListener('click', submitForm);
            btnGroup.appendChild(submitBtn);
        }
        
        stepContent.appendChild(btnGroup);
        formCard.appendChild(stepContent);
        eventCreationRoot.appendChild(formCard);
        
        // Add event listeners
        setupEventListeners();
    }
    
    /**
     * Create step indicator dots
     */
    function createStepIndicator() {
        const stepIndicator = document.createElement('div');
        stepIndicator.className = 'step-indicator';
        
        for (let i = 1; i <= totalSteps; i++) {
            const dot = document.createElement('div');
            dot.className = `step-dot ${i <= currentStep ? 'active' : ''}`;
            stepIndicator.appendChild(dot);
        }
        
        return stepIndicator;
    }
    
    /**
     * Render the basic info step (step 1)
     */
    function renderBasicInfoStep() {
        const fragment = document.createDocumentFragment();
        
        // Title
        const stepTitle = document.createElement('h2');
        stepTitle.textContent = 'Event Details';
        stepTitle.className = 'mb-4';
        fragment.appendChild(stepTitle);
        
        // Mother's name
        const motherGroup = document.createElement('div');
        motherGroup.className = 'form-group';
        
        const motherLabel = document.createElement('label');
        motherLabel.htmlFor = 'mother-name';
        motherLabel.textContent = "Mother-to-be's Name*";
        motherGroup.appendChild(motherLabel);
        
        const motherInput = document.createElement('input');
        motherInput.type = 'text';
        motherInput.className = 'form-control';
        motherInput.id = 'mother-name';
        motherInput.required = true;
        motherInput.placeholder = "Enter mother's name";
        motherInput.value = formData.mother_name;
        motherGroup.appendChild(motherInput);
        
        fragment.appendChild(motherGroup);
        
        // Partner's name
        const partnerGroup = document.createElement('div');
        partnerGroup.className = 'form-group';
        
        const partnerLabel = document.createElement('label');
        partnerLabel.htmlFor = 'partner-name';
        partnerLabel.textContent = "Partner's Name (Optional)";
        partnerGroup.appendChild(partnerLabel);
        
        const partnerInput = document.createElement('input');
        partnerInput.type = 'text';
        partnerInput.className = 'form-control';
        partnerInput.id = 'partner-name';
        partnerInput.placeholder = "Enter partner's name";
        partnerInput.value = formData.partner_name;
        partnerGroup.appendChild(partnerInput);
        
        fragment.appendChild(partnerGroup);
        
        // Event title
        const titleGroup = document.createElement('div');
        titleGroup.className = 'form-group';
        
        const titleLabel = document.createElement('label');
        titleLabel.htmlFor = 'event-title';
        titleLabel.textContent = "Event Title";
        titleGroup.appendChild(titleLabel);
        
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'form-control';
        titleInput.id = 'event-title';
        titleInput.placeholder = formData.mother_name ? `${formData.mother_name}'s Baby Shower` : "Enter event title";
        titleInput.value = formData.title;
        titleGroup.appendChild(titleInput);
        
        const titleHelp = document.createElement('small');
        titleHelp.className = 'form-text';
        titleHelp.textContent = "If left blank, we'll use \"[Mother's Name]'s Baby Shower\"";
        titleGroup.appendChild(titleHelp);
        
        fragment.appendChild(titleGroup);
        
        // Event date and Due date
        const dateRow = document.createElement('div');
        dateRow.className = 'row';
        
        // Event date
        const eventDateCol = document.createElement('div');
        eventDateCol.className = 'col-md-6';
        
        const eventDateGroup = document.createElement('div');
        eventDateGroup.className = 'form-group';
        
        const eventDateLabel = document.createElement('label');
        eventDateLabel.htmlFor = 'event-date';
        eventDateLabel.textContent = "Event Date*";
        eventDateGroup.appendChild(eventDateLabel);
        
        const eventDateInput = document.createElement('input');
        eventDateInput.type = 'date';
        eventDateInput.className = 'form-control';
        eventDateInput.id = 'event-date';
        eventDateInput.required = true;
        eventDateInput.value = formData.event_date;
        eventDateGroup.appendChild(eventDateInput);
        
        eventDateCol.appendChild(eventDateGroup);
        dateRow.appendChild(eventDateCol);
        
        // Due date
        const dueDateCol = document.createElement('div');
        dueDateCol.className = 'col-md-6';
        
        const dueDateGroup = document.createElement('div');
        dueDateGroup.className = 'form-group';
        
        const dueDateLabel = document.createElement('label');
        dueDateLabel.htmlFor = 'due-date';
        dueDateLabel.textContent = "Baby Due Date*";
        dueDateGroup.appendChild(dueDateLabel);
        
        const dueDateInput = document.createElement('input');
        dueDateInput.type = 'date';
        dueDateInput.className = 'form-control';
        dueDateInput.id = 'due-date';
        dueDateInput.required = true;
        dueDateInput.value = formData.due_date;
        dueDateGroup.appendChild(dueDateInput);
        
        dueDateCol.appendChild(dueDateGroup);
        dateRow.appendChild(dueDateCol);
        
        fragment.appendChild(dateRow);
        
        // Guess price
        const priceGroup = document.createElement('div');
        priceGroup.className = 'form-group';
        
        const priceLabel = document.createElement('label');
        priceLabel.htmlFor = 'guess-price';
        priceLabel.textContent = "How much will guests contribute for each guess? ($)*";
        priceGroup.appendChild(priceLabel);
        
        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.className = 'form-control';
        priceInput.id = 'guess-price';
        priceInput.min = '0.01';
        priceInput.step = '0.01';
        priceInput.required = true;
        priceInput.value = formData.guess_price;
        priceGroup.appendChild(priceInput);
        
        fragment.appendChild(priceGroup);
        
        // Shower link
        const linkGroup = document.createElement('div');
        linkGroup.className = 'form-group';
        
        const linkLabel = document.createElement('label');
        linkLabel.htmlFor = 'shower-link';
        linkLabel.textContent = "Link to Baby Shower Website (Optional)";
        linkGroup.appendChild(linkLabel);
        
        const linkInput = document.createElement('input');
        linkInput.type = 'url';
        linkInput.className = 'form-control';
        linkInput.id = 'shower-link';
        linkInput.placeholder = "https://example.com";
        linkInput.value = formData.shower_link;
        linkGroup.appendChild(linkInput);
        
        fragment.appendChild(linkGroup);
        
        // Show host email toggle
        const emailToggleGroup = document.createElement('div');
        emailToggleGroup.className = 'form-group toggle-switch';
        
        const emailToggleLabel = document.createElement('label');
        emailToggleLabel.htmlFor = 'show-host-email';
        emailToggleLabel.textContent = "Show your email to guests";
        emailToggleGroup.appendChild(emailToggleLabel);
        
        const switchLabel = document.createElement('label');
        switchLabel.className = 'switch';
        
        const emailToggleInput = document.createElement('input');
        emailToggleInput.type = 'checkbox';
        emailToggleInput.id = 'show-host-email';
        emailToggleInput.checked = formData.show_host_email;
        switchLabel.appendChild(emailToggleInput);
        
        const slider = document.createElement('span');
        slider.className = 'slider';
        switchLabel.appendChild(slider);
        
        emailToggleGroup.appendChild(switchLabel);
        
        fragment.appendChild(emailToggleGroup);
        
        return fragment;
    }
    
    /**
     * Render the image upload step (step 2)
     */
    function renderImageStep() {
        const fragment = document.createDocumentFragment();
        
        // Title
        const stepTitle = document.createElement('h2');
        stepTitle.textContent = 'Choose a Picture';
        stepTitle.className = 'mb-2';
        fragment.appendChild(stepTitle);
        
        // Subtitle
        const stepSubtitle = document.createElement('p');
        stepSubtitle.textContent = 'Upload a picture of the mother-to-be or the couple (optional)';
        stepSubtitle.className = 'text-muted mb-4';
        fragment.appendChild(stepSubtitle);
        
        // Image upload
        const imageGroup = document.createElement('div');
        imageGroup.className = 'form-group';
        
        // Preview area (if image selected)
        if (formData.image_file) {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'image-preview mb-3';
            
            const previewImg = document.createElement('img');
            previewImg.id = 'image-preview';
            previewImg.alt = 'Preview';
            previewImg.src = URL.createObjectURL(formData.image_file);
            
            previewDiv.appendChild(previewImg);
            imageGroup.appendChild(previewDiv);
        }
        
        // File input
        const imageLabel = document.createElement('label');
        imageLabel.htmlFor = 'event-image';
        imageLabel.className = 'form-label';
        imageLabel.textContent = 'Upload an image:';
        imageGroup.appendChild(imageLabel);
        
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.className = 'form-control';
        imageInput.id = 'event-image';
        imageInput.accept = 'image/jpeg,image/png,image/gif';
        imageGroup.appendChild(imageInput);
        
        // Help text
        const imageHelp = document.createElement('small');
        imageHelp.className = 'form-text mt-2';
        imageHelp.textContent = 'Recommended size: 800x600 pixels or larger. Max file size: 5MB.';
        imageGroup.appendChild(imageHelp);
        
        fragment.appendChild(imageGroup);
        
        // Skip note
        const skipNote = document.createElement('p');
        skipNote.className = 'text-muted mt-4';
        skipNote.textContent = 'You can skip this step if you don\'t have an image to upload right now.';
        fragment.appendChild(skipNote);
        
        return fragment;
    }
    
    /**
     * Render the theme selection step (step 3)
     */
    function renderThemeStep() {
        const fragment = document.createDocumentFragment();
        
        // Title
        const stepTitle = document.createElement('h2');
        stepTitle.textContent = 'Choose a Theme';
        stepTitle.className = 'mb-4';
        fragment.appendChild(stepTitle);
        
        // Theme selection
        const themes = [
            { id: 'default', name: 'Baby Shower (Default)', colors: ['#ff99cc', '#99ccff', '#ffffff'] },
            { id: 'baby-blue', name: 'Baby Blue', colors: ['#99ccff', '#66b3ff', '#cce6ff'] },
            { id: 'baby-pink', name: 'Baby Pink', colors: ['#ff99cc', '#ff66b3', '#ffcce6'] },
            { id: 'mint', name: 'Mint', colors: ['#66ccb8', '#4dbca6', '#a3e2d7'] },
            { id: 'lavender', name: 'Lavender', colors: ['#b39ddb', '#9575cd', '#d1c4e9'] }
        ];
        
        const themeContainer = document.createElement('div');
        themeContainer.className = 'theme-container mb-4';
        
        for (const theme of themes) {
            const themeCard = document.createElement('div');
            themeCard.className = `theme-card mb-3 p-3 border rounded ${formData.theme === theme.id ? 'border-primary' : ''}`;
            themeCard.dataset.theme = theme.id;
            
            const themeHeader = document.createElement('div');
            themeHeader.className = 'd-flex justify-content-between align-items-center';
            
            const themeName = document.createElement('h5');
            themeName.className = 'mb-0';
            themeName.textContent = theme.name;
            themeHeader.appendChild(themeName);
            
            const themeRadio = document.createElement('input');
            themeRadio.type = 'radio';
            themeRadio.name = 'theme';
            themeRadio.value = theme.id;
            themeRadio.checked = formData.theme === theme.id;
            themeRadio.className = 'form-check-input';
            themeHeader.appendChild(themeRadio);
            
            themeCard.appendChild(themeHeader);
            
            // Color preview
            const colorPreview = document.createElement('div');
            colorPreview.className = 'd-flex mt-2';
            
            for (const color of theme.colors) {
                const colorSwatch = document.createElement('div');
                colorSwatch.className = 'color-swatch me-2';
                colorSwatch.style.width = '20px';
                colorSwatch.style.height = '20px';
                colorSwatch.style.backgroundColor = color;
                colorSwatch.style.borderRadius = '50%';
                colorPreview.appendChild(colorSwatch);
            }
            
            themeCard.appendChild(colorPreview);
            themeContainer.appendChild(themeCard);
        }
        
        fragment.appendChild(themeContainer);
        
        // Theme mode
        const modeGroup = document.createElement('div');
        modeGroup.className = 'form-group';
        
        const modeLabel = document.createElement('label');
        modeLabel.htmlFor = 'theme-mode';
        modeLabel.textContent = 'Default Display Mode';
        modeGroup.appendChild(modeLabel);
        
        const modeSelect = document.createElement('select');
        modeSelect.className = 'form-select';
        modeSelect.id = 'theme-mode';
        
        const lightOption = document.createElement('option');
        lightOption.value = 'light';
        lightOption.textContent = 'Light Mode';
        lightOption.selected = formData.theme_mode === 'light';
        modeSelect.appendChild(lightOption);
        
        const darkOption = document.createElement('option');
        darkOption.value = 'dark';
        darkOption.textContent = 'Dark Mode';
        darkOption.selected = formData.theme_mode === 'dark';
        modeSelect.appendChild(darkOption);
        
        modeGroup.appendChild(modeSelect);
        
        fragment.appendChild(modeGroup);
        
        // Skip note
        const skipNote = document.createElement('p');
        skipNote.className = 'text-muted mt-4';
        skipNote.textContent = 'You can skip this step or change your theme later in the event settings.';
        fragment.appendChild(skipNote);
        
        return fragment;
    }
    
    /**
     * Render the guests input step (step 4)
     */
    function renderGuestsStep() {
        const fragment = document.createDocumentFragment();
        
        // Title
        const stepTitle = document.createElement('h2');
        stepTitle.textContent = 'Enter Guests';
        stepTitle.className = 'mb-2';
        fragment.appendChild(stepTitle);
        
        // Subtitle
        const stepSubtitle = document.createElement('p');
        stepSubtitle.textContent = 'Enter guest emails (optional)';
        stepSubtitle.className = 'text-muted mb-4';
        fragment.appendChild(stepSubtitle);
        
        // Guest emails
        const guestGroup = document.createElement('div');
        guestGroup.className = 'form-group';
        
        const guestLabel = document.createElement('label');
        guestLabel.htmlFor = 'guest-emails';
        guestLabel.textContent = 'Guest Emails';
        guestGroup.appendChild(guestLabel);
        
        const guestTextarea = document.createElement('textarea');
        guestTextarea.className = 'form-control';
        guestTextarea.id = 'guest-emails';
        guestTextarea.rows = 4;
        guestTextarea.placeholder = 'Enter emails separated by commas or new lines';
        guestTextarea.value = formData.guest_emails.join(', ');
        guestGroup.appendChild(guestTextarea);
        
        const guestHelp = document.createElement('small');
        guestHelp.className = 'form-text';
        guestHelp.textContent = 'Note: Guests can also find your event and enter their own information';
        guestGroup.appendChild(guestHelp);
        
        fragment.appendChild(guestGroup);
        
        // Guest list preview
        if (formData.guest_emails.length > 0) {
            const previewContainer = document.createElement('div');
            previewContainer.className = 'guest-preview mt-4';
            
            const previewTitle = document.createElement('h5');
            previewTitle.textContent = 'Guest List Preview';
            previewContainer.appendChild(previewTitle);
            
            const guestList = document.createElement('ul');
            guestList.className = 'list-group';
            
            for (const email of formData.guest_emails) {
                const guestItem = document.createElement('li');
                guestItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                const emailText = document.createElement('span');
                emailText.textContent = email;
                guestItem.appendChild(emailText);
                
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-sm btn-outline-danger';
                removeBtn.textContent = '×';
                removeBtn.dataset.email = email;
                removeBtn.addEventListener('click', function() {
                    removeGuest(email);
                });
                guestItem.appendChild(removeBtn);
                
                guestList.appendChild(guestItem);
            }
            
            previewContainer.appendChild(guestList);
            fragment.appendChild(previewContainer);
        }
        
        // Skip note
        const skipNote = document.createElement('p');
        skipNote.className = 'text-muted mt-4';
        skipNote.textContent = 'You can skip this step and add guests later.';
        fragment.appendChild(skipNote);
        
        return fragment;
    }
    
    /**
     * Render the Venmo details step (step 5)
     */
    function renderVenmoStep() {
        const fragment = document.createDocumentFragment();
        
        // Title
        const stepTitle = document.createElement('h2');
        stepTitle.textContent = 'Have Guests Venmo You';
        stepTitle.className = 'mb-2';
        fragment.appendChild(stepTitle);
        
        // Subtitle
        const stepSubtitle = document.createElement('p');
        stepSubtitle.textContent = 'Set up payment information (optional)';
        stepSubtitle.className = 'text-muted mb-4';
        fragment.appendChild(stepSubtitle);
        
        // Venmo username
        const usernameGroup = document.createElement('div');
        usernameGroup.className = 'form-group';
        
        const usernameLabel = document.createElement('label');
        usernameLabel.htmlFor = 'venmo-username';
        usernameLabel.textContent = 'Your Venmo Username';
        usernameGroup.appendChild(usernameLabel);
        
        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.className = 'form-control';
        usernameInput.id = 'venmo-username';
        usernameInput.placeholder = 'Enter your Venmo username';
        usernameInput.value = formData.venmo_username;
        usernameGroup.appendChild(usernameInput);
        
        fragment.appendChild(usernameGroup);
        
        // Last 4 digits
        const phoneGroup = document.createElement('div');
        phoneGroup.className = 'form-group';
        
        const phoneLabel = document.createElement('label');
        phoneLabel.htmlFor = 'venmo-phone';
        phoneLabel.textContent = 'Last 4 Digits of Your Phone Number';
        phoneGroup.appendChild(phoneLabel);
        
        const phoneInput = document.createElement('input');
        phoneInput.type = 'text';
        phoneInput.className = 'form-control';
        phoneInput.id = 'venmo-phone';
        phoneInput.placeholder = 'Enter last 4 digits';
        phoneInput.maxLength = 4;
        phoneInput.pattern = '\\d{4}';
        phoneInput.value = formData.venmo_phone_last4;
        phoneGroup.appendChild(phoneInput);
        
        const phoneHelp = document.createElement('small');
        phoneHelp.className = 'form-text';
        phoneHelp.textContent = 'Required if you entered a Venmo username';
        phoneGroup.appendChild(phoneHelp);
        
        fragment.appendChild(phoneGroup);
        
        // Venmo QR code upload (future feature)
        const qrNote = document.createElement('div');
        qrNote.className = 'alert alert-info mt-3';
        qrNote.innerHTML = '<strong>Coming Soon:</strong> Upload your Venmo QR code for easier payments.';
        fragment.appendChild(qrNote);
        
        // Skip note
        const skipNote = document.createElement('p');
        skipNote.className = 'text-muted mt-4';
        skipNote.textContent = 'You can skip this step and add payment information later.';
        fragment.appendChild(skipNote);
        
        return fragment;
    }
    
    /**
     * Render the baby name game step (step 6)
     */
    function renderNameGameStep() {
        const fragment = document.createDocumentFragment();
        
        // Title
        const stepTitle = document.createElement('h2');
        stepTitle.textContent = 'Add Baby Name Game';
        stepTitle.className = 'mb-2';
        fragment.appendChild(stepTitle);
        
        // Subtitle
        const stepSubtitle = document.createElement('p');
        stepSubtitle.textContent = 'Let guests suggest names for the baby or guess the chosen name that hasn\'t been revealed yet.';
        stepSubtitle.className = 'text-muted mb-4';
        fragment.appendChild(stepSubtitle);
        
        // Enable name game toggle
        const nameGameToggleGroup = document.createElement('div');
        nameGameToggleGroup.className = 'form-group toggle-switch';
        
        const nameGameToggleLabel = document.createElement('label');
        nameGameToggleLabel.htmlFor = 'name-game-enabled';
        nameGameToggleLabel.textContent = 'Enable Name Game';
        nameGameToggleGroup.appendChild(nameGameToggleLabel);
        
        const switchLabel = document.createElement('label');
        switchLabel.className = 'switch';
        
        const nameGameToggleInput = document.createElement('input');
        nameGameToggleInput.type = 'checkbox';
        nameGameToggleInput.id = 'name-game-enabled';
        nameGameToggleInput.checked = formData.name_game_enabled;
        switchLabel.appendChild(nameGameToggleInput);
        
        const slider = document.createElement('span');
        slider.className = 'slider';
        switchLabel.appendChild(slider);
        
        nameGameToggleGroup.appendChild(switchLabel);
        
        fragment.appendChild(nameGameToggleGroup);
        
        // Conditional fields based on name game toggle
        const conditionalFields = document.createElement('div');
        conditionalFields.id = 'name-game-fields';
        conditionalFields.className = formData.name_game_enabled ? 'mt-4' : 'mt-4 d-none';
        
        // Radio buttons for name chosen
        const nameChosenGroup = document.createElement('div');
        nameChosenGroup.className = 'form-group';
        
        const nameChosenLabel = document.createElement('label');
        nameChosenLabel.textContent = 'Do the parents already have a name for the baby?';
        nameChosenGroup.appendChild(nameChosenLabel);
        
        const radioGroup = document.createElement('div');
        radioGroup.className = 'mt-2';
        
        // Yes option
        const yesRadioDiv = document.createElement('div');
        yesRadioDiv.className = 'form-check';
        
        const yesRadio = document.createElement('input');
        yesRadio.type = 'radio';
        yesRadio.className = 'form-check-input';
        yesRadio.id = 'name-chosen-yes';
        yesRadio.name = 'name-chosen';
        yesRadio.value = 'yes';
        yesRadio.checked = formData.baby_name_chosen;
        yesRadioDiv.appendChild(yesRadio);
        
        const yesLabel = document.createElement('label');
        yesLabel.className = 'form-check-label';
        yesLabel.htmlFor = 'name-chosen-yes';
        yesLabel.textContent = 'Yes';
        yesRadioDiv.appendChild(yesLabel);
        
        radioGroup.appendChild(yesRadioDiv);
        
        // No option
        const noRadioDiv = document.createElement('div');
        noRadioDiv.className = 'form-check';
        
        const noRadio = document.createElement('input');
        noRadio.type = 'radio';
        noRadio.className = 'form-check-input';
        noRadio.id = 'name-chosen-no';
        noRadio.name = 'name-chosen';
        noRadio.value = 'no';
        noRadio.checked = !formData.baby_name_chosen;
        noRadioDiv.appendChild(noRadio);
        
        const noLabel = document.createElement('label');
        noLabel.className = 'form-check-label';
        noLabel.htmlFor = 'name-chosen-no';
        noLabel.textContent = 'No';
        noRadioDiv.appendChild(noLabel);
        
        radioGroup.appendChild(noRadioDiv);
        nameChosenGroup.appendChild(radioGroup);
        
        conditionalFields.appendChild(nameChosenGroup);
        
        // Baby name field (if name chosen)
        const babyNameGroup = document.createElement('div');
        babyNameGroup.id = 'baby-name-field';
        babyNameGroup.className = formData.baby_name_chosen ? 'form-group mt-3' : 'form-group mt-3 d-none';
        
        const babyNameLabel = document.createElement('label');
        babyNameLabel.htmlFor = 'baby-name';
        babyNameLabel.textContent = "Enter the baby's chosen name";
        babyNameGroup.appendChild(babyNameLabel);
        
        const babyNameInput = document.createElement('input');
        babyNameInput.type = 'text';
        babyNameInput.className = 'form-control';
        babyNameInput.id = 'baby-name';
        babyNameInput.placeholder = "Enter baby's name";
        babyNameInput.value = formData.baby_name;
        babyNameGroup.appendChild(babyNameInput);
        
        conditionalFields.appendChild(babyNameGroup);
        
        fragment.appendChild(conditionalFields);
        
        // Skip note
        const skipNote = document.createElement('p');
        skipNote.className = 'text-muted mt-4';
        skipNote.textContent = 'You can skip this step or enable the name game later in your event settings.';
        fragment.appendChild(skipNote);
        
        return fragment;
    }
    
    /**
     * Set up event listeners for the current step
     */
    function setupEventListeners() {
        // Step 1 - Basic Info
        if (currentStep === 1) {
            document.getElementById('mother-name')?.addEventListener('input', e => {
                formData.mother_name = e.target.value;
                // Update event title placeholder
                const titleInput = document.getElementById('event-title');
                if (titleInput) {
                    titleInput.placeholder = e.target.value ? `${e.target.value}'s Baby Shower` : "Enter event title";
                }
            });
            
            document.getElementById('partner-name')?.addEventListener('input', e => {
                formData.partner_name = e.target.value;
            });
            
            document.getElementById('event-title')?.addEventListener('input', e => {
                formData.title = e.target.value;
            });
            
            document.getElementById('event-date')?.addEventListener('input', e => {
                formData.event_date = e.target.value;
            });
            
            document.getElementById('due-date')?.addEventListener('input', e => {
                formData.due_date = e.target.value;
            });
            
            document.getElementById('guess-price')?.addEventListener('input', e => {
                formData.guess_price = parseFloat(e.target.value) || 1.0;
            });
            
            document.getElementById('shower-link')?.addEventListener('input', e => {
                formData.shower_link = e.target.value;
            });
            
            document.getElementById('show-host-email')?.addEventListener('change', e => {
                formData.show_host_email = e.target.checked;
            });
        }
        
        // Step 2 - Image Upload
        if (currentStep === 2) {
            document.getElementById('event-image')?.addEventListener('change', e => {
                const file = e.target.files[0];
                if (file) {
                    formData.image_file = file;
                    renderForm(); // Re-render to show preview
                }
            });
        }
        
        // Step 3 - Theme Selection
        if (currentStep === 3) {
            // Theme cards
            document.querySelectorAll('.theme-card').forEach(card => {
                card.addEventListener('click', e => {
                    const themeId = card.dataset.theme;
                    formData.theme = themeId;
                    
                    // Update radio button
                    const radio = card.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                    }
                    
                    // Update styles
                    document.querySelectorAll('.theme-card').forEach(c => {
                        c.classList.remove('border-primary');
                    });
                    card.classList.add('border-primary');
                });
            });
            
            // Theme mode select
            document.getElementById('theme-mode')?.addEventListener('change', e => {
                formData.theme_mode = e.target.value;
            });
        }
        
        // Step 4 - Guest Emails
        if (currentStep === 4) {
            document.getElementById('guest-emails')?.addEventListener('input', e => {
                const value = e.target.value;
                
                // Parse emails
                if (value) {
                    let emails = [];
                    
                    if (value.includes(',')) {
                        emails = value.split(',').map(email => email.trim()).filter(Boolean);
                    } else {
                        emails = value.split(/\n/).map(email => email.trim()).filter(Boolean);
                    }
                    
                    formData.guest_emails = emails;
                } else {
                    formData.guest_emails = [];
                }
            });
        }
        
        // Step 5 - Venmo Details
        if (currentStep === 5) {
            document.getElementById('venmo-username')?.addEventListener('input', e => {
                formData.venmo_username = e.target.value;
            });
            
            document.getElementById('venmo-phone')?.addEventListener('input', e => {
                formData.venmo_phone_last4 = e.target.value;
            });
        }
        
        // Step 6 - Baby Name Game
        if (currentStep === 6) {
            document.getElementById('name-game-enabled')?.addEventListener('change', e => {
                formData.name_game_enabled = e.target.checked;
                
                // Show/hide conditional fields
                const conditionalFields = document.getElementById('name-game-fields');
                if (conditionalFields) {
                    conditionalFields.className = e.target.checked ? 'mt-4' : 'mt-4 d-none';
                }
            });
            
            document.getElementById('name-chosen-yes')?.addEventListener('change', e => {
                if (e.target.checked) {
                    formData.baby_name_chosen = true;
                    
                    // Show baby name field
                    const babyNameField = document.getElementById('baby-name-field');
                    if (babyNameField) {
                        babyNameField.className = 'form-group mt-3';
                    }
                }
            });
            
            document.getElementById('name-chosen-no')?.addEventListener('change', e => {
                if (e.target.checked) {
                    formData.baby_name_chosen = false;
                    
                    // Hide baby name field
                    const babyNameField = document.getElementById('baby-name-field');
                    if (babyNameField) {
                        babyNameField.className = 'form-group mt-3 d-none';
                    }
                }
            });
            
            document.getElementById('baby-name')?.addEventListener('input', e => {
                formData.baby_name = e.target.value;
            });
        }
    }
    
    /**
     * Handle moving to the next step
     */
    function nextStep() {
        // Validate current step
        if (!validateCurrentStep()) {
            return;
        }
        
        currentStep = Math.min(currentStep + 1, totalSteps);
        renderForm();
    }
    
    /**
     * Handle moving to the previous step
     */
    function prevStep() {
        currentStep = Math.max(currentStep - 1, 1);
        renderForm();
    }
    
    /**
     * Remove a guest email from the list
     */
    function removeGuest(email) {
        formData.guest_emails = formData.guest_emails.filter(e => e !== email);
        renderForm();
    }
    
    /**
     * Validate the current step's inputs
     */
    function validateCurrentStep() {
        const errorMsg = document.getElementById('error-message');
        
        // Reset error message
        errorMsg.textContent = '';
        errorMsg.classList.add('d-none');
        
        // Step 1 validation
        if (currentStep === 1) {
            // Mother's name is required
            const motherName = document.getElementById('mother-name')?.value;
            if (!motherName || motherName.trim() === '') {
                showError("Mother-to-be's name is required");
                return false;
            }
            
            // Event date is required
            const eventDate = document.getElementById('event-date')?.value;
            if (!eventDate) {
                showError("Event date is required");
                return false;
            }
            
            // Due date is required
            const dueDate = document.getElementById('due-date')?.value;
            if (!dueDate) {
                showError("Baby's due date is required");
                return false;
            }
            
            // Guess price is required and must be a positive number
            const guessPrice = parseFloat(document.getElementById('guess-price')?.value);
            if (isNaN(guessPrice) || guessPrice <= 0) {
                showError("Guess price must be a positive number");
                return false;
            }
        }
        
        // Step 5 validation
        if (currentStep === 5) {
            const venmoUsername = document.getElementById('venmo-username')?.value;
            const venmoPhone = document.getElementById('venmo-phone')?.value;
            
            // If Venmo username is provided, phone number is required
            if (venmoUsername && (!venmoPhone || venmoPhone.length !== 4)) {
                showError("Please enter the last 4 digits of your phone number");
                return false;
            }
        }
        
        // Step 6 validation
        if (currentStep === 6 && formData.name_game_enabled && formData.baby_name_chosen) {
            // If name game is enabled and baby has a chosen name, the name is required
            const babyName = document.getElementById('baby-name')?.value;
            if (!babyName || babyName.trim() === '') {
                showError("Please enter the baby's chosen name");
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Display an error message
     */
    function showError(message) {
        const errorMsg = document.getElementById('error-message');
        errorMsg.textContent = message;
        errorMsg.classList.remove('d-none');
    }
    
    /**
     * Submit the form
     */
    function submitForm() {
        // Validate the final step
        if (!validateCurrentStep()) {
            return;
        }
        
        // Disable submit button and show loading state
        const submitBtn = document.querySelector('.btn-primary');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
        }
        
        // Prepare form data
        const eventData = {
            title: formData.title || `${formData.mother_name}'s Baby Shower`,
            mother_name: formData.mother_name,
            partner_name: formData.partner_name,
            event_date: formData.event_date,
            due_date: formData.due_date,
            show_host_email: formData.show_host_email,
            shower_link: formData.shower_link,
            guess_price: formData.guess_price,
            theme: formData.theme,
            theme_mode: formData.theme_mode,
            name_game_enabled: formData.name_game_enabled,
            baby_name: formData.baby_name,
            baby_name_revealed: formData.baby_name_chosen,
            guest_emails: formData.guest_emails,
            venmo_username: formData.venmo_username,
            venmo_phone_last4: formData.venmo_phone_last4
        };
        
        // Submit to API
        fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to create event');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Event created:', data);
            
            // If we have an image file, upload it
            if (formData.image_file && data.id) {
                const imageFormData = new FormData();
                imageFormData.append('image', formData.image_file);
                
                return fetch(`/api/events/${data.id}/image`, {
                    method: 'POST',
                    body: imageFormData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to upload image');
                    }
                    return data;
                });
            }
            
            return data;
        })
        .then(data => {
            // Show success message and redirect
            alert('Event created successfully!');
            window.location.href = '/dashboard';
        })
        .catch(error => {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Event';
            }
            
            // Show error message
            showError(error.message);
        });
    }
});