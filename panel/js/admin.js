// Admin Panel JavaScript

// Sidebar Toggle
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// Load Dashboard Data
function loadDashboardData() {
    // Load from localStorage
    const templates = JSON.parse(localStorage.getItem('templates') || '[]');
    const modules = JSON.parse(localStorage.getItem('modules') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');

    // Update Stats
    const totalTemplatesEl = document.getElementById('totalTemplates');
    const totalModulesEl = document.getElementById('totalModules');
    const todayOrdersEl = document.getElementById('todayOrders');
    const newMessagesEl = document.getElementById('newMessages');
    const messagesBadgeEl = document.getElementById('messagesBadge');
    
    if (totalTemplatesEl) totalTemplatesEl.textContent = templates.length;
    if (totalModulesEl) totalModulesEl.textContent = modules.length;
    
    // Today's orders
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.date).toDateString();
        return orderDate === today;
    });
    if (todayOrdersEl) todayOrdersEl.textContent = todayOrders.length;

    // New messages (unread)
    const newMessages = messages.filter(msg => !msg.read);
    if (newMessagesEl) newMessagesEl.textContent = newMessages.length;
    if (messagesBadgeEl) messagesBadgeEl.textContent = newMessages.length;

    // Revenue calculations
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const todayRevenueEl = document.getElementById('todayRevenue');
    if (todayRevenueEl) todayRevenueEl.textContent = formatPrice(todayRevenue) + ' ریال';

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
    });
    const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const monthRevenueEl = document.getElementById('monthRevenue');
    if (monthRevenueEl) monthRevenueEl.textContent = formatPrice(monthRevenue) + ' ریال';

    // Total users
    const totalUsersEl = document.getElementById('totalUsers');
    if (totalUsersEl) totalUsersEl.textContent = users.length;

    // Recent Orders
    displayRecentOrders(orders.slice(-5).reverse());

    // Recent Messages
    displayRecentMessages(messages.slice(-5).reverse());

    // Top Products
    displayTopProducts(orders);

    // Cart Statistics
    displayCartStats(cartData, orders);
}

// Display Recent Orders
function displayRecentOrders(orders) {
    const tableBody = document.getElementById('recentOrdersTable');
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-8">هیچ سفارشی یافت نشد</td></tr>';
        return;
    }

    tableBody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id || 'N/A'}</td>
            <td>${order.customer || 'نامشخص'}</td>
            <td>${order.items?.map(item => item.name).join(', ') || 'نامشخص'}</td>
            <td>${formatPrice(order.total || 0)} ریال</td>
            <td><span class="status-badge ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></td>
        </tr>
    `).join('');
}

// Display Recent Messages
function displayRecentMessages(messages) {
    const messagesList = document.getElementById('recentMessagesList');
    if (!messagesList) return;
    
    if (messages.length === 0) {
        messagesList.innerHTML = '<div class="text-center text-gray-500 py-8">هیچ پیامی یافت نشد</div>';
        return;
    }

    messagesList.innerHTML = messages.map(msg => `
        <div class="message-item" onclick="window.location.href='messages.html?id=${msg.id}'">
            <div class="message-header">
                <span class="message-name">${msg.name || 'نامشخص'}</span>
                <span class="message-time">${formatDate(msg.date)}</span>
            </div>
            <div class="message-text">${(msg.message || msg.text || '').substring(0, 100)}...</div>
        </div>
    `).join('');
}

// Display Top Products
function displayTopProducts(orders) {
    const productSales = {};
    
    orders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                const itemName = item.name || item.title || 'نامشخص';
                if (!productSales[itemName]) {
                    productSales[itemName] = 0;
                }
                productSales[itemName] += item.quantity || 1;
            });
        }
    });

    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const topProductsList = document.getElementById('topProductsList');
    if (!topProductsList) return;
    
    if (topProducts.length === 0) {
        topProductsList.innerHTML = '<div class="text-center text-gray-500 py-8">هیچ فروشی ثبت نشده</div>';
        return;
    }

    topProductsList.innerHTML = topProducts.map(([name, sales]) => `
        <div class="product-stat-item">
            <span class="product-name">${name}</span>
            <span class="product-sales">${sales} فروش</span>
        </div>
    `).join('');
}

// Display Cart Statistics
function displayCartStats(cartData, orders) {
    // Active carts (carts with items)
    const activeCarts = cartData.length;
    const activeCartsEl = document.getElementById('activeCarts');
    if (activeCartsEl) activeCartsEl.textContent = activeCarts;

    // Average items per cart
    const totalItems = cartData.reduce((sum, cart) => sum + (cart.items?.length || 0), 0);
    const avgItems = activeCarts > 0 ? Math.round(totalItems / activeCarts) : 0;
    const avgCartItemsEl = document.getElementById('avgCartItems');
    if (avgCartItemsEl) avgCartItemsEl.textContent = avgItems;

    // Conversion rate (orders / total carts)
    const totalCarts = activeCarts + orders.length;
    const conversionRate = totalCarts > 0 ? Math.round((orders.length / totalCarts) * 100) : 0;
    const conversionRateEl = document.getElementById('conversionRate');
    if (conversionRateEl) conversionRateEl.textContent = conversionRate + '%';

    // Total items added to cart
    const totalCartItemsEl = document.getElementById('totalCartItems');
    if (totalCartItemsEl) totalCartItemsEl.textContent = totalItems;
}

// Helper Functions
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateString) {
    if (!dateString) return 'نامشخص';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
}

function getStatusClass(status) {
    const statusMap = {
        'completed': 'status-success',
        'pending': 'status-pending',
        'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
}

function getStatusText(status) {
    const statusMap = {
        'completed': 'تکمیل شده',
        'pending': 'در انتظار',
        'cancelled': 'لغو شده'
    };
    return statusMap[status] || 'نامشخص';
}

function viewMessage(id) {
    window.location.href = `messages.html?id=${id}`;
}

// Update orders badge
function updateOrdersBadge() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const badge = document.getElementById('ordersBadge');
    if (badge) {
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Update support badge
function updateSupportBadge() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const currentUserId = currentUser ? (currentUser.email || currentUser.id || 'anonymous') : 'anonymous';
    
    // Find last admin message time for current user
    const adminMessages = chatHistory.filter(msg => msg.sender === 'admin' && msg.targetUserId === currentUserId);
    const lastAdminTime = adminMessages.length > 0 
        ? Math.max(...adminMessages.map(m => new Date(m.timestamp || 0).getTime()))
        : 0;
    
    // Count unread user messages (after last admin message)
    const unreadCount = chatHistory.filter(msg => {
        if (msg.sender !== 'user' || (msg.userId || currentUserId) !== currentUserId) return false;
        const msgTime = new Date(msg.timestamp || msg.time || 0).getTime();
        return msgTime > lastAdminTime;
    }).length;
    
    const badge = document.getElementById('supportBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Initialize support badge on page load
if (typeof updateSupportBadge === 'function') {
    updateSupportBadge();
    setInterval(updateSupportBadge, 5000);
}

// Listen for order updates
window.addEventListener('ordersUpdated', () => {
    updateOrdersBadge();
    loadDashboardData();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    updateOrdersBadge();
    
    // Update badges periodically
    setInterval(() => {
        loadDashboardData();
        updateOrdersBadge();
    }, 30000); // Update every 30 seconds
});

