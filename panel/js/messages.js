// Messages Management JavaScript

let allMessages = [];
let filteredMessages = [];

// Load messages from localStorage - فقط پیام‌های فرم تماس با ما
function loadMessages() {
    // فقط پیام‌های فرم تماس با ما را بارگذاری می‌کنیم
    const contactMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    
    // اطمینان از اینکه همه پیام‌ها دارای فیلدهای مورد نیاز هستند
    allMessages = contactMessages.map(msg => ({
        id: msg.id || Date.now() + Math.random(),
        name: msg.name || 'نامشخص',
        email: msg.email || '',
        subject: msg.subject || 'بدون موضوع',
        message: msg.message || '',
        date: msg.date || new Date().toISOString(),
        read: msg.read !== undefined ? msg.read : false
    }));
    
    // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
    allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredMessages = [...allMessages];
    
    displayMessages();
    updateBadge();
}

// Display messages
function displayMessages() {
    const messagesList = document.getElementById('messagesList');
    const messagesCount = document.getElementById('messagesCount');
    
    messagesCount.textContent = `${filteredMessages.length} پیام`;
    
    if (filteredMessages.length === 0) {
        messagesList.innerHTML = '<div class="text-center text-gray-500 py-8">هیچ پیامی یافت نشد</div>';
        return;
    }
    
    messagesList.innerHTML = filteredMessages.map((msg, index) => `
        <div class="message-item ${msg.read ? '' : 'unread'}" data-message-id="${msg.id}" onclick="viewMessageByIndex(${index})">
            <div class="message-header">
                <div class="flex items-center gap-3">
                    ${!msg.read ? '<span class="unread-dot"></span>' : ''}
                    <span class="message-name font-semibold">${msg.name || 'نامشخص'}</span>
                    ${msg.subject ? `<span class="topic-badge">${msg.subject}</span>` : ''}
                </div>
                <div class="flex items-center gap-3">
                    <span class="message-time text-sm text-gray-500">${formatDate(msg.date)}</span>
                    <button class="btn-icon" onclick="event.stopPropagation(); deleteMessageByIndex(${index})" title="حذف">
                        <i class="fas fa-trash text-red-500"></i>
                    </button>
                </div>
            </div>
            <div class="message-text mt-2 text-gray-700">${msg.message?.substring(0, 150) || 'بدون متن'}${msg.message?.length > 150 ? '...' : ''}</div>
            ${msg.email ? `<div class="message-email mt-2"><i class="fas fa-envelope text-blue-500"></i> ${msg.email}</div>` : ''}
        </div>
    `).join('');
}

// View message by index (for filtered messages)
function viewMessageByIndex(index) {
    if (index >= 0 && index < filteredMessages.length) {
        const message = filteredMessages[index];
        viewMessage(message.id);
    }
}

// View message details
function viewMessage(id) {
    const message = allMessages.find(m => m.id === id || m.id == id);
    if (!message) return;
    
    // Mark as read
    if (!message.read) {
        message.read = true;
        saveMessages();
        updateBadge();
        displayMessages(); // به‌روزرسانی نمایش
    }
    
    // Show modal
    document.getElementById('modalTitle').textContent = `پیام از ${message.name || 'نامشخص'}`;
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="message-details space-y-4">
            <div class="detail-row flex items-center justify-between py-3 border-b border-gray-200">
                <span class="detail-label font-semibold text-gray-700">نام:</span>
                <span class="detail-value text-gray-900">${message.name || 'نامشخص'}</span>
            </div>
            ${message.email ? `
            <div class="detail-row flex items-center justify-between py-3 border-b border-gray-200">
                <span class="detail-label font-semibold text-gray-700">ایمیل:</span>
                <span class="detail-value text-gray-900">
                    <a href="mailto:${message.email}" class="text-blue-600 hover:text-blue-800">${message.email}</a>
                </span>
            </div>
            ` : ''}
            ${message.subject ? `
            <div class="detail-row flex items-center justify-between py-3 border-b border-gray-200">
                <span class="detail-label font-semibold text-gray-700">موضوع:</span>
                <span class="detail-value text-gray-900">${message.subject}</span>
            </div>
            ` : ''}
            <div class="detail-row flex items-center justify-between py-3 border-b border-gray-200">
                <span class="detail-label font-semibold text-gray-700">تاریخ و ساعت:</span>
                <span class="detail-value text-gray-900">${formatDate(message.date)}</span>
            </div>
            <div class="detail-row full-width py-3">
                <span class="detail-label font-semibold text-gray-700 block mb-2">پیام:</span>
                <div class="detail-message bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap">${message.message || 'بدون متن'}</div>
            </div>
            <div class="detail-row flex items-center justify-between py-3 border-t border-gray-200">
                <span class="detail-label font-semibold text-gray-700">وضعیت:</span>
                <span class="detail-value">
                    <span class="px-3 py-1 rounded-full text-sm ${message.read ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${message.read ? 'خوانده شده' : 'خوانده نشده'}
                    </span>
                </span>
            </div>
        </div>
    `;
    
    document.getElementById('messageModal').classList.add('show');
    document.getElementById('replyBtn').setAttribute('data-email', message.email || '');
}

// Close message modal
function closeMessageModal() {
    document.getElementById('messageModal').classList.remove('show');
}

// Delete message by index (for filtered messages)
function deleteMessageByIndex(index) {
    if (index >= 0 && index < filteredMessages.length) {
        const message = filteredMessages[index];
        deleteMessage(message.id);
    }
}

// Delete message
function deleteMessage(id) {
    if (confirm('آیا از حذف این پیام اطمینان دارید؟')) {
        allMessages = allMessages.filter(m => m.id !== id && m.id != id);
        saveMessages();
        filterMessages();
        updateBadge();
    }
}

// Mark all as read
function markAllAsRead() {
    allMessages.forEach(msg => msg.read = true);
    saveMessages();
    displayMessages();
    updateBadge();
}

// Filter messages
function filterMessages() {
    const statusFilter = document.getElementById('filterStatus').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredMessages = allMessages.filter(msg => {
        const statusMatch = statusFilter === 'all' || 
            (statusFilter === 'unread' && !msg.read) ||
            (statusFilter === 'read' && msg.read);
        
        const searchMatch = !searchTerm || 
            (msg.name && msg.name.toLowerCase().includes(searchTerm)) ||
            (msg.message && msg.message.toLowerCase().includes(searchTerm)) ||
            (msg.email && msg.email.toLowerCase().includes(searchTerm));
        
        return statusMatch && searchMatch;
    });
    
    displayMessages();
}

// Clear filters
function clearFilters() {
    document.getElementById('filterStatus').value = 'all';
    document.getElementById('searchInput').value = '';
    filterMessages();
}

// Reply to message
function replyToMessage() {
    const email = document.getElementById('replyBtn').getAttribute('data-email');
    if (email) {
        window.location.href = `mailto:${email}`;
    } else {
        alert('ایمیل کاربر موجود نیست');
    }
}

// Save messages
function saveMessages() {
    // فقط پیام‌های فرم تماس با ما را ذخیره می‌کنیم
    localStorage.setItem('contactMessages', JSON.stringify(allMessages));
}

// Update badge
function updateBadge() {
    const unreadCount = allMessages.filter(m => !m.read).length;
    document.getElementById('messagesBadge').textContent = unreadCount;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'نامشخص';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    
    // Close modal on outside click
    document.getElementById('messageModal').addEventListener('click', (e) => {
        if (e.target.id === 'messageModal') {
            closeMessageModal();
        }
    });
});


