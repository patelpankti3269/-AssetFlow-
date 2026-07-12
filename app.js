/**
 * AssetFlow Application Logic
 */

const SEED_DATA = {
    users: [
        { id: 'u1', name: 'Admin User', email: 'admin@assetflow.com', role: 'admin' },
        { id: 'u2', name: 'Priya Shah', email: 'priya@assetflow.com', role: 'employee', dept: 'Engineering' },
        { id: 'u3', name: 'Arjun Nair', email: 'arjun@assetflow.com', role: 'employee', dept: 'Engineering' },
        { id: 'u4', name: 'Aditi Rao', email: 'aditi@assetflow.com', role: 'employee', dept: 'Engineering' },
        { id: 'u5', name: 'Rohan Mehta', email: 'rohan@assetflow.com', role: 'employee', dept: 'Facilities' },
        { id: 'u6', name: 'Sana Iqbal', email: 'sana@assetflow.com', role: 'employee', dept: 'Field Ops (East)' }
    ],
    departments: [
        { id: 'd1', name: 'Engineering', head: 'Aditi Rao', parent: '--', status: 'Active' },
        { id: 'd2', name: 'Facilities', head: 'Rohan Mehta', parent: '--', status: 'Active' },
        { id: 'd3', name: 'Field Ops (East)', head: 'Sana Iqbal', parent: 'Field Ops', status: 'Inactive' }
    ],
    assets: [
        { id: 'a1', tag: 'AF-0012', name: 'Dell Laptop', category: 'Electronics', status: 'allocated', location: 'bengaluru', holder: 'u2', holderName: 'Priya Shah' },
        { id: 'a2', tag: 'AF-0062', name: 'Projector', category: 'Electronics', status: 'maintenance', location: 'HQ floor 2', holder: null },
        { id: 'a3', tag: 'AF-0201', name: 'Office chair', category: 'Furniture', status: 'available', location: 'Warehouse', holder: null },
        { id: 'a4', tag: 'AF-9921', name: 'Office chair', category: 'Furniture', status: 'available', location: 'Desk E14', holder: null },
        { id: 'a5', tag: 'AF-9838', name: 'Monitor', category: 'Electronics', status: 'allocated', location: 'Desk E15', holder: 'u3', holderName: 'Arjun Nair' }
    ],
    maintenance: [
        { id: 'm1', asset: 'AF-0062', desc: 'Projector bulb not turning on', status: 'pending' },
        { id: 'm2', asset: 'AF-003', desc: 'ac unit noisy compressor', status: 'approved' },
        { id: 'm3', asset: 'AF-0078', desc: 'forklift', technician: 'R Varma', status: 'assigned' },
        { id: 'm4', asset: 'AF-897', desc: 'Printer Jam parts ordered', status: 'progress' },
        { id: 'm5', asset: 'AF-873', desc: 'Chair repair resolved 7 Jul', status: 'resolved' }
    ],
    notifications: [
        { id: 'n1', type: 'booking', msg: 'Laptop AF-0014 assigned to Priya shah', time: '2m ago' },
        { id: 'n2', type: 'approval', msg: 'Maintenance request AF-0055 approved', time: '18m ago' },
        { id: 'n3', type: 'booking', msg: 'Booking confirmed: Room B2: 2:00 to 3:00 PM', time: '1h ago' },
        { id: 'n4', type: 'alert', msg: 'Transfer approved: AF-0033 to facilities dept', time: '3h ago' },
        { id: 'n5', type: 'alert', msg: 'Overdue return: AF-0021 was due 3 days ago', time: '1d ago' },
        { id: 'n6', type: 'alert', msg: 'audit discrepancy flagged: AF-0088 damaged', time: '2d ago' }
    ]
};

class AssetFlowApp {
    constructor() {
        this.state = {
            currentUser: null,
            ...JSON.parse(JSON.stringify(SEED_DATA))
        };
        this.chartsInitialized = false;
        
        // Setup Drag & Drop state
        this.draggedCard = null;
    }

