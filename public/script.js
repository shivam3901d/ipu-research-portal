// --- ACCELERATED CAROUSEL SLIDER ENGINE ---
let slideTrackerIndex = 0;
const bannerSlides = document.querySelectorAll('.carousel-slide');
const indicatorDots = document.querySelectorAll('.dot');
let automaticIntervalHook;

function updateCarouselUI(targetIndex) {
    if (targetIndex >= bannerSlides.length) slideTrackerIndex = 0;
    if (targetIndex < 0) slideTrackerIndex = bannerSlides.length - 1;
    
    bannerSlides.forEach(s => s.classList.remove('active'));
    indicatorDots.forEach(d => d.classList.remove('active'));
    
    if (bannerSlides[slideTrackerIndex] && indicatorDots[slideTrackerIndex]) {
        bannerSlides[slideTrackerIndex].classList.add('active');
        indicatorDots[slideTrackerIndex].classList.add('active');
    }
}

function handleNextSlideTransition() {
    slideTrackerIndex++;
    updateCarouselUI(slideTrackerIndex);
}

function currentSlide(idx) {
    clearInterval(automaticIntervalHook);
    slideTrackerIndex = idx;
    updateCarouselUI(slideTrackerIndex);
    activateAutomaticEngine();
}

function activateAutomaticEngine() {
    automaticIntervalHook = setInterval(handleNextSlideTransition, 5000);
}

// --- CLIENT LEVEL SECTION CONTROLLER ROUTER ---
function switchSection(targetViewId, controlAnchor) {
    const allViews = document.querySelectorAll('.portal-section');
    allViews.forEach(v => v.classList.remove('active'));
    
    const allNavButtons = document.querySelectorAll('.nav-item');
    allNavButtons.forEach(btn => btn.classList.remove('active'));
    
    const destinationFrame = document.getElementById(targetViewId);
    if (destinationFrame && controlAnchor) {
        destinationFrame.classList.add('active');
        controlAnchor.classList.add('active');
    }
}

// --- REAL-TIME TABULAR SEARCH EXECUTION ENGINE ---
function searchTable(tableSelectorId, searchInputId) {
    const inputNode = document.getElementById(searchInputId);
    const filterQuery = inputNode.value.toLowerCase().trim();
    const targetedTable = document.getElementById(tableSelectorId);
    
    if (!targetedTable) return;
    const rows = targetedTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        let keywordMatch = false;
        const dataCells = rows[i].getElementsByTagName('td');
        
        for (let j = 0; j < dataCells.length; j++) {
            if (dataCells[j]) {
                const cellStringValue = dataCells[j].textContent || dataCells[j].innerText;
                if (cellStringValue.toLowerCase().indexOf(filterQuery) > -1) {
                    keywordMatch = true;
                    break;
                }
            }
        }
        rows[i].style.display = keywordMatch ? "" : "none";
    }
}
// --- DATABASE POOL PIPELINE FETCH LOGIC ENGINE ---
async function fetchLiveDatabaseRegistries() {
    console.log("[USBAS LIVE DATA POOL]: Querying active server endpoints...");
    
    // 1. Fetch and Populate Dynamic Faculty Directory
    try {
        const response = await fetch('/api/faculty');
        if (!response.ok) throw new Error("Faculty network gateway disconnect");
        const facultyRows = await response.json();
        
        const facultyBody = document.getElementById('facultyTableBody');
        if (facultyBody && facultyRows && facultyRows.length > 0) {
            facultyBody.innerHTML = facultyRows.map(row => `
                <tr>
                    <td>${row.sn}</td>
                    <td>Dr. ${row.name.replace('Dr. ', '')}</td>
                    <td>${row.designation}</td>
                    <td>${row.email}</td>
                    <td>
                        <div class="tooltip-container">
                            <a href="${row.profile_link}" target="_blank" class="table-profile-link">
                                View Profile <i class="fa-solid fa-arrow-right-long arrow-icon"></i>
                            </a>
                            <span class="tooltip-text">Open Verified Portal Link</span>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.warn("[LIVE SYNC WARNING]: Faculty Directory baseline initialization mismatch.", err.message);
    }

    // 2. Fetch and Populate Dynamic Ph.D. Awards Matrix
    try {
        const response = await fetch('/api/phd-registry');
        if (!response.ok) throw new Error("Ph.D. registry network gateway disconnect");
        const phdRows = await response.json();
        
        const phdBody = document.getElementById('phdTableBody');
        if (phdBody && phdRows && phdRows.length > 0) {
            phdBody.innerHTML = phdRows.map(row => `
                <tr>
                    <td>${row.sn}</td>
                    <td><b>${row.scholar_name}</b></td>
                    <td style="font-size: 0.85rem;">${row.thesis_title}</td>
                    <td>${row.supervisor_name}</td>
                    <td><span class="badge" style="background-color:#f1f5f9; color:#0f172a;">${row.passing_year}</span></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.warn("[LIVE SYNC WARNING]: Ph.D. Registry baseline initialization mismatch.", err.message);
    }
}
// --- ADMIN PORTAL INTERACTIVE SECURITY AUTHENTICATION ROUTINES ---
async function executeAdminAuthLogin(event) {
    event.preventDefault(); // Prevent standard page reloading on form submission
    
    const usernameInput = document.getElementById('adminUserNode').value.trim();
    const passwordInput = document.getElementById('adminPassNode').value;
    const alertBox = document.getElementById('authStatusAlert');
    
    // Clear and reset alert boxes states
    alertBox.style.display = "none";
    alertBox.className = "auth-message-status";
    alertBox.textContent = "";

    try {
        console.log("[USBAS SECURITY]: Sending verification payload to Render cluster...");
        const response = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput
            })
        });

        const outcomeData = await response.json();

        if (response.ok && outcomeData.status === "AUTHORIZED") {
            // Authorized state updates
            alertBox.style.display = "block";
            alertBox.style.backgroundColor = "#d1fae5";
            alertBox.style.color = "#065f46";
            alertBox.style.border = "1px solid #a7f3d0";
            alertBox.innerHTML = `<i class="fa-solid fa-circle-check"></i> Welcome back Administrator! System interfaces mapped successfully.`;
            
            // Store token securely inside client memory space for mutations references
            sessionStorage.setItem('usbas_admin_token', outcomeData.token);
        } else {
            throw new Error(outcomeData.message || "Invalid network verification parameters.");
        }
    } catch (authError) {
        console.warn("[USBAS SECURITY ERROR]: Authorization block triggered.", authError.message);
        alertBox.style.display = "block";
        alertBox.style.backgroundColor = "#fee2e2";
        alertBox.style.color = "#991b1b";
        alertBox.style.border = "1px solid #fca5a5";
        alertBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Access Aborted: ${authError.message}`;
    }
}

// Attach listeners once DOM content renders completely
document.addEventListener('DOMContentLoaded', () => {
    activateAutomaticEngine();
    fetchLiveDatabaseRegistries(); // Instantly trigger live connection pooling logic
});
