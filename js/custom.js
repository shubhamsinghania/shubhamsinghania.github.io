/* ================= OAUTH ================= */
const redirectUri = window.location.origin + window.location.pathname;
const appContainer = document.getElementById('appContainer');
const spinnerModal = document.getElementById('spinnerModal');
let genesysBaseUrl = null;

function showSpinner() {
    spinnerModal.style.display = 'flex';
}

function hideSpinner() {
    spinnerModal.style.display = 'none';
}

hideSpinner();

/* ================= SETTINGS MODAL LOGIC ================= */
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

settingsButton.onclick = () => {
    settingsModal.style.display = 'flex';
};

closeSettingsModal.onclick = () => {
    settingsModal.style.display = 'none';
};

function displayRegion() {
    const regionLabelDisplay = document.getElementById('regionLabelDisplay');
    const envLabel = localStorage.getItem('envLabel');
    regionLabelDisplay.textContent = envLabel
        ? `Region: ${envLabel}`
        : `Region: Not Set`;
}

displayRegion();

saveSettingsBtn.onclick = async () => {
    const select = document.getElementById('regionSelect');
    const option = select.options[select.selectedIndex];

    localStorage.setItem('envValue', option.value);
    localStorage.setItem('envLabel', option.text);
    localStorage.setItem('clientId', document.getElementById('clientId').value.trim());

    settingsModal.style.display = 'none';
    displayRegion();
    setGenesysBaseUrl();
    renderAuthButton();
};

/* ================= HANDLE CALLBACK ================= */
if (window.location.hash.includes('access_token')) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const tokenFromHash = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (tokenFromHash) {
        sessionStorage.setItem('access_token', tokenFromHash);

        if (expiresIn) {
            sessionStorage.setItem(
                'token_expiry',
                String(Date.now() + parseInt(expiresIn, 10) * 1000)
            );
        }

        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function isAuthenticated() {
    const token = sessionStorage.getItem('access_token');
    const expiry = sessionStorage.getItem('token_expiry');
    return !!(token && (!expiry || Date.now() < parseInt(expiry, 10)));
}

function setGenesysBaseUrl() {
    const envValue = localStorage.getItem('envValue');
    if (!envValue) {
        genesysBaseUrl = null;
        return;
    }
    genesysBaseUrl = `https://api.${envValue}/api`;
}

function login() {
    const env = localStorage.getItem('envValue');
    const clientId = localStorage.getItem('clientId');

    if (!clientId || !env) {
        alert('Use settings to configure the region and client Id');
        return;
    }

    const authUrl =
        `https://login.${env}/oauth/authorize` +
        `?response_type=token` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=architect%20users%20notifications`;

    window.location.href = authUrl;
}

function logout() {
    const clientId = localStorage.getItem('clientId');
    const env = localStorage.getItem('envValue');

    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token_expiry');

    const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `https://login.${env}/logout?client_id=${clientId}&redirect_uri=${returnUrl}`;
}

const authButton = document.getElementById('authButton');

function renderAuthButton() {
    const envValue = localStorage.getItem('envValue');
    const clientId = localStorage.getItem('clientId');
    const isConfigured = !!envValue && !!clientId;

    if (isAuthenticated()) {
        authButton.innerHTML = `<img src="images/arrow-right-from-bracket-blue.png" alt="Logout" style="width:20px;height:20px;vertical-align:middle;margin-right:3px"><span>Logout</span>`;
        authButton.className = 'header-pill';
        authButton.onclick = logout;
        appContainer.style.display = 'block';
    } else {
        authButton.innerHTML = `<img src="images/arrow-right-to-bracket-blue.png" alt="Login" style="width:20px;height:20px;vertical-align:middle;margin-right:3px"><span>Login</span>`;
        authButton.className = 'header-pill';
        authButton.onclick = login;
        appContainer.style.display = 'none';
    }

    authButton.disabled = !isConfigured;
    authButton.title = isConfigured
        ? (isAuthenticated() ? 'Logout' : 'Login')
        : 'Please configure Region and Client ID in Settings';

    authButton.className = isConfigured ? 'header-pill' : 'header-pill disabled';
}

renderAuthButton();

/* ================= SOURCE LOGIC ================= */
async function getKnowledgeSources() {
    const token = sessionStorage.getItem('access_token');
    if (!token) throw new Error('Not authenticated');
    if (!genesysBaseUrl) throw new Error('Region is not configured');

    const response = await fetch(`${genesysBaseUrl}/v2/knowledge/sources`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fetch knowledge source failed: ${response.status} ${errorText}`);
    }

    return response.json();
}

async function loadKnowledgeSources() {
    try {
        const entities = await getKnowledgeSources();
        const sources = entities.entities || [];
        const select = document.getElementById('knowledgeSourceSelect');

        select.innerHTML = '<option value="">Select Knowledge Source</option>';

        sources.forEach(({ id, name, type }) => {
            if (type === 'FileUpload') {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                select.appendChild(option);
            }
        });
    } catch (err) {
        const select = document.getElementById('knowledgeSourceSelect');
        select.innerHTML = '<option value="">Failed to load Knowledge Sources</option>';
        console.error('Error loading Knowledge Sources:', err);
    }
}

async function createKnowledgeSource(name) {
    const token = sessionStorage.getItem('access_token');
    if (!token) throw new Error('Not authenticated');
    if (!genesysBaseUrl) throw new Error('Region is not configured');

    const response = await fetch(`${genesysBaseUrl}/v2/knowledge/sources`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            type: 'FileUpload',
            triggerType: 'Manual'
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Create source failed: ${response.status} ${errorText}`);
    }

    return response.json();
}

