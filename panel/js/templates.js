// Templates Management JavaScript

let allTemplates = [];
let filteredTemplates = [];

// Load templates from templates.html file
async function loadTemplates() {
    try {
        // Try to load from admin storage first (for edited templates)
        const storedTemplates = JSON.parse(localStorage.getItem('adminTemplates') || '[]');
        
        // Load from templates.html file
        const response = await fetch('../templates.html');
        const html = await response.text();
        
        // Extract templates array from script tag
        const scriptMatch = html.match(/const templates = \[([\s\S]*?)\];/);
        if (scriptMatch) {
            // Try to parse as JSON first, if that fails, use eval
            let templatesArray;
            try {
                templatesArray = JSON.parse('[' + scriptMatch[1] + ']');
            } catch (e) {
                // If JSON parsing fails, use eval (safe in this context)
                templatesArray = eval('[' + scriptMatch[1] + ']');
            }
            
            // Convert to admin format and merge with stored templates
            const loadedTemplates = templatesArray.map(t => ({
                id: t.id,
                name: t.title || t.name || 'قالب بدون نام',
                categoryName: t.categoryName || t.category || 'عمومی',
                price: t.price || 0,
                pricingType: t.pricingType || (t.price > 0 ? 'paid' : 'free'),
                description: t.description || '',
                htmlPath: t.htmlPath || '',
                folderPath: t.folderPath || '',
                size: t.size || 0,
                languages: t.languages || ['HTML', 'CSS', 'JS'],
                downloads: t.downloads || 0,
                sales: t.sales || 0
            }));
            
            // Merge with stored templates (edited ones take priority)
            const storedMap = new Map(storedTemplates.map(t => [t.id, t]));
            allTemplates = loadedTemplates.map(t => {
                const stored = storedMap.get(t.id);
                return stored ? { ...t, ...stored } : t;
            });
            
            // Add any new templates from stored that don't exist in loaded
            storedTemplates.forEach(stored => {
                if (!allTemplates.find(t => t.id === stored.id)) {
                    allTemplates.push(stored);
                }
            });
        } else if (storedTemplates.length > 0) {
            allTemplates = storedTemplates;
        } else {
            allTemplates = [];
        }
    } catch (error) {
        console.error('Error loading templates:', error);
        // Fallback to stored templates
        const storedTemplates = JSON.parse(localStorage.getItem('adminTemplates') || '[]');
        allTemplates = storedTemplates;
    }
    
    filteredTemplates = [...allTemplates];
    loadCategories();
    displayTemplates();
}

// Load categories for filter
function loadCategories() {
    const categories = [...new Set(allTemplates.map(t => t.categoryName).filter(Boolean))];
    const filterCategory = document.getElementById('filterCategory');
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filterCategory.appendChild(option);
    });
}

