// Categories Management JavaScript

let currentTab = 'templates'; // 'templates' or 'modules'
let templateCategories = [];
let moduleCategories = [];
let filteredCategories = [];

function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.getElementById('templatesTab').classList.toggle('active', tab === 'templates');
    document.getElementById('templatesTab').classList.toggle('border-blue-600', tab === 'templates');
    document.getElementById('templatesTab').classList.toggle('border-transparent', tab !== 'templates');
    document.getElementById('templatesTab').classList.toggle('text-gray-700', tab === 'templates');
    document.getElementById('templatesTab').classList.toggle('text-gray-500', tab !== 'templates');
    
    document.getElementById('modulesTab').classList.toggle('active', tab === 'modules');
    document.getElementById('modulesTab').classList.toggle('border-blue-600', tab === 'modules');
    document.getElementById('modulesTab').classList.toggle('border-transparent', tab !== 'modules');
    document.getElementById('modulesTab').classList.toggle('text-gray-700', tab === 'modules');
    document.getElementById('modulesTab').classList.toggle('text-gray-500', tab !== 'modules');
    
    // Update section title
    document.getElementById('sectionTitle').textContent = tab === 'templates' ? 'لیست دسته‌بندی قالب‌ها' : 'لیست دسته‌بندی ماژول‌ها';
    
    // Load and display categories for current tab
    loadCategories();
}

