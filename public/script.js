let isAdminAuthenticated = false;
let currentLab = '';
let currentSection = 'all';

let registeredLabs = ['physics', 'chemistry', 'matlab'];
let baseSections = [
    { id: 'facilities', name: 'Facilities' },
    { id: 'opening', name: 'Openings' },
    { id: 'projects', name: 'Projects' },
    { id: 'publication', name: 'Research Publications' },
    { id: 'industrial', name: 'Industrial Collaborations' },
    { id: 'national', name: 'National Collaborations' },
    { id: 'international', name: 'International Collaborations' }
];
let portalDataItems = [];

function showNotification(message, type = 'success') {
    const toast = document.getElementById('toastAlert');
    toast.innerText = message;
    toast.className = 'toast-notification';
    if (type === 'success') toast.classList.add('toast-success');
    else toast.classList.add('toast-error');
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function showView(viewId) {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if (viewId === 'publicView') document.getElementById('navHome').classList.add('active');
    else document.getElementById('navHome').classList.remove('active');
}

function switchToPublicView() {
    showView('publicView');
    loadMasterPipeline();
}

function setAdminAction(mode) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-sub-form').forEach(form => form.classList.remove('active'));
    if (mode === 'publish') {
        document.getElementById('togglePublishBtn').classList.add('active');
        document.getElementById('contentPublishForm').classList.add('active');
    } else {
        document.getElementById('toggleManageBtn').classList.add('active');
        document.getElementById('structureManagerForm').classList.add('active');
    }
}

function handleAuthNav() {
    if (isAdminAuthenticated) {
        isAdminAuthenticated = false;
        document.getElementById('actionBtn').innerText = 'Admin Login';
        document.getElementById('actionBtn').style.background = '#f1f5f9';
        document.getElementById('actionBtn').style.color = '#334155';
        switchToPublicView();
        showNotification("Session terminated safely.", "success");
    } else {
        showView('authView');
    }
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (document.getElementById('usernameField').value.trim() === 'ipu' && document.getElementById('passwordField').value === 'project11') {
        isAdminAuthenticated = true;
        document.getElementById('usernameField').value = '';
        document.getElementById('passwordField').value = '';
        document.getElementById('actionBtn').innerText = 'Secure Logout 🔒';
        document.getElementById('actionBtn').style.background = '#ef4444';
        document.getElementById('actionBtn').style.color = '#ffffff';
        populateAdminDropdowns();
        setAdminAction('publish');
        showView('adminDashboardView');
        showNotification("Cross-device root credentials accepted!", "success");
    } else {
        showNotification("Invalid Parameter Blocks! Access Denied.", "error");
    }
});

function populateAdminDropdowns() {
    const labSel = document.getElementById('pubLabSelect');
    const secSel = document.getElementById('pubSectionSelect');
    labSel.innerHTML = '';
    registeredLabs.forEach(lab => { labSel.innerHTML += `<option value="${lab}">${lab.toUpperCase()}</option>`; });
    secSel.innerHTML = '';
    baseSections.forEach(sec => { secSel.innerHTML += `<option value="${sec.id}">${sec.name}</option>`; });
}

function renderFilterInterfaces() {
    const tabsRow = document.getElementById('labTabsRow');
    tabsRow.innerHTML = '';
    registeredLabs.forEach(lab => {
        const activeClass = currentLab === lab ? 'active' : '';
        tabsRow.innerHTML += `<button class="lab-tab ${activeClass}" onclick="selectLab('${lab}')">${lab.toUpperCase()}</button>`;
    });

    const filterRow = document.getElementById('sectionFilterRow');
    filterRow.innerHTML = `<button class="filter-btn ${currentSection === 'all' ? 'active' : ''}" onclick="selectSection('all')">Show All Sections</button>`;
    baseSections.forEach(sec => {
        const activeClass = currentSection === sec.id ? 'active' : '';
        filterRow.innerHTML += `<button class="filter-btn ${activeClass}" onclick="selectSection('${sec.id}')">${sec.name}</button>`;
    });
}