/* ================= FILE UPLOAD LOGIC ================= */
const fileInput = document.getElementById('fileInput');
const browseFilesLink = document.getElementById('browseFilesLink');
const dropZone = document.getElementById('dropZone');
const fileListDiv = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const fileCount = document.getElementById('fileCount');
const uploadResultsList = document.getElementById('uploadResultsList');
const uploadResults = document.getElementById('uploadResults');

let selectedFiles = [];

browseFilesLink.onclick = () => fileInput.click();

fileInput.onchange = e => {
    handleFiles(e.target.files);
};

dropZone.ondragover = e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
};

dropZone.ondragleave = () => {
    dropZone.classList.remove('dragover');
};

dropZone.ondrop = e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
};

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });

    fileInput.value = '';
    renderFiles();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFiles();
}

window.removeFile = removeFile;

function renderFiles() {
    fileCount.textContent = `${selectedFiles.length} files`;
    uploadBtn.disabled = selectedFiles.length === 0;

    if (selectedFiles.length === 0) {
        fileListDiv.innerHTML = '<p>No files selected.</p>';
        return;
    }

    fileListDiv.innerHTML = selectedFiles.map((file, i) => `
        <div class="file-item">
            <span><strong>${file.name}</strong></span>
            <button onclick="removeFile(${i})">
                <img src="/images/minus-circle-red.png" style="width:20px;height:20px;vertical-align:middle;margin-right:3px">Remove
            </button>
        </div>
    `).join('');
}

function normalizeFileName(fileName) {
    const parts = fileName.split('.');

    if (parts.length === 1) {
        return fileName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    const extension = parts.pop();
    const baseName = parts.join('.');

    return (
        baseName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '') +
        '.' +
        extension.toLowerCase()
    );
}

/* ================= UPLOAD RESULT UTILITY ================= */
function addUploadResult(fileName, status, message) {
    uploadResults.classList.add('success');

    const div = document.createElement('div');
    let icon = '';
    let rowClass = '';

    switch (status) {
        case 'success':
            icon = '<span class="checkmark">✓</span>';
            rowClass = 'result-success';
            break;
        case 'error':
            icon = '<span class="error">−</span>';
            rowClass = 'result-error';
            break;
        case 'info':
            icon = '<span class="info">ℹ</span>';
            rowClass = 'result-info';
            break;
    }

    div.innerHTML = `
        <div class="upload-result-item ${rowClass}">
            ${icon}
            <span><strong>${fileName}</strong>: ${message}</span>
        </div>
    `;

    uploadResultsList.appendChild(div);
}

/* ================= SYNCHRONIZATION LOGIC ================= */
async function createSynchronizationSession(sourceId) {
    const token = sessionStorage.getItem('access_token');
    if (!token) throw new Error('Not authenticated');
    if (!genesysBaseUrl) throw new Error('Region is not configured');

    const response = await fetch(`${genesysBaseUrl}/v2/knowledge/sources/${sourceId}/synchronizations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Create synchronization failed: ${response.status} ${errorText}`);
    }

    return response.json();
}

