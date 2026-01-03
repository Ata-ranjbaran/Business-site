// Modules Management JavaScript (similar to templates.js)

let allModules = [];
let filteredModules = [];
let currentPage = 1;
const itemsPerPage = 50;

// Load modules from modules-standalone.html file
async function loadModules() {
    try {
        // Try to load from admin storage first (for edited modules)
        const storedModules = JSON.parse(localStorage.getItem('adminModules') || '[]');
        
        // Load from modules-standalone.html file
        const response = await fetch('../modules-standalone.html');
        const html = await response.text();
        
        // Extract modules array from script tag - use regex with proper matching
        let modulesArray = null;
        
        // Try to find the modules array using regex (greedy to get full array)
        // Look for const modules = [...] followed by ]; and then syncAdminModules or other code
        let modulesMatch = html.match(/const\s+modules\s*=\s*\[([\s\S]*?)\];\s*(?:function|const|let|var|//)/);
        if (!modulesMatch) {
            modulesMatch = html.match(/let\s+modules\s*=\s*\[([\s\S]*?)\];\s*(?:function|const|let|var|//)/);
        }
        
        // If still not found, try without the following pattern (just find ];)
        if (!modulesMatch) {
            // Find const modules = [ and then find the matching ]; by looking ahead
            const modulesStart = html.indexOf('const modules = [');
            if (modulesStart === -1) {
                const letStart = html.indexOf('let modules = [');
                if (letStart !== -1) {
                    const bracketStart = html.indexOf('[', letStart);
                    const bracketEnd = html.indexOf('];', bracketStart);
                    if (bracketEnd !== -1) {
                        const arrayContent = html.substring(bracketStart + 1, bracketEnd);
                        modulesMatch = { 1: arrayContent };
                    }
                }
            } else {
                const bracketStart = html.indexOf('[', modulesStart);
                const bracketEnd = html.indexOf('];', bracketStart);
                if (bracketEnd !== -1) {
                    const arrayContent = html.substring(bracketStart + 1, bracketEnd);
                    modulesMatch = { 1: arrayContent };
                }
            }
        }
        
        if (modulesMatch && modulesMatch[1]) {
            console.log('Found modules array, content length:', modulesMatch[1].length);
            try {
                // Try to parse as JSON first
                modulesArray = JSON.parse('[' + modulesMatch[1] + ']');
                console.log('✅ Parsed modules array successfully, count:', modulesArray.length);
            } catch (e) {
                console.log('JSON parse failed, trying eval...', e.message);
                // If JSON parsing fails, use eval (safe in this context)
                try {
                    modulesArray = eval('[' + modulesMatch[1] + ']');
                    console.log('✅ Eval successful, count:', modulesArray ? modulesArray.length : 0);
                } catch (e2) {
                    console.error('❌ Both JSON and eval failed:', e2.message);
                    console.error('Error details:', e2);
                    modulesArray = null;
                }
            }
        } else {
            console.warn('⚠️ Could not find modules array in HTML');
        }
        
        if (modulesArray && Array.isArray(modulesArray) && modulesArray.length > 0) {
            console.log('✅ Processing', modulesArray.length, 'modules from modules-standalone.html');
            
            // Convert to admin format and merge with stored modules
            const loadedModules = modulesArray.map(m => ({
                id: m.id,
                name: m.title || m.name || 'ماژول بدون نام',
                categoryName: m.categoryName || m.category || 'عمومی',
                price: m.price || 0,
                pricingType: m.pricingType || (m.price > 0 ? 'paid' : 'free'),
                description: m.description || '',
                htmlPath: m.htmlPath || '',
                folderPath: m.folderPath || '',
                size: m.size || 0,
                languages: m.languages || ['HTML', 'CSS', 'JS'],
                downloads: m.downloads || 0,
                sales: m.sales || 0
            }));
            
            console.log('✅ Converted', loadedModules.length, 'modules to admin format');
            
            // Merge with stored modules (edited ones take priority)
            const storedMap = new Map(storedModules.map(m => [m.id, m]));
            allModules = loadedModules.map(m => {
                const stored = storedMap.get(m.id);
                return stored ? { ...m, ...stored } : m;
            });
            
            // Add any new modules from stored that don't exist in loaded
            storedModules.forEach(stored => {
                if (!allModules.find(m => m.id === stored.id)) {
                    allModules.push(stored);
                }
            });
            
            console.log('✅ Final allModules count:', allModules.length);
        } else {
            console.warn('⚠️ modulesArray is empty or not found');
            if (storedModules.length > 0) {
                console.log('Using stored modules instead, count:', storedModules.length);
                allModules = storedModules;
            } else {
                console.warn('⚠️ No modules found in localStorage either');
                allModules = [];
            }
        }
    } catch (error) {
        console.error('Error loading modules:', error);
        // Fallback to stored modules
        const storedModules = JSON.parse(localStorage.getItem('adminModules') || '[]');
        allModules = storedModules;
    }
    
    filteredModules = [...allModules];
    loadCategories();
    displayModules();
    
    // Setup iframes for modules with zipHtmlContent or htmlPath (only for current page)
    setTimeout(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentModules = filteredModules.slice(startIndex, endIndex);
        
        currentModules.forEach(module => {
            const iframe = document.getElementById(`preview-${module.id}`);
            if (!iframe) return;
            
            if (module.zipHtmlContent && !module.htmlPath) {
                // Use blob URL from ZIP content
                try {
                    const blob = new Blob([module.zipHtmlContent], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);
                    iframe.src = blobUrl;
                } catch (e) {
                    console.error('Error creating blob URL for module:', module.id, e);
                }
            } else if (module.htmlPath) {
                // Use htmlPath (relative or absolute)
                if (module.htmlPath.startsWith('http') || module.htmlPath.startsWith('blob:')) {
                    iframe.src = module.htmlPath;
                } else {
                    iframe.src = '../' + module.htmlPath;
                }
            }
        });
    }, 100);
}

function loadCategories() {
    // Load categories from localStorage (managed by admin panel)
    const storedCategories = JSON.parse(localStorage.getItem('moduleCategories') || '[]');
    const categories = storedCategories.length > 0 
        ? storedCategories.map(c => c.name)
        : [...new Set(allModules.map(m => m.categoryName).filter(Boolean))];
    
    // Update filter dropdown
    const filterCategory = document.getElementById('filterCategory');
    filterCategory.innerHTML = '<option value="all">همه دسته‌بندی‌ها</option>';
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filterCategory.appendChild(option);
    });
    
    // Update module category dropdown in modal
    const moduleCategory = document.getElementById('moduleCategory');
    if (moduleCategory) {
        moduleCategory.innerHTML = '<option value="">انتخاب دسته‌بندی</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            moduleCategory.appendChild(option);
        });
    }
}