function selectLab(lab) { currentLab = lab; renderFilterInterfaces(); renderStreamCards(); }
function selectSection(sec) { currentSection = sec; renderFilterInterfaces(); renderStreamCards(); }

async function loadMasterPipeline() {
    try {
        const metaRes = await fetch('/api/structural-meta');
        const metaData = await metaRes.json();
        registeredLabs = metaData.labs;
        baseSections = metaData.sections;
        if(!currentLab && registeredLabs.length > 0) currentLab = registeredLabs[0];
        const itemRes = await fetch('/api/portal-elements');
        portalDataItems = await itemRes.json();
        renderFilterInterfaces();
        renderStreamCards();
    } catch(err) { console.error("Network sync error: ", err); }
}

function renderStreamCards() {
    const container = document.getElementById('dataStreamContainer');
    container.innerHTML = '';
    const sortedData = portalDataItems.filter(item => item.lab_domain === currentLab && (currentSection === 'all' || item.section_id === currentSection));
    if(sortedData.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#64748b; font-size:14px;">No custom data elements found in ${currentLab.toUpperCase()} tracking rows.</div>`;
        return;
    }
    sortedData.forEach(item => {
        const card = document.createElement('div');
        card.className = `node-card`;
        const friendlySection = baseSections.find(s => s.id === item.section_id)?.name || item.section_id.toUpperCase();
        let cardContent = `
            <div>
                <span class="badge">${friendlySection}</span>
                <h4>${item.title}</h4>
                <div class="meta-info">📍 ${item.meta_info}</div>
                <p>${item.description}</p>
                ${item.link_url ? `<a href="\${item.link_url}" target="_blank" class="card-link-anchor">🌐 View Attached Reference Link</a>` : ''}
            </div>
        `;
        if(isAdminAuthenticated) { cardContent += `<button class="btn-delete" onclick="executeDataDeletion(${item.id})">🗑️ Delete Placement</button>`; }
        card.innerHTML = cardContent;
        container.appendChild(card);
    });
}

document.getElementById('contentPublishForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        lab_domain: document.getElementById('pubLabSelect').value,
        section_id: document.getElementById('pubSectionSelect').value,
        title: document.getElementById('pubTitle').value.trim(),
        meta_info: document.getElementById('pubMeta').value.trim(),
        link_url: document.getElementById('pubLink').value.trim(),
        description: document.getElementById('pubDesc').value.trim()
    };
    const res = await fetch('/api/portal-elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if(res.ok) {
        document.getElementById('contentPublishForm').reset();
        showNotification("Content packet updated smoothly onto live rows!", "success");
        switchToPublicView();
    }
});

document.getElementById('addLabForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const labName = document.getElementById('newLabName').value.trim().toLowerCase();
    const res = await fetch('/api/structural-meta/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: labName })
    });
    if(res.ok) {
        document.getElementById('newLabName').value = '';
        showNotification(`New Lab Realm "${labName.toUpperCase()}" initialized!`, "success");
        await loadMasterPipeline();
        populateAdminDropdowns();
    }
});

document.getElementById('addSectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const secRaw = document.getElementById('newSectionName').value.trim();
    const secId = secRaw.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const res = await fetch('/api/structural-meta/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: secId, name: secRaw })
    });
    if(res.ok) {
        document.getElementById('newSectionName').value = '';
        showNotification(`Custom Slide Module "${secRaw}" added globally!`, "success");
        await loadMasterPipeline();
        populateAdminDropdowns();
    }
});

async function executeDataDeletion(id) {
    if(!confirm("Permanently wipe this entry row configuration?")) return;
    const res = await fetch(`/api/portal-elements/${id}`, { method: 'DELETE' });
    if(res.ok) {
        showNotification("Node swept safely from framework.", "success");
        loadMasterPipeline();
    }
}

loadMasterPipeline();