// Display templates
function displayTemplates() {
    const templatesGrid = document.getElementById('templatesGrid');
    const templatesCount = document.getElementById('templatesCount');
    
    templatesCount.textContent = `${filteredTemplates.length} قالب`;
    
    if (filteredTemplates.length === 0) {
        templatesGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-gray-500 mb-4">
                    <i class="fas fa-file-code text-6xl mb-4"></i>
                    <p class="text-xl mb-2">هیچ قالبی یافت نشد</p>
                    <p class="text-sm mb-6">برای شروع، یک قالب جدید اضافه کنید</p>
                    <button class="btn btn-primary" onclick="addTemplate()">
                        <i class="fas fa-plus"></i> افزودن قالب جدید
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    templatesGrid.innerHTML = filteredTemplates.map(template => `
        <div class="product-card">
            <div class="product-image">
                ${template.htmlPath ? `
                    <iframe src="${template.htmlPath}" style="width: 100%; height: 100%; border: none; pointer-events: none;" loading="lazy"></iframe>
                ` : `
                    <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <i class="fas fa-file-code text-4xl"></i>
                    </div>
                `}
                ${template.zipData ? '<div class="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded"><i class="fas fa-file-archive"></i> ZIP</div>' : ''}
                <div class="product-overlay">
                    ${template.htmlPath ? `<button class="btn-icon" onclick="viewTemplate(${template.id})" title="مشاهده">
                        <i class="fas fa-eye text-white"></i>
                    </button>` : ''}
                    <button class="btn-icon" onclick="editTemplate(${template.id})" title="ویرایش">
                        <i class="fas fa-edit text-white"></i>
                    </button>
                    ${template.zipData ? `<button class="btn-icon" onclick="downloadTemplateZip(${template.id})" title="دانلود ZIP">
                        <i class="fas fa-download text-white"></i>
                    </button>` : ''}
                    <button class="btn-icon" onclick="deleteTemplate(${template.id})" title="حذف">
                        <i class="fas fa-trash text-white"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${template.name}</h3>
                <div class="product-meta">
                    <span class="product-category">${template.categoryName || 'بدون دسته'}</span>
                    <span class="product-price">${template.pricingType === 'free' ? 'رایگان' : formatPrice(template.price) + ' ریال'}</span>
                </div>
                <div class="product-stats">
                    <span><i class="fas fa-download"></i> ${template.downloads || 0}</span>
                    <span><i class="fas fa-shopping-cart"></i> ${template.sales || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter templates
function filterTemplates() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const pricingFilter = document.getElementById('filterPricing').value;
    
    filteredTemplates = allTemplates.filter(template => {
        const searchMatch = !searchTerm || 
            (template.name && template.name.toLowerCase().includes(searchTerm)) ||
            (template.description && template.description.toLowerCase().includes(searchTerm));
        
        const categoryMatch = categoryFilter === 'all' || template.categoryName === categoryFilter;
        
        const pricingMatch = pricingFilter === 'all' || 
            (pricingFilter === 'free' && template.pricingType === 'free') ||
            (pricingFilter === 'paid' && template.pricingType === 'paid');
        
        return searchMatch && categoryMatch && pricingMatch;
    });
    
    displayTemplates();
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('filterPricing').value = 'all';
    filterTemplates();
}

// Add template
function addTemplate() {
    document.getElementById('modalTitle').textContent = 'افزودن قالب جدید';
    document.getElementById('templateForm').reset();
    document.getElementById('templateForm').dataset.templateId = '';
    document.getElementById('templatePrice').value = '0';
    document.getElementById('templatePricingType').value = 'free';
    document.getElementById('templatePreviewFrame').style.display = 'none';
    document.getElementById('templateZipInfo').style.display = 'none';
    document.getElementById('templateZipContents').style.display = 'none';
    updatePricingType();
    document.getElementById('templateModal').classList.add('show');
}

function updatePricingType() {
    const pricingType = document.getElementById('templatePricingType').value;
    const priceInput = document.getElementById('templatePrice');
    if (pricingType === 'free') {
        priceInput.value = '0';
        priceInput.disabled = true;
    } else {
        priceInput.disabled = false;
    }
}

function saveTemplate(event) {
    event.preventDefault();
    
    const templateId = document.getElementById('templateForm').dataset.templateId;
    const name = document.getElementById('templateName').value;
    const category = document.getElementById('templateCategory').value;
    const price = parseInt(document.getElementById('templatePrice').value) || 0;
    const pricingType = document.getElementById('templatePricingType').value;
    const description = document.getElementById('templateDescription').value;
    const htmlPath = document.getElementById('templateHtmlPath').value;
    const zipData = document.getElementById('templateZipData').value;
    
    if (templateId) {
        // Edit existing
        const template = allTemplates.find(t => t.id == templateId);
        if (template) {
            template.name = name;
            template.categoryName = category || 'عمومی';
            template.price = pricingType === 'paid' ? price : 0;
            template.pricingType = pricingType;
            template.description = description;
            template.htmlPath = htmlPath;
            if (zipData) template.zipData = zipData;
            if (document.getElementById('templateZipFileListData').value) {
                template.zipFileList = JSON.parse(document.getElementById('templateZipFileListData').value);
            }
        }
    } else {
        // Add new
        const newTemplate = {
            id: 'admin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            name: name,
            categoryName: category || 'عمومی',
            price: pricingType === 'paid' ? price : 0,
            pricingType: pricingType,
            description: description,
            htmlPath: htmlPath,
            folderPath: htmlPath ? htmlPath.substring(0, htmlPath.lastIndexOf('/')) : '',
            zipData: zipData || '',
            zipFileList: document.getElementById('templateZipFileListData').value ? 
                JSON.parse(document.getElementById('templateZipFileListData').value) : [],
            downloads: 0,
            sales: 0,
            size: 0,
            languages: ['HTML', 'CSS', 'JS']
        };
        allTemplates.push(newTemplate);
    }
    
    saveTemplates();
    closeTemplateModal();
    loadCategories();
    filterTemplates();
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.remove('show');
    // Reset form
    document.getElementById('templateForm').reset();
    document.getElementById('templatePreviewFrame').style.display = 'none';
    document.getElementById('templateZipInfo').style.display = 'none';
    document.getElementById('templateZipContents').style.display = 'none';
    document.getElementById('templateForm').dataset.templateId = '';
}

// Edit template
function editTemplate(id) {
    const template = allTemplates.find(t => t.id === id);
    if (!template) return;
    
    document.getElementById('modalTitle').textContent = 'ویرایش قالب';
    document.getElementById('templateName').value = template.name;
    document.getElementById('templateCategory').value = template.categoryName || '';
    document.getElementById('templatePrice').value = template.price || 0;
    document.getElementById('templatePricingType').value = template.pricingType || 'free';
    document.getElementById('templateDescription').value = template.description || '';
    document.getElementById('templateHtmlPath').value = template.htmlPath || '';
    document.getElementById('templateZipData').value = template.zipData || '';
    
    // Show iframe preview if htmlPath exists
    if (template.htmlPath) {
        document.getElementById('templatePreviewIframe').src = '../' + template.htmlPath;
        document.getElementById('templatePreviewFrame').style.display = 'block';
    } else {
        document.getElementById('templatePreviewFrame').style.display = 'none';
    }
    
    // Show ZIP info if exists
    if (template.zipData) {
        document.getElementById('templateZipInfo').innerHTML = '<i class="fas fa-check-circle text-green-600"></i> فایل ZIP قبلاً بارگذاری شده است';
        document.getElementById('templateZipInfo').style.display = 'block';
        document.getElementById('templateZipContents').style.display = 'block';
        // Try to extract file list from ZIP
        if (template.zipFileList) {
            document.getElementById('templateZipFileList').innerHTML = template.zipFileList.map(file => `<li>${file}</li>`).join('');
        }
    } else {
        document.getElementById('templateZipInfo').style.display = 'none';
        document.getElementById('templateZipContents').style.display = 'none';
    }
    
    document.getElementById('templateForm').dataset.templateId = id;
    updatePricingType();
    document.getElementById('templateModal').classList.add('show');
}

// Delete template
function deleteTemplate(id) {
    if (confirm('آیا از حذف این قالب اطمینان دارید؟')) {
        // Add to deleted templates list
        const deletedTemplates = JSON.parse(localStorage.getItem('deletedTemplates') || '[]');
        if (!deletedTemplates.includes(id)) {
            deletedTemplates.push(id);
            localStorage.setItem('deletedTemplates', JSON.stringify(deletedTemplates));
        }
        
        // Remove from all templates
        allTemplates = allTemplates.filter(t => t.id !== id);
        saveTemplates();
        filterTemplates();
    }
}

// View template
function viewTemplate(id) {
    const template = allTemplates.find(t => t.id === id);
    if (!template || !template.htmlPath) return;
    
    window.open('../' + template.htmlPath, '_blank');
}

function downloadTemplateZip(id) {
    const template = allTemplates.find(t => t.id === id);
    if (!template || !template.zipData) {
        alert('فایل ZIP برای این قالب موجود نیست');
        return;
    }
    
    // Convert base64 to blob and download
    const base64Data = template.zipData.split(',')[1] || template.zipData;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/zip' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name || 'template'}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Helper functions
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function saveTemplates() {
    localStorage.setItem('adminTemplates', JSON.stringify(allTemplates));
    // Trigger sync event for templates.html page
    window.dispatchEvent(new CustomEvent('templatesUpdated'));
}

// Handle HTML path change for preview
function updateTemplatePreview() {
    const htmlPath = document.getElementById('templateHtmlPath').value;
    if (htmlPath) {
        document.getElementById('templatePreviewIframe').src = '../' + htmlPath;
        document.getElementById('templatePreviewFrame').style.display = 'block';
    } else {
        document.getElementById('templatePreviewFrame').style.display = 'none';
    }
}

// Handle ZIP upload
async function handleTemplateZipUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.zip')) {
        alert('لطفاً یک فایل ZIP انتخاب کنید');
        return;
    }
    
    try {
        document.getElementById('templateZipInfo').textContent = 'در حال بارگذاری و باز کردن فایل...';
        document.getElementById('templateZipInfo').style.display = 'block';
        
        // Read ZIP file
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('templateZipData').value = e.target.result;
        };
        reader.readAsDataURL(file);
        
        // Display file list
        const fileList = [];
        zip.forEach((relativePath, file) => {
            if (!file.dir) {
                fileList.push(relativePath);
            }
        });
        
        // Store file list for later use
        const fileListElement = document.getElementById('templateZipFileList');
        fileListElement.innerHTML = fileList.map(file => `<li>${file}</li>`).join('');
        
        // Store file list in a hidden field for saving
        document.getElementById('templateZipFileListData').value = JSON.stringify(fileList);
        
        document.getElementById('templateZipInfo').innerHTML = `
            <i class="fas fa-check-circle text-green-600"></i> 
            فایل با موفقیت بارگذاری شد (${fileList.length} فایل)
        `;
        document.getElementById('templateZipContents').style.display = 'block';
        
    } catch (error) {
        console.error('Error reading ZIP file:', error);
        alert('خطا در خواندن فایل ZIP: ' + error.message);
        document.getElementById('templateZipInfo').textContent = 'خطا در بارگذاری فایل';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
});