function toggleCustomCategory() {
    const customInput = document.getElementById('moduleCategoryCustom');
    const selectInput = document.getElementById('moduleCategory');
    
    if (customInput.style.display === 'none') {
        customInput.style.display = 'block';
        selectInput.style.display = 'none';
        customInput.value = '';
    } else {
        customInput.style.display = 'none';
        selectInput.style.display = 'block';
        customInput.value = '';
    }
}

function displayModules() {
    const modulesGrid = document.getElementById('modulesGrid');
    const modulesCount = document.getElementById('modulesCount');
    
    const totalPages = Math.ceil(filteredModules.length / itemsPerPage);
    modulesCount.textContent = `${filteredModules.length} ماژول${totalPages > 1 ? ` (صفحه ${currentPage} از ${totalPages})` : ''}`;
    
    if (filteredModules.length === 0) {
        modulesGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-gray-500 mb-4">
                    <i class="fas fa-cube text-6xl mb-4"></i>
                    <p class="text-xl mb-2">هیچ ماژولی یافت نشد</p>
                    <p class="text-sm mb-6">برای شروع، یک ماژول جدید اضافه کنید</p>
                    <button class="btn btn-primary" onclick="addModule()">
                        <i class="fas fa-plus"></i> افزودن ماژول جدید
                    </button>
                </div>
            </div>
        `;
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentModules = filteredModules.slice(startIndex, endIndex);
    
    modulesGrid.innerHTML = currentModules.map(module => `
        <div class="product-card">
            <div class="product-image">
                ${(module.htmlPath || module.zipHtmlContent) ? `
                    <iframe id="preview-${module.id}" src="" style="width: 100%; height: 100%; border: none; pointer-events: none;" loading="lazy"></iframe>
                ` : `
                    <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <i class="fas fa-cube text-4xl"></i>
                    </div>
                `}
                ${module.zipData ? '<div class="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded"><i class="fas fa-file-archive"></i> ZIP</div>' : ''}
                <div class="product-overlay">
                    ${module.htmlPath ? `<button class="btn-icon" onclick="viewModule('${module.id}')" title="مشاهده">
                        <i class="fas fa-eye text-white"></i>
                    </button>` : ''}
                    <button class="btn-icon" onclick="editModule('${module.id}')" title="ویرایش">
                        <i class="fas fa-edit text-white"></i>
                    </button>
                    ${module.zipData ? `<button class="btn-icon" onclick="downloadModuleZip('${module.id}')" title="دانلود ZIP">
                        <i class="fas fa-download text-white"></i>
                    </button>` : ''}
                    <button class="btn-icon" onclick="deleteModule('${module.id}')" title="حذف">
                        <i class="fas fa-trash text-white"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${module.name || 'ماژول بدون نام'}</h3>
                <div class="product-meta">
                    <span class="product-category">${module.categoryName || 'بدون دسته'}</span>
                    <span class="product-price">${module.pricingType === 'free' ? '🆓 رایگان' : '💳 ' + formatPrice(module.price) + ' ریال'}</span>
                </div>
                <div class="text-sm text-gray-600 mt-2">
                    ${module.description ? `<p class="truncate">${module.description}</p>` : ''}
                </div>
                <div class="product-stats mt-2">
                    <span><i class="fas fa-download"></i> ${module.downloads || 0}</span>
                    <span><i class="fas fa-shopping-cart"></i> ${module.sales || 0}</span>
                    ${module.size ? `<span><i class="fas fa-weight"></i> ${formatFileSize(module.size)}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    // Render pagination
    renderPagination(totalPages);
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="flex items-center justify-center gap-2 mt-6">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="btn btn-secondary" onclick="goToPage(${currentPage - 1})">
            <i class="fas fa-chevron-right"></i> قبلی
        </button>`;
    }
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `<button class="btn btn-secondary" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="px-2">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="px-2">...</span>`;
        }
        paginationHTML += `<button class="btn btn-secondary" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="btn btn-secondary" onclick="goToPage(${currentPage + 1})">
            بعدی <i class="fas fa-chevron-left"></i>
        </button>`;
    }
    
    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredModules.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayModules();
        // Scroll to top of grid
        document.getElementById('modulesGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filterModules() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const pricingFilter = document.getElementById('filterPricing').value;
    
    filteredModules = allModules.filter(module => {
        const searchMatch = !searchTerm || 
            (module.name && module.name.toLowerCase().includes(searchTerm)) ||
            (module.description && module.description.toLowerCase().includes(searchTerm));
        
        const categoryMatch = categoryFilter === 'all' || module.categoryName === categoryFilter;
        
        const pricingMatch = pricingFilter === 'all' || 
            (pricingFilter === 'free' && module.pricingType === 'free') ||
            (pricingFilter === 'paid' && module.pricingType === 'paid');
        
        return searchMatch && categoryMatch && pricingMatch;
    });
    
    displayModules();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('filterPricing').value = 'all';
    filterModules();
}