async function loadCategories() {
    if (currentTab === 'templates') {
        // Load categories from templates.html first
        try {
            const response = await fetch('../templates.html');
            const html = await response.text();
            
            // Method 1: Extract from filter buttons (more reliable)
            // Find all buttons with data-category attribute
            const filterButtonRegex = /<button[^>]*data-category="([^"]+)"[^>]*>/g;
            let categoriesFromButtons = [];
            let match;
            while ((match = filterButtonRegex.exec(html)) !== null) {
                const category = match[1];
                if (category && category !== 'all') {
                    categoriesFromButtons.push(category);
                }
            }
            // Remove duplicates
            categoriesFromButtons = [...new Set(categoriesFromButtons)];
            
            // Method 2: Extract from templates array (try both const and let)
            let scriptMatch = html.match(/let templates = \[([\s\S]*?)\];/);
            if (!scriptMatch) {
                scriptMatch = html.match(/const templates = \[([\s\S]*?)\];/);
            }
            let categoriesFromTemplates = [];
            if (scriptMatch) {
                try {
                    let templatesArray;
                    try {
                        templatesArray = JSON.parse('[' + scriptMatch[1] + ']');
                    } catch (e) {
                        // Try eval as fallback
                        try {
                            templatesArray = eval('[' + scriptMatch[1] + ']');
                        } catch (e2) {
                            console.error('Error parsing templates array with eval:', e2);
                            // Try to load from localStorage as fallback
                            const storedTemplates = JSON.parse(localStorage.getItem('adminTemplates') || '[]');
                            if (storedTemplates.length > 0) {
                                templatesArray = storedTemplates;
                            } else {
                                templatesArray = [];
                            }
                        }
                    }
                    
                    // Get unique categories from templates
                    if (templatesArray && templatesArray.length > 0) {
                        categoriesFromTemplates = [...new Set(templatesArray.map(t => {
                            return t.categoryName || t.category;
                        }).filter(Boolean))];
                    }
                } catch (e) {
                    console.error('Error parsing templates array:', e);
                }
            }
            
            // Method 3: Also try to get from localStorage adminTemplates
            try {
                const storedTemplates = JSON.parse(localStorage.getItem('adminTemplates') || '[]');
                if (storedTemplates.length > 0) {
                    const categoriesFromStored = [...new Set(storedTemplates.map(t => {
                        return t.categoryName || t.category;
                    }).filter(Boolean))];
                    categoriesFromTemplates = [...new Set([...categoriesFromTemplates, ...categoriesFromStored])];
                }
            } catch (e) {
                console.error('Error loading from localStorage:', e);
            }
            
            // Combine both methods and remove duplicates
            let allCategories = [...new Set([...categoriesFromButtons, ...categoriesFromTemplates])];
            
            console.log('Categories from buttons:', categoriesFromButtons);
            console.log('Categories from templates array:', categoriesFromTemplates);
            console.log('All unique categories:', allCategories);
            
            // If no categories found from buttons or array, try to get from stored
            if (allCategories.length === 0) {
                const stored = JSON.parse(localStorage.getItem('templateCategories') || '[]');
                if (stored.length > 0) {
                    allCategories = stored.map(c => c.name);
                }
            }
            
            // Icon mapping
            const iconMap = {
                'ارایشگاه': 'fas fa-cut',
                'البوم': 'fas fa-images',
                'بازی': 'fas fa-gamepad',
                'برنامه نویسی': 'fas fa-code',
                'تکنولوژی': 'fas fa-microchip',
                'تکنولوژِی': 'fas fa-microchip', // Handle typo
                'شرکتی': 'fas fa-building',
                'خانه': 'fas fa-home',
                'گردشگری': 'fas fa-plane',
                'لباس': 'fas fa-tshirt',
                'مشاوره': 'fas fa-briefcase',
                'موسیقی': 'fas fa-music'
            };
            
            // Load stored categories (user-added or edited) - but prioritize categories from templates
            const stored = JSON.parse(localStorage.getItem('templateCategories') || '[]');
            const storedMap = new Map(stored.map(c => [c.name, c]));
            
            // Create categories from templates - these are the source of truth
            if (allCategories.length > 0) {
                templateCategories = allCategories.map((catName, index) => {
                    // Check if this category exists in stored (user may have edited description/icon)
                    if (storedMap.has(catName)) {
                        const storedCat = storedMap.get(catName);
                        // Keep user edits but ensure fromTemplates flag
                        return { 
                            ...storedCat, 
                            fromTemplates: true,
                            id: storedCat.id || (index + 1),
                            name: catName // Ensure name matches exactly
                        };
                    }
                    // New category from templates
                    return {
                        id: index + 1,
                        name: catName,
                        description: `دسته‌بندی ${catName}`,
                        icon: iconMap[catName] || 'fas fa-tag',
                        fromTemplates: true
                    };
                });
                
                // Add any stored categories that are not in templates (user-added categories only)
                stored.forEach(storedCat => {
                    if (!storedCat.fromTemplates && !templateCategories.find(tc => tc.name === storedCat.name)) {
                        templateCategories.push(storedCat);
                    }
                });
            } else {
                // If no categories found from buttons/array, use stored or defaults
                templateCategories = stored.length > 0 ? stored : [
                    { id: 1, name: 'شرکتی', description: 'قالب‌های شرکتی و تجاری', icon: 'fas fa-building' },
                    { id: 2, name: 'فروشگاهی', description: 'قالب‌های فروشگاه اینترنتی', icon: 'fas fa-shopping-cart' },
                    { id: 3, name: 'شخصی', description: 'قالب‌های شخصی و پورتفولیو', icon: 'fas fa-user' }
                ];
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            templateCategories = JSON.parse(localStorage.getItem('templateCategories') || '[]');
            if (templateCategories.length === 0) {
                templateCategories = [
                    { id: 1, name: 'شرکتی', description: 'قالب‌های شرکتی و تجاری', icon: 'fas fa-building' },
                    { id: 2, name: 'فروشگاهی', description: 'قالب‌های فروشگاه اینترنتی', icon: 'fas fa-shopping-cart' },
                    { id: 3, name: 'شخصی', description: 'قالب‌های شخصی و پورتفولیو', icon: 'fas fa-user' }
                ];
            }
        }
        
        console.log('Final template categories:', templateCategories);
        saveCategories();
        filteredCategories = [...templateCategories];
    } else {
        // Load categories from modules-standalone.html first
        try {
            const response = await fetch('../modules-standalone.html');
            const html = await response.text();
            
            // Extract modules array (try both const and let)
            let scriptMatch = html.match(/let modules = \[([\s\S]*?)\];/);
            if (!scriptMatch) {
                scriptMatch = html.match(/const modules = \[([\s\S]*?)\];/);
            }
            if (scriptMatch) {
                let modulesArray;
                try {
                    modulesArray = JSON.parse('[' + scriptMatch[1] + ']');
                } catch (e) {
                    // Try eval as fallback
                    try {
                        modulesArray = eval('[' + scriptMatch[1] + ']');
                    } catch (e2) {
                        console.error('Error parsing modules array with eval:', e2);
                        // Try to load from localStorage as fallback
                        const storedModules = JSON.parse(localStorage.getItem('adminModules') || '[]');
                        if (storedModules.length > 0) {
                            modulesArray = storedModules;
                        } else {
                            modulesArray = [];
                        }
                    }
                }
                
                // Method 1: Extract from filter buttons (more reliable)
                // Find all buttons with data-category attribute
                const filterButtonRegex = /<button[^>]*data-category="([^"]+)"[^>]*>/g;
                let categoriesFromButtons = [];
                let match;
                while ((match = filterButtonRegex.exec(html)) !== null) {
                    const category = match[1];
                    if (category && category !== 'all') {
                        categoriesFromButtons.push(category);
                    }
                }
                // Remove duplicates
                categoriesFromButtons = [...new Set(categoriesFromButtons)];
                
                // Method 2: Extract from modules array
                let categoriesFromModules = [];
                if (scriptMatch && modulesArray && modulesArray.length > 0) {
                    try {
                        // Get unique categories from modules (prefer categoryName over category)
                        categoriesFromModules = [...new Set(modulesArray.map(m => {
                            // Use categoryName if available, otherwise use category
                            return m.categoryName || m.category;
                        }).filter(Boolean))];
                    } catch (e) {
                        console.error('Error parsing modules array:', e);
                    }
                }
                
                // Method 3: Also try to get from localStorage adminModules
                try {
                    const storedModules = JSON.parse(localStorage.getItem('adminModules') || '[]');
                    if (storedModules.length > 0) {
                        const categoriesFromStored = [...new Set(storedModules.map(m => {
                            return m.categoryName || m.category;
                        }).filter(Boolean))];
                        categoriesFromModules = [...new Set([...categoriesFromModules, ...categoriesFromStored])];
                    }
                } catch (e) {
                    console.error('Error loading from localStorage:', e);
                }
                
                // Combine both methods and remove duplicates
                let allCategories = [...new Set([...categoriesFromButtons, ...categoriesFromModules])];
                
                // Default module categories (always include these)
                const defaultCategoryNames = ['دکمه', 'فرم', 'کارت', 'اسلایدر', 'انیمیشنی', 'بک گراند', 'form module', 'Forms', 'لودینگ', 'منو', 'نظرات', 'Cards'];
                
                // Merge default categories with found categories
                allCategories = [...new Set([...defaultCategoryNames, ...allCategories])];
                
                console.log('Categories from buttons:', categoriesFromButtons);
                console.log('Categories from modules array:', categoriesFromModules);
                console.log('All unique categories:', allCategories);
                
                // Load stored categories (user-added or edited) - but prioritize categories from modules
                const stored = JSON.parse(localStorage.getItem('moduleCategories') || '[]');
                
                // Default module categories
                const defaultModuleCategories = [
                    { id: 1, name: 'دکمه', description: 'دسته‌بندی دکمه', icon: 'fas fa-mouse-pointer', fromModules: true },
                    { id: 2, name: 'فرم', description: 'دسته‌بندی فرم', icon: 'fas fa-edit', fromModules: true },
                    { id: 3, name: 'کارت', description: 'دسته‌بندی کارت', icon: 'fas fa-id-card', fromModules: true },
                    { id: 4, name: 'اسلایدر', description: 'دسته‌بندی اسلایدر', icon: 'fas fa-sliders-h', fromModules: true },
                    { id: 5, name: 'انیمیشنی', description: 'دسته‌بندی انیمیشنی', icon: 'fas fa-magic', fromModules: true },
                    { id: 6, name: 'بک گراند', description: 'دسته‌بندی بک گراند', icon: 'fas fa-palette', fromModules: true },
                    { id: 7, name: 'form module', description: 'دسته‌بندی form module', icon: 'fas fa-edit', fromModules: true },
                    { id: 8, name: 'Forms', description: 'دسته‌بندی Forms', icon: 'fas fa-edit', fromModules: true },
                    { id: 9, name: 'لودینگ', description: 'دسته‌بندی لودینگ', icon: 'fas fa-spinner', fromModules: true },
                    { id: 10, name: 'منو', description: 'دسته‌بندی منو', icon: 'fas fa-bars', fromModules: true },
                    { id: 11, name: 'نظرات', description: 'دسته‌بندی نظرات', icon: 'fas fa-comments', fromModules: true },
                    { id: 12, name: 'Cards', description: 'دسته‌بندی Cards', icon: 'fas fa-id-card', fromModules: true }
                ];
                
                // If no categories found from buttons or array, use default categories
                if (allCategories.length === 0) {
                    if (stored.length > 0) {
                        allCategories = stored.map(c => c.name);
                    } else {
                        // Use default module categories
                        allCategories = defaultModuleCategories.map(c => c.name);
                    }
                }
                
                // Icon mapping
                const iconMap = {
                    'button': 'fas fa-mouse-pointer',
                    'form': 'fas fa-edit',
                    'card': 'fas fa-id-card',
                    'slider': 'fas fa-sliders-h',
                    'animation': 'fas fa-magic',
                    'background': 'fas fa-palette',
                    'loading': 'fas fa-spinner',
                    'menu': 'fas fa-bars',
                    'comments': 'fas fa-comments',
                    'دکمه': 'fas fa-mouse-pointer',
                    'فرم': 'fas fa-edit',
                    'کارت': 'fas fa-id-card',
                    'اسلایدر': 'fas fa-sliders-h',
                    'انیمیشنی': 'fas fa-magic',
                    'بک گراند': 'fas fa-palette',
                    'لودینگ': 'fas fa-spinner',
                    'منو': 'fas fa-bars',
                    'نظرات': 'fas fa-comments',
                    'form module': 'fas fa-edit',
                    'Forms': 'fas fa-edit',
                    'Cards': 'fas fa-id-card'
                };
                
                const storedMap = new Map(stored.map(c => [c.name, c]));
                
                // Create categories from modules - these are the source of truth
                if (allCategories.length > 0) {
                    moduleCategories = allCategories.map((catName, index) => {
                        // Check if this category exists in stored (user may have edited description/icon)
                        if (storedMap.has(catName)) {
                            const storedCat = storedMap.get(catName);
                            // Keep user edits but ensure fromModules flag
                            return { 
                                ...storedCat, 
                                fromModules: true,
                                id: storedCat.id || (index + 1),
                                name: catName // Ensure name matches exactly
                            };
                        }
                        // New category from modules
                        return {
                            id: index + 1,
                            name: catName,
                            description: `دسته‌بندی ${catName}`,
                            icon: iconMap[catName] || 'fas fa-cube',
                            fromModules: true
                        };
                    });
                    
                    // Add any stored categories that are not in modules (user-added categories only)
                    stored.forEach(storedCat => {
                        if (!storedCat.fromModules && !moduleCategories.find(mc => mc.name === storedCat.name)) {
                            moduleCategories.push(storedCat);
                        }
                    });
                } else {
                    // If no categories found from buttons/array, use stored or defaults
                    if (stored.length > 0) {
                        moduleCategories = stored;
                    } else {
                        // Use default module categories
                        moduleCategories = [...defaultModuleCategories];
                    }
                }
            } else {
                // Fallback to stored if can't parse
                const stored = JSON.parse(localStorage.getItem('moduleCategories') || '[]');
                if (stored.length > 0) {
                    moduleCategories = stored;
                } else {
                    // Use default module categories
                    moduleCategories = [
                        { id: 1, name: 'دکمه', description: 'دسته‌بندی دکمه', icon: 'fas fa-mouse-pointer', fromModules: true },
                        { id: 2, name: 'فرم', description: 'دسته‌بندی فرم', icon: 'fas fa-edit', fromModules: true },
                        { id: 3, name: 'کارت', description: 'دسته‌بندی کارت', icon: 'fas fa-id-card', fromModules: true },
                        { id: 4, name: 'اسلایدر', description: 'دسته‌بندی اسلایدر', icon: 'fas fa-sliders-h', fromModules: true },
                        { id: 5, name: 'انیمیشنی', description: 'دسته‌بندی انیمیشنی', icon: 'fas fa-magic', fromModules: true },
                        { id: 6, name: 'بک گراند', description: 'دسته‌بندی بک گراند', icon: 'fas fa-palette', fromModules: true },
                        { id: 7, name: 'form module', description: 'دسته‌بندی form module', icon: 'fas fa-edit', fromModules: true },
                        { id: 8, name: 'Forms', description: 'دسته‌بندی Forms', icon: 'fas fa-edit', fromModules: true },
                        { id: 9, name: 'لودینگ', description: 'دسته‌بندی لودینگ', icon: 'fas fa-spinner', fromModules: true },
                        { id: 10, name: 'منو', description: 'دسته‌بندی منو', icon: 'fas fa-bars', fromModules: true },
                        { id: 11, name: 'نظرات', description: 'دسته‌بندی نظرات', icon: 'fas fa-comments', fromModules: true },
                        { id: 12, name: 'Cards', description: 'دسته‌بندی Cards', icon: 'fas fa-id-card', fromModules: true }
                    ];
                }
            }
        } catch (error) {
            console.error('Error loading modules:', error);
            const stored = JSON.parse(localStorage.getItem('moduleCategories') || '[]');
            if (stored.length > 0) {
                moduleCategories = stored;
            } else {
                // Use default module categories
                moduleCategories = [
                    { id: 1, name: 'دکمه', description: 'دسته‌بندی دکمه', icon: 'fas fa-mouse-pointer', fromModules: true },
                    { id: 2, name: 'فرم', description: 'دسته‌بندی فرم', icon: 'fas fa-edit', fromModules: true },
                    { id: 3, name: 'کارت', description: 'دسته‌بندی کارت', icon: 'fas fa-id-card', fromModules: true },
                    { id: 4, name: 'اسلایدر', description: 'دسته‌بندی اسلایدر', icon: 'fas fa-sliders-h', fromModules: true },
                    { id: 5, name: 'انیمیشنی', description: 'دسته‌بندی انیمیشنی', icon: 'fas fa-magic', fromModules: true },
                    { id: 6, name: 'بک گراند', description: 'دسته‌بندی بک گراند', icon: 'fas fa-palette', fromModules: true },
                    { id: 7, name: 'form module', description: 'دسته‌بندی form module', icon: 'fas fa-edit', fromModules: true },
                    { id: 8, name: 'Forms', description: 'دسته‌بندی Forms', icon: 'fas fa-edit', fromModules: true },
                    { id: 9, name: 'لودینگ', description: 'دسته‌بندی لودینگ', icon: 'fas fa-spinner', fromModules: true },
                    { id: 10, name: 'منو', description: 'دسته‌بندی منو', icon: 'fas fa-bars', fromModules: true },
                    { id: 11, name: 'نظرات', description: 'دسته‌بندی نظرات', icon: 'fas fa-comments', fromModules: true },
                    { id: 12, name: 'Cards', description: 'دسته‌بندی Cards', icon: 'fas fa-id-card', fromModules: true }
                ];
            }
        }
        
        console.log('Final module categories:', moduleCategories);
        saveCategories();
        filteredCategories = [...moduleCategories];
    }
    
    displayCategories();
}

function displayCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    const categoriesCount = document.getElementById('categoriesCount');
    
    categoriesCount.textContent = `${filteredCategories.length} دسته‌بندی`;
    
    if (filteredCategories.length === 0) {
        categoriesGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">هیچ دسته‌بندی‌ای یافت نشد</div>';
        return;
    }
    
    categoriesGrid.innerHTML = filteredCategories.map(category => `
        <div class="card">
            <div class="card-body">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i class="${category.icon || 'fas fa-tag'} text-blue-600 text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-800">${category.name}</h3>
                        <p class="text-sm text-gray-500">${category.description || 'بدون توضیحات'}</p>
                    </div>
                </div>
                <div class="flex gap-2 mt-4">
                    <button class="btn btn-sm btn-primary flex-1" onclick="editCategory(${category.id})">
                        <i class="fas fa-edit"></i> ویرایش
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterCategories() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categories = currentTab === 'templates' ? templateCategories : moduleCategories;
    
    filteredCategories = categories.filter(category => {
        return !searchTerm || 
            (category.name && category.name.toLowerCase().includes(searchTerm)) ||
            (category.description && category.description.toLowerCase().includes(searchTerm));
    });
    
    displayCategories();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    filterCategories();
}

function addCategory() {
    const title = currentTab === 'templates' ? 'افزودن دسته‌بندی قالب جدید' : 'افزودن دسته‌بندی ماژول جدید';
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryForm').dataset.categoryId = '';
    document.getElementById('categoryType').value = currentTab;
    document.getElementById('categoryModal').classList.add('show');
}

function editCategory(id) {
    const categories = currentTab === 'templates' ? templateCategories : moduleCategories;
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    const title = currentTab === 'templates' ? 'ویرایش دسته‌بندی قالب' : 'ویرایش دسته‌بندی ماژول';
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryIcon').value = category.icon || '';
    document.getElementById('categoryType').value = currentTab;
    document.getElementById('categoryForm').dataset.categoryId = id;
    document.getElementById('categoryModal').classList.add('show');
}

function saveCategory(event) {
    event.preventDefault();
    
    const categoryId = document.getElementById('categoryForm').dataset.categoryId;
    const name = document.getElementById('categoryName').value;
    const description = document.getElementById('categoryDescription').value;
    const icon = document.getElementById('categoryIcon').value;
    const type = document.getElementById('categoryType').value;
    
    const categories = type === 'templates' ? templateCategories : moduleCategories;
    
    if (categoryId) {
        // Edit existing
        const category = categories.find(c => c.id == categoryId);
        if (category) {
            category.name = name;
            category.description = description;
            category.icon = icon;
        }
    } else {
        // Add new
        const newCategory = {
            id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
            name: name,
            description: description,
            icon: icon || 'fas fa-tag',
            createdAt: new Date().toISOString()
        };
        categories.push(newCategory);
    }
    
    if (type === 'templates') {
        templateCategories = categories;
    } else {
        moduleCategories = categories;
    }
    
    saveCategories();
    closeCategoryModal();
    filterCategories();
}

function deleteCategory(id) {
    if (confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
        if (currentTab === 'templates') {
            templateCategories = templateCategories.filter(c => c.id !== id);
        } else {
            moduleCategories = moduleCategories.filter(c => c.id !== id);
        }
        saveCategories();
        filterCategories();
    }
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('show');
}

function saveCategories() {
    if (currentTab === 'templates') {
        localStorage.setItem('templateCategories', JSON.stringify(templateCategories));
        // Dispatch event to notify templates.html
        window.dispatchEvent(new CustomEvent('templateCategoriesUpdated'));
    } else {
        localStorage.setItem('moduleCategories', JSON.stringify(moduleCategories));
        // Dispatch event to notify modules-standalone.html
        window.dispatchEvent(new CustomEvent('moduleCategoriesUpdated'));
    }
}

function refreshCategories() {
    if (confirm('آیا می‌خواهید دسته‌بندی‌ها را از صفحات اصلی بارگذاری مجدد کنید؟ این کار دسته‌بندی‌های اضافه شده توسط شما را حفظ می‌کند.')) {
        // Clear the fromTemplates/fromModules flags to force reload
        if (currentTab === 'templates') {
            const stored = JSON.parse(localStorage.getItem('templateCategories') || '[]');
            stored.forEach(cat => {
                delete cat.fromTemplates;
            });
            localStorage.setItem('templateCategories', JSON.stringify(stored));
        } else {
            const stored = JSON.parse(localStorage.getItem('moduleCategories') || '[]');
            stored.forEach(cat => {
                delete cat.fromModules;
            });
            localStorage.setItem('moduleCategories', JSON.stringify(stored));
        }
        loadCategories();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});

