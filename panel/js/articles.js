// Articles Management JavaScript

let allArticles = [];
let filteredArticles = [];

async function loadArticles() {
    try {
        // Load from admin storage (adminBlogPosts)
        const storedArticles = JSON.parse(localStorage.getItem('adminBlogPosts') || '[]');
        
        if (storedArticles.length > 0) {
            // Use stored articles
            allArticles = storedArticles;
        } else {
            // If no stored articles, initialize with default posts
            // This should not happen if index.html has initialized them, but as fallback:
            allArticles = [
                {
                    id: 1,
                    title: "راهکارهای نوین کسب و کار",
                    category: "آموزش",
                    categoryClass: "text-blue-600 bg-blue-50",
                    date: "15 دی 1403",
                    image: "images/blog/73-min.jpg",
                    content: `<h3 class="text-2xl font-bold text-gray-900 mb-4">مقدمه</h3><p class="mb-4 text-gray-700 leading-relaxed">در دنیای امروز، استفاده از راهکارهای نوین برای رشد و توسعه کسب و کار از اهمیت بالایی برخوردار است.</p>`,
                    status: 'published',
                    author: 'مدیر',
                    views: 0
                },
                {
                    id: 2,
                    title: "بهینه‌سازی کدها",
                    category: "نکته",
                    categoryClass: "text-orange-600 bg-orange-50",
                    date: "10 دی 1403",
                    image: "images/blog/images_1700726041_655f0519383a9.jpg",
                    content: `<h3 class="text-2xl font-bold text-gray-900 mb-4">اهمیت بهینه‌سازی</h3><p class="mb-4 text-gray-700 leading-relaxed">بهینه‌سازی کدها یکی از مهم‌ترین جنبه‌های توسعه نرم‌افزار است.</p>`,
                    status: 'published',
                    author: 'مدیر',
                    views: 0
                },
                {
                    id: 3,
                    title: "روندهای جدید طراحی",
                    category: "تکنولوژی",
                    categoryClass: "text-green-600 bg-green-50",
                    date: "5 دی 1403",
                    image: "images/blog/webdesign-trends-2016.png",
                    content: `<h3 class="text-2xl font-bold text-gray-900 mb-4">طراحی در سال 2024</h3><p class="mb-4 text-gray-700 leading-relaxed">طراحی وب در سال 2024 با روندهای جدید و جالبی همراه است.</p>`,
                    status: 'published',
                    author: 'مدیر',
                    views: 0
                }
            ];
            // Save to localStorage
            saveArticles();
        }
    } catch (error) {
        console.error('Error loading articles:', error);
        const storedArticles = JSON.parse(localStorage.getItem('adminBlogPosts') || '[]');
        allArticles = storedArticles.length > 0 ? storedArticles : [];
    }
    
    filteredArticles = [...allArticles];
    displayArticles();
}

function displayArticles() {
    const tableBody = document.getElementById('articlesTable');
    const articlesCount = document.getElementById('articlesCount');
    
    articlesCount.textContent = `${filteredArticles.length} مقاله`;
    
    if (filteredArticles.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-gray-500 py-8">هیچ مقاله‌ای یافت نشد</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredArticles.map(article => `
        <tr>
            <td>${article.title || 'بدون عنوان'}</td>
            <td>${article.author || 'مدیر'}</td>
            <td><span class="${article.categoryClass || 'text-blue-600 bg-blue-50'} px-2 py-1 rounded text-xs">${article.category || 'عمومی'}</span></td>
            <td>${article.date || new Date().toLocaleDateString('fa-IR')}</td>
            <td>
                <span class="status-badge ${article.status === 'published' ? 'status-success' : 'status-warning'}">
                    ${article.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                </span>
                ${article.showOnHomepage !== false ? '<span class="text-xs text-green-600 ml-2"><i class="fas fa-home"></i> صفحه اصلی</span>' : ''}
            </td>
            <td>${article.views || 0}</td>
            <td>
                <div class="flex gap-2">
                    <button class="btn-icon" onclick="viewArticle(${article.id})" title="مشاهده">
                        <i class="fas fa-eye text-blue-600"></i>
                    </button>
                    <button class="btn-icon" onclick="editArticle(${article.id})" title="ویرایش">
                        <i class="fas fa-edit text-green-600"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteArticle(${article.id})" title="حذف">
                        <i class="fas fa-trash text-red-600"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterArticles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    
    filteredArticles = allArticles.filter(article => {
        const searchMatch = !searchTerm || 
            (article.title && article.title.toLowerCase().includes(searchTerm)) ||
            (article.content && article.content.toLowerCase().includes(searchTerm));
        
        const statusMatch = statusFilter === 'all' || article.status === statusFilter;
        
        return searchMatch && statusMatch;
    });
    
    displayArticles();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatus').value = 'all';
    filterArticles();
}

function addArticle() {
    document.getElementById('modalTitle').textContent = 'افزودن مقاله جدید';
    document.getElementById('articleForm').reset();
    document.getElementById('articleForm').dataset.articleId = '';
    document.getElementById('articleDate').value = new Date().toLocaleDateString('fa-IR');
    document.getElementById('articleCategoryClass').value = 'text-blue-600 bg-blue-50';
    document.getElementById('articleShowOnHomepage').checked = true;
    document.getElementById('articleImagePreview').style.display = 'none';
    document.getElementById('articleContentPreview').innerHTML = '<span class="text-gray-400">پیش‌نمایش در اینجا نمایش داده می‌شود...</span>';
    document.getElementById('articleModal').classList.add('show');
}

// Handle image upload
function handleArticleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('لطفاً یک فایل تصویری انتخاب کنید');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        document.getElementById('articleImage').value = imageData;
        document.getElementById('articleImagePreviewImg').src = imageData;
        document.getElementById('articleImagePreview').style.display = 'block';
        document.getElementById('articleImageUrl').value = ''; // Clear URL input
    };
    reader.readAsDataURL(file);
}