function addModule() {
    document.getElementById('modalTitle').textContent = 'افزودن ماژول جدید';
    document.getElementById('moduleForm').reset();
    document.getElementById('moduleForm').dataset.moduleId = '';
    document.getElementById('modulePrice').value = '0';
    document.getElementById('modulePricingType').value = 'free';
    document.getElementById('modulePreviewFrame').style.display = 'none';
    document.getElementById('moduleZipInfo').style.display = 'none';
    document.getElementById('moduleZipContents').style.display = 'none';
    
    // Reset category fields
    document.getElementById('moduleCategory').style.display = 'block';
    document.getElementById('moduleCategory').value = '';
    document.getElementById('moduleCategoryCustom').style.display = 'none';
    document.getElementById('moduleCategoryCustom').value = '';
    
    // Load categories for dropdown
    loadCategories();
    updatePricingType();
    document.getElementById('moduleModal').classList.add('show');
}

function updatePricingType() {
    const pricingType = document.getElementById('modulePricingType').value;
    const priceInput = document.getElementById('modulePrice');
    if (pricingType === 'free') {
        priceInput.value = '0';
        priceInput.disabled = true;
    } else {
        priceInput.disabled = false;
    }
}

function saveModule(event) {
    event.preventDefault();
    
    const moduleId = document.getElementById('moduleForm').dataset.moduleId;
    const name = document.getElementById('moduleName').value;
    const categorySelect = document.getElementById('moduleCategory');
    const categoryCustom = document.getElementById('moduleCategoryCustom');
    const category = categoryCustom.style.display !== 'none' && categoryCustom.value 
        ? categoryCustom.value 
        : categorySelect.value;
    const price = parseInt(document.getElementById('modulePrice').value) || 0;
    const pricingType = document.getElementById('modulePricingType').value;
    const description = document.getElementById('moduleDescription').value;
    let htmlPath = document.getElementById('moduleHtmlPath').value.trim();
    const zipData = document.getElementById('moduleZipData').value;
    const zipHtmlContent = document.getElementById('moduleZipHtmlContent').value;
    const zipHtmlPath = document.getElementById('moduleZipHtmlPath').value;
    
    // If htmlPath is empty but we have HTML content from ZIP, leave htmlPath empty
    // We'll use zipHtmlContent to create blob URL when displaying
    if (!htmlPath && zipHtmlContent) {
        htmlPath = ''; // Keep it empty to use zipHtmlContent
    }
    
    if (moduleId) {
        // Edit existing
        const module = allModules.find(m => m.id == moduleId || m.id === moduleId);
        if (module) {
            module.name = name;
            module.categoryName = category || 'عمومی';
            module.price = pricingType === 'paid' ? price : 0;
            module.pricingType = pricingType;
            module.description = description;
            // Only set htmlPath if user manually entered it, otherwise keep it empty to use zipHtmlContent
            module.htmlPath = htmlPath || '';
            if (zipData) module.zipData = zipData;
            if (zipHtmlContent) {
                module.zipHtmlContent = zipHtmlContent;
                // If we have zipHtmlContent and no htmlPath, ensure htmlPath stays empty
                if (!htmlPath) {
                    module.htmlPath = '';
                }
            }
            if (zipHtmlPath) module.zipHtmlPath = zipHtmlPath;
            if (document.getElementById('moduleZipFileListData').value) {
                module.zipFileList = JSON.parse(document.getElementById('moduleZipFileListData').value);
            }
        }
    } else {
        // Add new
        const newModule = {
            id: 'admin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            name: name,
            categoryName: category || 'عمومی',
            price: pricingType === 'paid' ? price : 0,
            pricingType: pricingType,
            description: description,
            htmlPath: htmlPath || '', // Only set if user manually entered a path
            folderPath: htmlPath ? htmlPath.substring(0, htmlPath.lastIndexOf('/')) : '',
            zipData: zipData || '',
            zipHtmlContent: zipHtmlContent || '', // HTML content from ZIP
            zipHtmlPath: zipHtmlPath || '', // Path to index.html in ZIP
            zipFileList: document.getElementById('moduleZipFileListData').value ? 
                JSON.parse(document.getElementById('moduleZipFileListData').value) : [],
            downloads: 0,
            sales: 0,
            size: 0,
            languages: ['HTML', 'CSS', 'JS']
        };
        allModules.push(newModule);
    }
    
    saveModules();
    closeModuleModal();
    loadCategories();
    filterModules();
}

