// Orders Management JavaScript

let allOrders = [];
let filteredOrders = [];

// Load orders from localStorage (from payment page)
function loadOrders() {
    // Load from orders (created in payment.html)
    const ordersData = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Convert to orders format
    allOrders = ordersData.map(order => ({
        id: order.id,
        customer: order.userName || order.customer || 'نامشخص',
        email: order.userEmail || order.email || '',
        items: order.items || [],
        total: order.total || 0,
        date: order.createdAt || order.date || new Date().toISOString(),
        status: order.status || 'pending',
        paymentMethod: order.paymentMethod || 'unknown',
        userId: order.userId || null
    }));
    
    filteredOrders = [...allOrders];
    displayOrders();
    updateStats();
    updateBadge();
}

function updateBadge() {
    const pendingCount = allOrders.filter(o => o.status === 'pending').length;
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

// Display orders
function displayOrders() {
    const ordersTable = document.getElementById('ordersTable');
    const ordersCount = document.getElementById('ordersCount');
    
    ordersCount.textContent = `${filteredOrders.length} سفارش`;
    
    if (filteredOrders.length === 0) {
        ordersTable.innerHTML = '<tr><td colspan="7" class="text-center text-gray-500 py-8">هیچ سفارشی یافت نشد</td></tr>';
        return;
    }
    
    ordersTable.innerHTML = filteredOrders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.items?.map(item => item.name).join(', ') || 'نامشخص'}</td>
            <td>${formatPrice(order.total)} ریال</td>
            <td>${formatDate(order.date)}</td>
            <td>
                <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>در انتظار</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>تکمیل شده</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>لغو شده</option>
                </select>
            </td>
            <td>
                <button class="btn-icon" onclick="viewOrder(${order.id})" title="مشاهده">
                    <i class="fas fa-eye text-blue-500"></i>
                </button>
                <button class="btn-icon" onclick="deleteOrder(${order.id})" title="حذف">
                    <i class="fas fa-trash text-red-500"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Update stats
function updateStats() {
    document.getElementById('totalOrders').textContent = allOrders.length;
    document.getElementById('completedOrders').textContent = allOrders.filter(o => o.status === 'completed').length;
    document.getElementById('pendingOrders').textContent = allOrders.filter(o => o.status === 'pending').length;
    
    const totalRevenue = allOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + (order.total || 0), 0);
    document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue) + ' ریال';
}

// Filter orders
function filterOrders() {
    const statusFilter = document.getElementById('filterStatus').value;
    const dateFilter = document.getElementById('filterDate').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredOrders = allOrders.filter(order => {
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;
        
        const dateMatch = !dateFilter || order.date.startsWith(dateFilter);
        
        const searchMatch = !searchTerm || 
            (order.customer && order.customer.toLowerCase().includes(searchTerm)) ||
            (order.items && order.items.some(item => item.name.toLowerCase().includes(searchTerm)));
        
        return statusMatch && dateMatch && searchMatch;
    });
    
    displayOrders();
}

// Clear filters
function clearFilters() {
    document.getElementById('filterStatus').value = 'all';
    document.getElementById('filterDate').value = '';
    document.getElementById('searchInput').value = '';
    filterOrders();
}

// Update order status
function updateOrderStatus(id, status) {
    const order = allOrders.find(o => o.id === id);
    if (order) {
        order.status = status;
        saveOrders();
        updateStats();
        updateBadge();
        filterOrders();
        
        // If order is approved (completed), add items to user downloads
        if (status === 'completed') {
            const allOrdersData = JSON.parse(localStorage.getItem('orders') || '[]');
            const orderData = allOrdersData.find(o => o.id === id);
            
            if (orderData && orderData.items) {
                const userDownloads = JSON.parse(localStorage.getItem('userDownloads') || '[]');
                orderData.items.forEach(item => {
                    // Check if already downloaded
                    const alreadyDownloaded = userDownloads.some(d => 
                        d.orderId === id && d.itemId === item.id
                    );
                    
                    if (!alreadyDownloaded) {
                        userDownloads.push({
                            orderId: id,
                            itemId: item.id,
                            itemName: item.name,
                            itemType: item.type,
                            downloadedAt: new Date().toISOString()
                        });
                    }
                });
                localStorage.setItem('userDownloads', JSON.stringify(userDownloads));
            }
        }
    }
}

// View order
function viewOrder(id) {
    const order = allOrders.find(o => o.id === id);
    if (!order) return;
    
    const itemsList = order.items?.map(item => 
        `- ${item.name} (${item.quantity || 1} عدد) - ${formatPrice(item.price || 0)} ریال`
    ).join('\n') || 'هیچ محصولی';
    
    alert(`جزئیات سفارش #${order.id}\n\nمشتری: ${order.customer}\nایمیل: ${order.email || 'نامشخص'}\n\nمحصولات:\n${itemsList}\n\nمبلغ کل: ${formatPrice(order.total)} ریال\nوضعیت: ${getStatusText(order.status)}\nتاریخ: ${formatDate(order.date)}`);
}

// Delete order
function deleteOrder(id) {
    if (confirm('آیا از حذف این سفارش اطمینان دارید؟')) {
        allOrders = allOrders.filter(o => o.id !== id);
        saveOrders();
        updateStats();
        filterOrders();
    }
}

// Helper functions
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateString) {
    if (!dateString) return 'نامشخص';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
}

function getStatusText(status) {
    const statusMap = {
        'completed': 'تکمیل شده',
        'pending': 'در انتظار',
        'cancelled': 'لغو شده'
    };
    return statusMap[status] || 'نامشخص';
}

function saveOrders() {
    // Update orders in localStorage
    const allOrdersData = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Update each order status
    allOrders.forEach(order => {
        const orderIndex = allOrdersData.findIndex(o => o.id === order.id);
        if (orderIndex !== -1) {
            allOrdersData[orderIndex].status = order.status;
        }
    });
    
    localStorage.setItem('orders', JSON.stringify(allOrdersData));
    
    // Dispatch event for user panel
    window.dispatchEvent(new CustomEvent('ordersUpdated'));
}

// Listen for new orders
window.addEventListener('ordersUpdated', () => {
    loadOrders();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});