    login() {
        const email = document.getElementById('login-email').value;
        const user = this.state.users.find(u => u.email === email) || this.state.users[0];
        
        this.state.currentUser = user;
        document.getElementById('current-user-name').innerText = user.name;
        document.getElementById('current-user-role').innerText = user.role;
        
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        
        // Enforce RBAC in UI
        const adminEls = document.querySelectorAll('.admin-only');
        adminEls.forEach(el => {
            el.style.display = user.role === 'admin' ? 'block' : 'none';
        });

        this.setupNavigation();
        this.navigate('dashboard');
    }

    logout() {
        this.state.currentUser = null;
        document.getElementById('app').style.display = 'none';
        document.getElementById('login-container').style.display = 'flex';
    }

    setupNavigation() {
        const items = document.querySelectorAll('.nav-item');
        items.forEach(item => {
            item.onclick = () => {
                const target = item.getAttribute('data-target');
                this.navigate(target);
            };
        });
    }

    navigate(screenId) {
        // Update nav styling
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-target="${screenId}"]`);
        if(activeNav) activeNav.classList.add('active');

        // Update screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${screenId}`).classList.add('active');

        // Render content
        if (screenId === 'dashboard') this.renderDashboard();
        if (screenId === 'org-setup') this.renderOrgSetup();
        if (screenId === 'assets') this.renderAssets();
        if (screenId === 'allocation') this.renderAllocation();
        if (screenId === 'maintenance') this.renderMaintenance();
        if (screenId === 'audit') this.renderAudit();
        if (screenId === 'reports') this.renderReports();
        if (screenId === 'notifications') this.renderNotifications();
    }

    openModal(id) { document.getElementById(id).classList.add('active'); }
    closeModal(id) { document.getElementById(id).classList.remove('active'); }

    // --- SCREEN RENDERERS ---

    renderDashboard() {
        const available = this.state.assets.filter(a => a.status === 'available').length;
        const allocated = this.state.assets.filter(a => a.status === 'allocated').length;
        
        document.getElementById('kpi-available').innerText = available;
        document.getElementById('kpi-allocated').innerText = allocated;
        document.getElementById('kpi-maintenance').innerText = this.state.assets.filter(a => a.status === 'maintenance').length;
        document.getElementById('kpi-bookings').innerText = '9';
        document.getElementById('kpi-transfers').innerText = '3';
        document.getElementById('kpi-returns').innerText = '12';

        const list = document.getElementById('recent-activity-list');
        list.innerHTML = this.state.notifications.slice(0, 3).map(n => 
            `<div style="margin-bottom: 8px;">${n.msg} <span style="font-size:11px; opacity:0.6;">${n.time}</span></div>`
        ).join('');
    }

    renderOrgSetup() {
        const tbody = document.getElementById('dept-table-body');
        tbody.innerHTML = this.state.departments.map(d => `
            <tr>
                <td>${d.name}</td>
                <td>${d.head}</td>
                <td>${d.parent}</td>
                <td>
                    <span class="pill ${d.status === 'Active' ? 'pill-available' : 'pill-pending'}">
                        ${d.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    renderAssets() {
        const tbody = document.getElementById('assets-table-body');
        tbody.innerHTML = this.state.assets.map(a => {
            let pClass = 'pill-available';
            if(a.status === 'allocated') pClass = 'pill-allocated';
            if(a.status === 'maintenance') pClass = 'pill-maintenance';
            if(a.status === 'missing' || a.status === 'damaged') pClass = 'pill-damaged';
            
            return `
            <tr>
                <td>${a.tag}</td>
                <td>${a.name}</td>
                <td>${a.category}</td>
                <td><span class="pill ${pClass}" style="text-transform:capitalize">${a.status}</span></td>
                <td>${a.location}</td>
            </tr>
        `}).join('');

        // Populate modal dropdown
        const deptSel = document.getElementById('reg-dept');
        deptSel.innerHTML = this.state.departments.map(d => `<option>${d.name}</option>`).join('');
    }

    registerAsset() {
        const name = document.getElementById('reg-name').value;
        const cat = document.getElementById('reg-cat').value;
        const loc = document.getElementById('reg-loc').value;
        
        if(!name) return alert('Name required');

        this.state.assets.push({
            id: 'a' + Date.now(),
            tag: 'AF-' + Math.floor(Math.random()*9000 + 1000),
            name, category: cat, status: 'available', location: loc, holder: null
        });

        this.closeModal('modal-register-asset');
        this.renderAssets();
        this.renderDashboard();
    }

    renderAllocation() {
        const select = document.getElementById('allocation-asset-select');
        select.innerHTML = `<option value="">-- Choose an asset --</option>` + 
            this.state.assets.map(a => `<option value="${a.id}">${a.tag} - ${a.name}</option>`).join('');
        
        const toSelect = document.getElementById('allocation-to');
        toSelect.innerHTML = this.state.users.filter(u => u.role !== 'admin').map(u => `<option value="${u.id}">${u.name} (${u.dept})</option>`).join('');
        
        this.onAllocationAssetSelect();
    }

    onAllocationAssetSelect() {
        const id = document.getElementById('allocation-asset-select').value;
        const warn = document.getElementById('allocation-warning');
        const fromInput = document.getElementById('allocation-from');
        
        if(!id) {
            warn.style.display = 'none';
            fromInput.value = '';
            return;
        }

        const asset = this.state.assets.find(a => a.id === id);
        
        // Double allocation block
        if(asset.status === 'allocated') {
            warn.style.display = 'block';
            document.getElementById('warning-current-user').innerText = `${asset.holderName}`;
            fromInput.value = asset.holderName;
            document.getElementById('allocation-form-title').innerText = 'Transfer Request';
        } else {
            warn.style.display = 'none';
            fromInput.value = 'Inventory (Available)';
            document.getElementById('allocation-form-title').innerText = 'Direct Allocation';
        }

        document.getElementById('allocation-history-list').innerHTML = `
            Mar 12 - Allocated to Priya shah - Engineering<br>
            Jan 04 - Returned by Arjun Nair - condition: good
        `;
    }

    submitAllocationRequest() {
        const id = document.getElementById('allocation-asset-select').value;
        if(!id) return alert('Select an asset');
        
        const asset = this.state.assets.find(a => a.id === id);
        const toId = document.getElementById('allocation-to').value;
        const toUser = this.state.users.find(u => u.id === toId);

        if(asset.status === 'allocated') {
            // Transfer logic
            alert(`Transfer Request submitted for ${asset.tag} to ${toUser.name}. Pending manager approval.`);
            this.state.notifications.unshift({ type: 'alert', msg: `Transfer requested: ${asset.tag} to ${toUser.name}`, time: 'Just now' });
        } else {
            // Direct allocation
            asset.status = 'allocated';
            asset.holder = toUser.id;
            asset.holderName = toUser.name;
            alert(`Asset ${asset.tag} directly allocated to ${toUser.name}.`);
            this.state.notifications.unshift({ type: 'booking', msg: `${asset.name} ${asset.tag} assigned to ${toUser.name}`, time: 'Just now' });
        }
        
        this.navigate('assets');
    }

    simulateBooking() {
        const slot = document.getElementById('booking-slot-10');
        slot.innerHTML = `<div class="conflict-block">Requested 9:30 to 10:30 - conflict - slot is unavailable</div>`;
        alert("Conflict detected! Server blocked this booking.");
    }

    renderMaintenance() {
        const renderCol = (status, colId) => {
            const items = this.state.maintenance.filter(m => m.status === status);
            const col = document.getElementById(colId);
            // keep header
            const header = col.querySelector('.kanban-col-header').outerHTML;
            col.innerHTML = header + items.map(m => `
                <div class="kanban-card ${m.status==='resolved'?'resolved':''}" draggable="true" ondragstart="app.dragStart(event, '${m.id}')">
                    <div class="tag"><span class="material-symbols-rounded" style="font-size: 16px; vertical-align: middle;">tag</span> ${m.asset}</div>
                    <div class="desc">${m.desc}</div>
                    ${m.technician ? `<div style="margin-top:12px; font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:4px;"><span class="material-symbols-rounded" style="font-size:14px;">engineering</span> tech: ${m.technician}</div>` : ''}
                </div>
            `).join('');
            
            col.ondragover = (e) => e.preventDefault();
            col.ondrop = (e) => this.drop(e, status);
        };

        renderCol('pending', 'kb-pending');
        renderCol('approved', 'kb-approved');
        renderCol('assigned', 'kb-assigned');
        renderCol('progress', 'kb-progress');
        renderCol('resolved', 'kb-resolved');
    }

    dragStart(e, id) {
        this.draggedCard = id;
    }

    drop(e, newStatus) {
        e.preventDefault();
        const item = this.state.maintenance.find(m => m.id === this.draggedCard);
        if(item && item.status !== newStatus) {
            item.status = newStatus;
            
            // Business Rule: Update asset status
            const asset = this.state.assets.find(a => a.tag === item.asset);
            if(asset) {
                if(newStatus === 'approved') asset.status = 'maintenance';
                if(newStatus === 'resolved') asset.status = 'available'; // Simplified
            }
            
            this.renderMaintenance();
            this.renderDashboard();
        }
    }

    renderAudit() {
        const auditAssets = [
            { tag: 'AF-0012', name: 'Dell laptop', loc: 'Desk E12', ver: 'verified' },
            { tag: 'AF-9921', name: 'Office chair', loc: 'Desk E14', ver: 'missing' },
            { tag: 'AF-9838', name: 'Monitor', loc: 'Desk E15', ver: 'damaged' }
        ];

        const tbody = document.getElementById('audit-table-body');
        tbody.innerHTML = auditAssets.map(a => `
            <tr>
                <td>${a.tag} ${a.name}</td>
                <td>${a.loc}</td>
                <td>
                    <select class="form-control" style="width:auto; padding:4px 8px; font-size:12px;" onchange="app.checkAuditFlags()">
                        <option value="verified" ${a.ver==='verified'?'selected':''}>Verified</option>
                        <option value="missing" ${a.ver==='missing'?'selected':''}>Missing</option>
                        <option value="damaged" ${a.ver==='damaged'?'selected':''}>Damaged</option>
                    </select>
                </td>
            </tr>
        `).join('');
        this.checkAuditFlags();
    }

    checkAuditFlags() {
        const selects = document.querySelectorAll('#audit-table-body select');
        let flags = 0;
        selects.forEach(s => { if(s.value !== 'verified') flags++; });
        
        const banner = document.getElementById('audit-discrepancy-banner');
        if(flags > 0) {
            banner.style.display = 'block';
            document.getElementById('audit-flag-count').innerText = flags;
        } else {
            banner.style.display = 'none';
        }
    }

    closeAudit() {
        alert("Audit cycle closed. Discrepancy report saved.");
    }

    renderReports() {
        if(this.chartsInitialized) return;
        
        const ctxU = document.getElementById('utilizationChart').getContext('2d');
        new Chart(ctxU, {
            type: 'bar',
            data: {
                labels: ['Eng', 'HR', 'Ops', 'Sales', 'IT'],
                datasets: [{
                    label: 'Assets Allocated',
                    data: [42, 12, 28, 15, 35],
                    backgroundColor: 'rgba(99, 102, 241, 0.4)',
                    borderColor: '#6366F1',
                    borderWidth: 1
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins:{legend:{display:false}}, 
                scales:{
                    y:{beginAtZero:true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8B9BB4' }},
                    x:{grid: { display: false }, ticks: { color: '#8B9BB4' }}
                } 
            }
        });

        const ctxM = document.getElementById('maintenanceChart').getContext('2d');
        new Chart(ctxM, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Requests',
                    data: [5, 9, 14, 11, 20, 24],
                    borderColor: '#06B6D4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins:{legend:{display:false}}, 
                scales:{
                    y:{beginAtZero:true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8B9BB4' }},
                    x:{grid: { display: false }, ticks: { color: '#8B9BB4' }}
                } 
            }
        });
        
        this.chartsInitialized = true;
    }

    renderNotifications() {
        const getIcon = (type) => {
            if(type === 'alert') return 'warning';
            if(type === 'approval') return 'task_alt';
            if(type === 'booking') return 'event_available';
            return 'notifications';
        };

        const list = document.getElementById('notifications-list');
        list.innerHTML = this.state.notifications.map(n => `
            <div class="notification-row">
                <div class="notification-dot ${n.type}">
                    <span class="material-symbols-rounded">${getIcon(n.type)}</span>
                </div>
                <div class="notification-msg">${n.msg}</div>
                <div class="notification-time">${n.time}</div>
            </div>
        `).join('');
    }
}

const app = new AssetFlowApp();
