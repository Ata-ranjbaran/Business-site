// Users Management JavaScript

let allUsers = [];
let filteredUsers = [];

// Load users from localStorage
function loadUsers() {
    allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // If no users, create default admin
    if (allUsers.length === 0) {
        allUsers = [{
            id: 1,
            name: 'مدیر سیستم',
            email: 'admin@weblegender.com',
            role: 'admin',
            status: 'active',
            joinDate: new Date().toISOString()
        }];
        saveUsers();
    }
    
    filteredUsers = [...allUsers];
    displayUsers();
}

// Display users
function displayUsers() {
    const usersTable = document.getElementById('usersTable');
    const usersCount = document.getElementById('usersCount');
    
    usersCount.textContent = `${filteredUsers.length} کاربر`;
    
    if (filteredUsers.length === 0) {
        usersTable.innerHTML = '<tr><td colspan="7" class="text-center text-gray-500 py-8">هیچ کاربری یافت نشد</td></tr>';
        return;
    }
    
    usersTable.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>#${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${getRoleText(user.role)}</span></td>
            <td>${formatDate(user.joinDate)}</td>
            <td><span class="status-badge ${getStatusClass(user.status)}">${getStatusText(user.status)}</span></td>
            <td>
                <button class="btn-icon" onclick="editUser(${user.id})" title="ویرایش">
                    <i class="fas fa-edit text-blue-500"></i>
                </button>
                <button class="btn-icon" onclick="deleteUser(${user.id})" title="حذف">
                    <i class="fas fa-trash text-red-500"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter users
function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('filterRole').value;
    
    filteredUsers = allUsers.filter(user => {
        const searchMatch = !searchTerm || 
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm));
        
        const roleMatch = roleFilter === 'all' || user.role === roleFilter;
        
        return searchMatch && roleMatch;
    });
    
    displayUsers();
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterRole').value = 'all';
    filterUsers();
}

// Add user
function addUser() {
    const name = prompt('نام کاربر:');
    if (!name) return;
    
    const email = prompt('ایمیل کاربر:');
    if (!email) return;
    
    const role = confirm('آیا این کاربر مدیر است؟') ? 'admin' : 'user';
    
    const newUser = {
        id: allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id)) + 1 : 1,
        name: name,
        email: email,
        role: role,
        status: 'active',
        joinDate: new Date().toISOString()
    };
    
    allUsers.push(newUser);
    saveUsers();
    filterUsers();
}

// Edit user
function editUser(id) {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;
    
    const newName = prompt('نام جدید:', user.name);
    if (newName) user.name = newName;
    
    const newEmail = prompt('ایمیل جدید:', user.email);
    if (newEmail) user.email = newEmail;
    
    const newRole = confirm('آیا این کاربر مدیر است؟') ? 'admin' : 'user';
    user.role = newRole;
    
    saveUsers();
    filterUsers();
}

// Delete user
function deleteUser(id) {
    if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
        allUsers = allUsers.filter(u => u.id !== id);
        saveUsers();
        filterUsers();
    }
}

// Helper functions
function getRoleText(role) {
    return role === 'admin' ? 'مدیر' : 'کاربر';
}

function getStatusClass(status) {
    return status === 'active' ? 'status-success' : 'status-cancelled';
}

function getStatusText(status) {
    return status === 'active' ? 'فعال' : 'غیرفعال';
}

function formatDate(dateString) {
    if (!dateString) return 'نامشخص';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(allUsers));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});