function closeModuleModal() {
    document.getElementById('moduleModal').classList.remove('show');
    // Reset form
    document.getElementById('moduleForm').reset();
    document.getElementById('modulePreviewFrame').style.display = 'none';
    document.getElementById('moduleZipInfo').style.display = 'none';
    document.getElementById('moduleZipContents').style.display = 'none';
    document.getElementById('moduleForm').dataset.moduleId = '';
}

function editModule(id) {
    const module = allModules.find(m => m.id === id || m.id == id);
    if (!module) {
        console.error('Module not found:', id, 'Available modules:', allModules.map(m => m.id));
        alert('ماژول یافت نشد!');
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'ویرایش ماژول';
    document.getElementById('moduleName').value = module.name;
    
    // Set category in select dropdown
    const categorySelect = document.getElementById('moduleCategory');
    const categoryCustom = document.getElementById('moduleCategoryCustom');
    const categoryValue = module.categoryName || '';
    
    if (categorySelect.querySelector(`option[value="${categoryValue}"]`)) {
        categorySelect.value = categoryValue;
        categorySelect.style.display = 'block';
        categoryCustom.style.display = 'none';
    } else {
        categorySelect.value = '';
        categorySelect.style.display = 'none';
        categoryCustom.style.display = 'block';
        categoryCustom.value = categoryValue;
    }
    
    document.getElementById('modulePrice').value = module.price || 0;
    document.getElementById('modulePricingType').value = module.pricingType || 'free';
    document.getElementById('moduleDescription').value = module.description || '';
    document.getElementById('moduleHtmlPath').value = module.htmlPath || '';
    document.getElementById('moduleZipData').value = module.zipData || '';
    document.getElementById('moduleZipHtmlContent').value = module.zipHtmlContent || '';
    document.getElementById('moduleZipHtmlPath').value = module.zipHtmlPath || '';
    
    // Show iframe preview if htmlPath exists or we have ZIP HTML content
    if (module.htmlPath) {
        document.getElementById('modulePreviewIframe').src = '../' + module.htmlPath;
        document.getElementById('modulePreviewFrame').style.display = 'block';
    } else if (module.zipHtmlContent) {
        // Create blob URL from ZIP HTML content
        const blob = new Blob([module.zipHtmlContent], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        document.getElementById('modulePreviewIframe').src = blobUrl;
        document.getElementById('modulePreviewFrame').style.display = 'block';
    } else {
        document.getElementById('modulePreviewFrame').style.display = 'none';
    }
    
    // Show ZIP info if exists
    if (module.zipData) {
        document.getElementById('moduleZipInfo').innerHTML = '<i class="fas fa-check-circle text-green-600"></i> فایل ZIP قبلاً بارگذاری شده است';
        document.getElementById('moduleZipInfo').style.display = 'block';
        document.getElementById('moduleZipContents').style.display = 'block';
        // Try to extract file list from ZIP
        if (module.zipFileList) {
            document.getElementById('moduleZipFileList').innerHTML = module.zipFileList.map(file => `<li>${file}</li>`).join('');
        }
    } else {
        document.getElementById('moduleZipInfo').style.display = 'none';
        document.getElementById('moduleZipContents').style.display = 'none';
    }
    
    document.getElementById('moduleForm').dataset.moduleId = id;
    updatePricingType();
    document.getElementById('moduleModal').classList.add('show');
}

function deleteModule(id) {
    if (confirm('آیا از حذف این ماژول اطمینان دارید؟')) {
        // Add to deleted modules list
        const deletedModules = JSON.parse(localStorage.getItem('deletedModules') || '[]');
        if (!deletedModules.includes(id)) {
            deletedModules.push(id);
            localStorage.setItem('deletedModules', JSON.stringify(deletedModules));
        }
        
        // Remove from all modules
        allModules = allModules.filter(m => m.id !== id && m.id != id);
        saveModules();
        loadCategories();
        filterModules();
    }
}

function viewModule(id) {
    const module = allModules.find(m => m.id === id);
    if (!module || !module.htmlPath) return;
    
    window.open('../' + module.htmlPath, '_blank');
}

function downloadModuleZip(id) {
    const module = allModules.find(m => m.id === id);
    if (!module || !module.zipData) {
        alert('فایل ZIP برای این ماژول موجود نیست');
        return;
    }
    
    // Convert base64 to blob and download
    const base64Data = module.zipData.split(',')[1] || module.zipData;
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
    a.download = `${module.name || 'module'}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function saveModules() {
    localStorage.setItem('adminModules', JSON.stringify(allModules));
    // Trigger sync event for modules-standalone.html page
    window.dispatchEvent(new CustomEvent('modulesUpdated'));
}

// Handle HTML path change for preview
function updateModulePreview() {
    const htmlPath = document.getElementById('moduleHtmlPath').value;
    const zipHtmlContent = document.getElementById('moduleZipHtmlContent').value;
    
    if (htmlPath) {
        document.getElementById('modulePreviewIframe').src = '../' + htmlPath;
        document.getElementById('modulePreviewFrame').style.display = 'block';
    } else if (zipHtmlContent) {
        // Use blob URL from ZIP content
        try {
            const blob = new Blob([zipHtmlContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            document.getElementById('modulePreviewIframe').src = blobUrl;
            document.getElementById('modulePreviewFrame').style.display = 'block';
        } catch (e) {
            console.error('Error creating blob URL for preview:', e);
            document.getElementById('modulePreviewFrame').style.display = 'none';
        }
    } else {
        document.getElementById('modulePreviewFrame').style.display = 'none';
    }
}

// Handle ZIP upload
async function handleModuleZipUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.zip')) {
        alert('لطفاً یک فایل ZIP انتخاب کنید');
        return;
    }
    
    try {
        document.getElementById('moduleZipInfo').textContent = 'در حال بارگذاری و باز کردن فایل...';
        document.getElementById('moduleZipInfo').style.display = 'block';
        
        // Read ZIP file
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('moduleZipData').value = e.target.result;
        };
        reader.readAsDataURL(file);
        
        // Display file list and find index.html
        const fileList = [];
        let indexHtmlPath = null;
        let indexHtmlContent = null;
        
        zip.forEach((relativePath, zipFile) => {
            if (!zipFile.dir) {
                fileList.push(relativePath);
                // Find index.html (case insensitive, check root and subdirectories)
                const lowerPath = relativePath.toLowerCase();
                if (lowerPath === 'index.html' || lowerPath.endsWith('/index.html')) {
                    if (!indexHtmlPath || lowerPath === 'index.html') {
                        indexHtmlPath = relativePath;
                    }
                }
            }
        });
        
        // If index.html found, extract ONLY its content (not other files)
        if (indexHtmlPath) {
            try {
                // Extract only the HTML content from index.html
                indexHtmlContent = await zip.file(indexHtmlPath).async('string');
                
                // Store HTML content in hidden fields
                document.getElementById('moduleZipHtmlContent').value = indexHtmlContent;
                document.getElementById('moduleZipHtmlPath').value = indexHtmlPath;
                
                // Clear htmlPath field - we'll use zipHtmlContent instead (no URL needed)
                document.getElementById('moduleHtmlPath').value = '';
                
                // Show preview using blob URL
                const blob = new Blob([indexHtmlContent], { type: 'text/html' });
                const blobUrl = URL.createObjectURL(blob);
                document.getElementById('modulePreviewIframe').src = blobUrl;
                document.getElementById('modulePreviewFrame').style.display = 'block';
            } catch (e) {
                console.error('Error extracting index.html:', e);
                alert('خطا در استخراج فایل index.html از ZIP');
            }
        } else {
            // No index.html found - clear fields
            document.getElementById('moduleZipHtmlContent').value = '';
            document.getElementById('moduleZipHtmlPath').value = '';
            document.getElementById('moduleHtmlPath').value = '';
        }
        
        const fileListElement = document.getElementById('moduleZipFileList');
        fileListElement.innerHTML = fileList.map(file => {
            const isIndex = file.toLowerCase().endsWith('index.html');
            return `<li ${isIndex ? 'style="color: green; font-weight: bold;"' : ''}>${file} ${isIndex ? '✓' : ''}</li>`;
        }).join('');
        
        // Store file list in a hidden field for saving
        document.getElementById('moduleZipFileListData').value = JSON.stringify(fileList);
        
        let infoMessage = `<i class="fas fa-check-circle text-green-600"></i> فایل با موفقیت بارگذاری شد (${fileList.length} فایل)`;
        if (indexHtmlPath) {
            infoMessage += `<br><i class="fas fa-file-code text-blue-600"></i> فایل index.html پیدا شد: <code>${indexHtmlPath}</code>`;
        } else {
            infoMessage += `<br><i class="fas fa-exclamation-triangle text-yellow-600"></i> فایل index.html پیدا نشد. لطفاً مسیر HTML را به صورت دستی وارد کنید.`;
        }
        
        document.getElementById('moduleZipInfo').innerHTML = infoMessage;
        document.getElementById('moduleZipContents').style.display = 'block';
        
    } catch (error) {
        console.error('Error reading ZIP file:', error);
        alert('خطا در خواندن فایل ZIP: ' + error.message);
        document.getElementById('moduleZipInfo').textContent = 'خطا در بارگذاری فایل';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadModules();
});


