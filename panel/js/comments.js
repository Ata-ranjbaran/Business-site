// Comments Management JavaScript

let allComments = [];
let filteredComments = [];

function loadComments() {
    const storedComments = JSON.parse(localStorage.getItem('adminComments') || '[]');
    allComments = storedComments;
    filteredComments = [...allComments];
    displayComments();
}

function displayComments() {
    const commentsList = document.getElementById('commentsList');
    const commentsCount = document.getElementById('commentsCount');
    
    commentsCount.textContent = `${filteredComments.length} نظر`;
    
    if (filteredComments.length === 0) {
        commentsList.innerHTML = '<div class="text-center text-gray-500 py-8">هیچ نظری یافت نشد</div>';
        return;
    }
    
    commentsList.innerHTML = filteredComments.map(comment => `
        <div class="card">
            <div class="card-body">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-gray-600"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h4 class="font-bold text-gray-800">${comment.name || 'کاربر ناشناس'}</h4>
                            <span class="text-sm text-gray-500">${new Date(comment.date || Date.now()).toLocaleDateString('fa-IR')}</span>
                            <span class="status-badge ${getCommentStatusClass(comment.status)}">
                                ${getCommentStatusText(comment.status)}
                            </span>
                        </div>
                        <p class="text-gray-700 mb-2">${comment.content}</p>
                        <div class="text-sm text-gray-500 mb-3">
                            <span>مقاله: ${comment.articleTitle || 'نامشخص'}</span>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-sm btn-success" onclick="approveComment(${comment.id})">
                                <i class="fas fa-check"></i> تایید
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="rejectComment(${comment.id})">
                                <i class="fas fa-times"></i> رد
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="viewComment(${comment.id})">
                                <i class="fas fa-eye"></i> مشاهده
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteComment(${comment.id})">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getCommentStatusClass(status) {
    switch(status) {
        case 'approved': return 'status-success';
        case 'rejected': return 'status-danger';
        default: return 'status-warning';
    }
}

function getCommentStatusText(status) {
    switch(status) {
        case 'approved': return 'تایید شده';
        case 'rejected': return 'رد شده';
        default: return 'در انتظار تایید';
    }
}

function filterComments() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    
    filteredComments = allComments.filter(comment => {
        const searchMatch = !searchTerm || 
            (comment.name && comment.name.toLowerCase().includes(searchTerm)) ||
            (comment.content && comment.content.toLowerCase().includes(searchTerm)) ||
            (comment.articleTitle && comment.articleTitle.toLowerCase().includes(searchTerm));
        
        const statusMatch = statusFilter === 'all' || comment.status === statusFilter;
        
        return searchMatch && statusMatch;
    });
    
    displayComments();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatus').value = 'all';
    filterComments();
}

function approveComment(id) {
    const comment = allComments.find(c => c.id === id);
    if (comment) {
        comment.status = 'approved';
        saveComments();
        filterComments();
    }
}

function rejectComment(id) {
    const comment = allComments.find(c => c.id === id);
    if (comment) {
        comment.status = 'rejected';
        saveComments();
        filterComments();
    }
}

function approveAll() {
    if (confirm('آیا از تایید همه نظرات اطمینان دارید؟')) {
        filteredComments.forEach(comment => {
            comment.status = 'approved';
        });
        saveComments();
        filterComments();
    }
}

function viewComment(id) {
    const comment = allComments.find(c => c.id === id);
    if (!comment) return;
    
    document.getElementById('modalTitle').textContent = 'مشاهده نظر';
    document.getElementById('modalBody').innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="text-sm font-bold text-gray-600">نام:</label>
                <p class="text-gray-800">${comment.name || 'نامشخص'}</p>
            </div>
            <div>
                <label class="text-sm font-bold text-gray-600">ایمیل:</label>
                <p class="text-gray-800">${comment.email || 'نامشخص'}</p>
            </div>
            <div>
                <label class="text-sm font-bold text-gray-600">مقاله:</label>
                <p class="text-gray-800">${comment.articleTitle || 'نامشخص'}</p>
            </div>
            <div>
                <label class="text-sm font-bold text-gray-600">تاریخ:</label>
                <p class="text-gray-800">${new Date(comment.date || Date.now()).toLocaleDateString('fa-IR')}</p>
            </div>
            <div>
                <label class="text-sm font-bold text-gray-600">محتوا:</label>
                <p class="text-gray-800">${comment.content}</p>
            </div>
        </div>
    `;
    document.getElementById('commentModal').classList.add('show');
    document.getElementById('approveBtn').onclick = () => { approveComment(id); closeCommentModal(); };
    document.getElementById('rejectBtn').onclick = () => { rejectComment(id); closeCommentModal(); };
}

function deleteComment(id) {
    if (confirm('آیا از حذف این نظر اطمینان دارید؟')) {
        allComments = allComments.filter(c => c.id !== id);
        saveComments();
        filterComments();
    }
}

function closeCommentModal() {
    document.getElementById('commentModal').classList.remove('show');
}

function saveComments() {
    localStorage.setItem('adminComments', JSON.stringify(allComments));
    // Trigger sync event for index.html page
    window.dispatchEvent(new CustomEvent('commentsUpdated'));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadComments();
});