async function requestPresignedUploadUrl(sourceId, synchronizationId, fileName) {
    const token = sessionStorage.getItem('access_token');
    if (!token) throw new Error('Not authenticated');
    if (!genesysBaseUrl) throw new Error('Region is not configured');

    const response = await fetch(`${genesysBaseUrl}/v2/knowledge/sources/${sourceId}/synchronizations/${synchronizationId}/uploads`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Presigned URL request failed: ${response.status} ${errorText}`);
    }

    return response.json();
}

async function completeSynchronizationSession(sourceId, syncId) {
    const token = sessionStorage.getItem('access_token');
    if (!token) throw new Error('Not authenticated');
    if (!genesysBaseUrl) throw new Error('Region is not configured');

    const response = await fetch(`${genesysBaseUrl}/v2/knowledge/sources/${sourceId}/synchronizations/${syncId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Completed' })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Complete synchronization failed: ${response.status} ${errorText}`);
    }

    return response.json();
}

/* ================= PRESIGNED URL UPLOAD HELPERS ================= */
function extractPresignedUpload(uploadInfo) {
    if (!uploadInfo || typeof uploadInfo !== 'object') {
        throw new Error('Presigned upload response is empty or invalid');
    }

    if (!uploadInfo.url) {
        throw new Error(`Upload URL missing in response: ${JSON.stringify(uploadInfo)}`);
    }

    return {
        url: uploadInfo.url,
        headers: uploadInfo.headers || {}
    };
}

async function uploadFileToPresignedUrl(uploadInfo, file) {
    const { url, headers } = extractPresignedUpload(uploadInfo);

    const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: file
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Storage upload failed: ${response.status} ${errText}`);
    }

    return response;
}

/* ================= HANDLE UPLOAD ================= */
uploadBtn.onclick = async () => {
    const knowledgeSourceId = document.getElementById('knowledgeSourceSelect').value;

    if (!knowledgeSourceId) {
        alert('No knowledge source selected.');
        return;
    }

    showSpinner();
    uploadBtn.disabled = true;
    uploadResultsList.innerHTML = '';

    try {
        addUploadResult('Session', 'info', 'Creating synchronization session...');
        const sync = await createSynchronizationSession(knowledgeSourceId);
        addUploadResult('Session', 'success', `Session ${sync.id} started successfully`);

        for (const file of selectedFiles) {
            const safeFileName = normalizeFileName(file.name);

            try {
                addUploadResult(file.name, 'info', 'Requesting upload URL...');

                const uploadInfo = await requestPresignedUploadUrl(
                    knowledgeSourceId,
                    sync.id,
                    safeFileName
                );

                console.log('Upload response from Genesys:', JSON.stringify(uploadInfo, null, 2));

                addUploadResult(file.name, 'info', 'Uploading to storage...');

                await uploadFileToPresignedUrl(uploadInfo, file);

                addUploadResult(file.name, 'success', 'File uploaded successfully');
            } catch (err) {
                console.error('Upload failed for file:', file.name, err);
                addUploadResult(file.name, 'error', err.message || String(err));
            }
        }

        await completeSynchronizationSession(knowledgeSourceId, sync.id);
        addUploadResult('Session', 'info', `Synchronization session ${sync.id} completed`);

        selectedFiles = [];
        renderFiles();
    } catch (err) {
        console.error(err);
        addUploadResult('Error', 'error', err.message || String(err));
        alert('File upload failed. See results for details.');
    } finally {
        hideSpinner();
        uploadBtn.disabled = selectedFiles.length === 0;
    }
};

/* ================= ADD SOURCE MODAL LOGIC ================= */
const addSourceBtn = document.getElementById('addSourceBtn');
const addSourceModal = document.getElementById('addSourceModal');
const closeAddSourceModal = document.getElementById('closeAddSourceModal');
const confirmAddSourceBtn = document.getElementById('confirmAddSourceBtn');
const newSourceNameInput = document.getElementById('newSourceName');

addSourceBtn.onclick = () => {
    addSourceModal.style.display = 'flex';
};

closeAddSourceModal.onclick = () => {
    addSourceModal.style.display = 'none';
};

confirmAddSourceBtn.onclick = async () => {
    const name = newSourceNameInput.value.trim();

    if (!name) {
        alert('Please enter a name');
        return;
    }

    try {
        const newSource = await createKnowledgeSource(name);
        addUploadResult(newSource.name, 'success', 'Knowledge Source created successfully');
        await loadKnowledgeSources();
        addSourceModal.style.display = 'none';
        newSourceNameInput.value = '';
    } catch (err) {
        alert(err.message || String(err));
        console.error(err);
        addUploadResult('Create Source', 'error', err.message || String(err));
        addSourceModal.style.display = 'none';
    }
};

/* ================= GLOBAL MODAL CLOSE ================= */
window.addEventListener('click', e => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }

    if (e.target === addSourceModal) {
        addSourceModal.style.display = 'none';
    }
});

/* ================= INITIALIZE ================= */
renderFiles();
setGenesysBaseUrl();

if (isAuthenticated()) {
    loadKnowledgeSources();
}