function removeArticleImage() {
    document.getElementById('articleImageFile').value = '';
    document.getElementById('articleImage').value = '';
    document.getElementById('articleImageUrl').value = '';
    document.getElementById('articleImagePreview').style.display = 'none';
}

function updateArticleImageFromUrl() {
    const url = document.getElementById('articleImageUrl').value;
    if (url) {
        document.getElementById('articleImage').value = url;
        document.getElementById('articleImagePreviewImg').src = url;
        document.getElementById('articleImagePreview').style.display = 'block';
        document.getElementById('articleImageFile').value = ''; // Clear file input
    }
}

function updateCategoryClass() {
    const category = document.getElementById('articleCategory').value;
    const categoryClassMap = {
        'آموزش': 'text-blue-600 bg-blue-50',
        'نکته': 'text-orange-600 bg-orange-50',
        'تکنولوژی': 'text-green-600 bg-green-50',
        'عمومی': 'text-gray-600 bg-gray-50'
    };
    document.getElementById('articleCategoryClass').value = categoryClassMap[category] || 'text-blue-600 bg-blue-50';
}

// Insert HTML tags into content
function insertHTMLTag(tag, text) {
    const textarea = document.getElementById('articleContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let insertText = '';
    switch(tag) {
        case 'h3':
            insertText = selectedText ? `<h3 class="text-2xl font-bold text-gray-900 mb-4">${selectedText}</h3>` : `<h3 class="text-2xl font-bold text-gray-900 mb-4">${text}</h3>`;
            break;
        case 'p':
            insertText = selectedText ? `<p class="mb-4 text-gray-700 leading-relaxed">${selectedText}</p>` : `<p class="mb-4 text-gray-700 leading-relaxed">${text}</p>`;
            break;
        case 'ul':
            insertText = selectedText ? `<ul class="list-disc list-inside mb-4 text-gray-700 space-y-2">\n    <li>${selectedText}</li>\n</ul>` : `<ul class="list-disc list-inside mb-4 text-gray-700 space-y-2">\n    <li>${text}</li>\n</ul>`;
            break;
        case 'strong':
            insertText = selectedText ? `<strong>${selectedText}</strong>` : `<strong>${text}</strong>`;
            break;
    }
    
    textarea.value = textarea.value.substring(0, start) + insertText + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    updateContentPreview();
}

// Update content preview
function updateContentPreview() {
    const content = document.getElementById('articleContent').value;
    const preview = document.getElementById('articleContentPreview');
    if (content) {
        preview.innerHTML = content;
    } else {
        preview.innerHTML = '<span class="text-gray-400">پیش‌نمایش در اینجا نمایش داده می‌شود...</span>';
    }
}

// Add event listener for content preview
document.addEventListener('DOMContentLoaded', () => {
    const contentTextarea = document.getElementById('articleContent');
    if (contentTextarea) {
        contentTextarea.addEventListener('input', updateContentPreview);
        contentTextarea.addEventListener('keyup', updateContentPreview);
    }
});

function editArticle(id) {
    const article = allArticles.find(a => a.id === id);
    if (!article) return;
    
    document.getElementById('modalTitle').textContent = 'ویرایش مقاله';
    document.getElementById('articleTitle').value = article.title || '';
    document.getElementById('articleContent').value = article.content || '';
    document.getElementById('articleCategory').value = article.category || '';
    document.getElementById('articleStatus').value = article.status || 'published';
    document.getElementById('articleDate').value = article.date || '';
    document.getElementById('articleCategoryClass').value = article.categoryClass || 'text-blue-600 bg-blue-50';
    document.getElementById('articleShowOnHomepage').checked = article.showOnHomepage !== false; // Default to true
    
    // Update content preview
    updateContentPreview();
    
    // Handle image
    if (article.image) {
        if (article.image.startsWith('data:image')) {
            // Base64 image
            document.getElementById('articleImage').value = article.image;
            document.getElementById('articleImagePreviewImg').src = article.image;
            document.getElementById('articleImagePreview').style.display = 'block';
            document.getElementById('articleImageUrl').value = '';
        } else {
            // URL image
            document.getElementById('articleImage').value = article.image;
            document.getElementById('articleImageUrl').value = article.image;
            document.getElementById('articleImagePreviewImg').src = article.image;
            document.getElementById('articleImagePreview').style.display = 'block';
        }
    } else {
        document.getElementById('articleImagePreview').style.display = 'none';
        document.getElementById('articleImageUrl').value = '';
    }
    
    document.getElementById('articleForm').dataset.articleId = id;
    document.getElementById('articleModal').classList.add('show');
}

function saveArticle(event) {
    event.preventDefault();
    
    const articleId = document.getElementById('articleForm').dataset.articleId;
    const title = document.getElementById('articleTitle').value;
    const content = document.getElementById('articleContent').value;
    const category = document.getElementById('articleCategory').value;
    const status = document.getElementById('articleStatus').value;
    const image = document.getElementById('articleImage').value || document.getElementById('articleImageUrl').value;
    const date = document.getElementById('articleDate').value;
    const categoryClass = document.getElementById('articleCategoryClass').value;
    const showOnHomepage = document.getElementById('articleShowOnHomepage').checked;
    
    // Map category to categoryClass if not provided
    const categoryClassMap = {
        'آموزش': 'text-blue-600 bg-blue-50',
        'نکته': 'text-orange-600 bg-orange-50',
        'تکنولوژی': 'text-green-600 bg-green-50',
        'عمومی': 'text-gray-600 bg-gray-50'
    };
    const finalCategoryClass = categoryClass || categoryClassMap[category] || 'text-blue-600 bg-blue-50';
    
    if (articleId) {
        // Edit existing
        const article = allArticles.find(a => a.id == articleId);
        if (article) {
            article.title = title;
            article.content = content;
            article.category = category || 'عمومی';
            article.categoryClass = finalCategoryClass;
            article.status = status;
            article.image = image;
            article.date = date || new Date().toLocaleDateString('fa-IR');
            article.showOnHomepage = showOnHomepage;
            article.updatedAt = new Date().toISOString();
        }
    } else {
        // Add new
        const newArticle = {
            id: allArticles.length > 0 ? Math.max(...allArticles.map(a => a.id)) + 1 : 1,
            title: title,
            content: content,
            category: category || 'عمومی',
            categoryClass: finalCategoryClass,
            status: status,
            image: image,
            date: date || new Date().toLocaleDateString('fa-IR'),
            showOnHomepage: showOnHomepage,
            author: 'مدیر',
            views: 0,
            createdAt: new Date().toISOString()
        };
        allArticles.push(newArticle);
    }
    
    saveArticles();
    closeArticleModal();
    filterArticles();
}

function deleteArticle(id) {
    if (confirm('آیا از حذف این مقاله اطمینان دارید؟')) {
        allArticles = allArticles.filter(a => a.id !== id);
        saveArticles();
        filterArticles();
    }
}

function viewArticle(id) {
    const article = allArticles.find(a => a.id === id);
    if (!article) return;
    
    window.open(`../index.html#blog`, '_blank');
}

function closeArticleModal() {
    document.getElementById('articleModal').classList.remove('show');
    // Reset form
    document.getElementById('articleForm').reset();
    document.getElementById('articleImagePreview').style.display = 'none';
    document.getElementById('articleForm').dataset.articleId = '';
}

function saveArticles() {
    localStorage.setItem('adminBlogPosts', JSON.stringify(allArticles));
    // Trigger sync event for index.html page
    window.dispatchEvent(new CustomEvent('blogPostsUpdated'));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
});

