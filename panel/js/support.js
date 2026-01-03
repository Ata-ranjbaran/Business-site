// Online Support Management JavaScript

let allChats = [];
let currentUserId = null;
let currentChat = [];

// Load chat history from localStorage
function loadChats() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    
    console.log('=== loadChats called ===');
    console.log('Total messages in chatHistory:', chatHistory.length);
    console.log('User messages:', chatHistory.filter(m => m.sender === 'user').length);
    console.log('Admin messages:', chatHistory.filter(m => m.sender === 'admin').length);
    
    // Group messages by actual user (not currentUser which is admin)
    const userChats = {};
    
    // Process all messages and group by actual userId
    chatHistory.forEach((msg, index) => {
        // Only process user messages (not admin messages for grouping)
        if (msg.sender === 'user') {
            // Get the actual userId from the message (not from currentUser)
            // Priority: userEmail (most unique) > userId (if it's an email) > userId (as fallback)
            // Use email as primary identifier since it's more unique
            let userId = null;
            
            // First try to get userEmail
            if (msg.userEmail && msg.userEmail !== '' && msg.userEmail !== 'null' && msg.userEmail !== 'undefined') {
                userId = msg.userEmail;
            } 
            // If userEmail is not available, check if userId is an email
            else if (msg.userId && typeof msg.userId === 'string' && msg.userId.includes('@')) {
                userId = msg.userId;
            }
            // Otherwise use userId as fallback (but only if it's valid)
            else if (msg.userId && msg.userId !== '' && msg.userId !== 'null' && msg.userId !== 'undefined' && msg.userId !== 'anonymous') {
                userId = msg.userId;
            }
            
            // Skip if userId is still null, anonymous, or invalid
            if (!userId || userId === 'anonymous' || userId === 'null' || userId === 'undefined' || userId === '') {
                console.log('Skipping invalid message:', {
                    userId: msg.userId,
                    userEmail: msg.userEmail,
                    userName: msg.userName,
                    text: msg.text ? msg.text.substring(0, 20) : 'no text'
                });
                return; // Skip invalid messages
            }
            
            console.log('Processing user message:', {
                index,
                userId: userId,
                msgUserId: msg.userId,
                msgUserEmail: msg.userEmail,
                userName: msg.userName
            });
            
            // Ensure timestamp exists
            if (!msg.timestamp) {
                if (msg.time) {
                    msg.timestamp = convertTimeToISO(msg.time, index);
                } else {
                    msg.timestamp = new Date().toISOString();
                }
            }
            
            // Initialize user chat if not exists
            // Use the determined userId (which should be email if available)
            const chatUserId = userId; // Use the processed userId
            
            if (!userChats[chatUserId]) {
                console.log('Creating new chat for user:', {
                    chatUserId: chatUserId,
                    userName: msg.userName,
                    userEmail: msg.userEmail
                });
                userChats[chatUserId] = {
                    userId: chatUserId, // Use email as primary identifier
                    userName: msg.userName || msg.userEmail || chatUserId || 'کاربر ناشناس',
                    userEmail: msg.userEmail || (chatUserId.includes('@') ? chatUserId : ''),
                    lastMessage: (msg.text && msg.text.trim()) || (msg.image ? '📷 تصویر' : ''),
                    lastMessageTime: msg.timestamp || new Date().toISOString(),
                    lastAdminMessageTime: null,
                    unreadCount: 0,
                    messages: []
                };
            }
            
            // Add message to user's chat
            userChats[chatUserId].messages.push(msg);
            
            // Update last message and time
            const msgTime = new Date(msg.timestamp || 0);
            const lastTime = new Date(userChats[chatUserId].lastMessageTime || 0);
            if (msgTime > lastTime) {
                userChats[chatUserId].lastMessage = (msg.text && msg.text.trim()) || (msg.image ? '📷 تصویر' : '');
                userChats[chatUserId].lastMessageTime = msg.timestamp;
            }
        } else if (msg.sender === 'admin' && msg.targetUserId) {
            // Update last admin message time for the target user
            // targetUserId should be email, but check both
            const targetUserId = msg.targetUserId;
            // Find chat by userId or userEmail
            const targetChat = Object.values(userChats).find(c => 
                c.userId === targetUserId || 
                c.userEmail === targetUserId ||
                c.userId === targetUserId
            );
            
            if (targetChat) {
                const userId = targetChat.userId;
                if (!msg.timestamp) {
                    msg.timestamp = new Date().toISOString();
                }
                const adminTime = new Date(msg.timestamp || 0);
                const lastAdminTime = targetChat.lastAdminMessageTime ? new Date(targetChat.lastAdminMessageTime) : new Date(0);
                if (adminTime > lastAdminTime) {
                    targetChat.lastAdminMessageTime = msg.timestamp;
                }
            }
        }
    });
    
    // Calculate unread count (user messages after last admin message)
    Object.values(userChats).forEach(chat => {
        if (chat.lastAdminMessageTime) {
            const unreadMessages = chat.messages.filter(msg => {
                const msgTime = new Date(msg.timestamp || 0);
                const lastAdminTime = new Date(chat.lastAdminMessageTime);
                return msgTime > lastAdminTime;
            });
            chat.unreadCount = unreadMessages.length;
        } else {
            // If admin never replied, all messages are unread
            chat.unreadCount = chat.messages.length;
        }
    });
    
    allChats = Object.values(userChats);
    allChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    
    console.log('=== loadChats results ===');
    console.log('Total chats found:', allChats.length);
    console.log('Chats:', allChats.map(c => ({
        userId: c.userId,
        userEmail: c.userEmail,
        userName: c.userName,
        messageCount: c.messages.length,
        lastMessage: c.lastMessage.substring(0, 30)
    })));
    
    displayUsers();
    updateSupportBadge();
}

// Update support badge in sidebar
function updateSupportBadge() {
    const totalUnread = allChats.reduce((sum, chat) => sum + chat.unreadCount, 0);
    const badge = document.getElementById('supportBadge');
    if (badge) {
        if (totalUnread > 0) {
            badge.textContent = totalUnread;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // Also update in all other pages
    const allBadges = document.querySelectorAll('#supportBadge');
    allBadges.forEach(b => {
        if (totalUnread > 0) {
            b.textContent = totalUnread;
            b.style.display = 'inline-block';
        } else {
            b.style.display = 'none';
        }
    });
}

// Convert time string to ISO timestamp
function convertTimeToISO(timeString, index) {
    // Try to parse time string (format: "HH:MM")
    try {
        const now = new Date();
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        // Subtract index minutes to create unique timestamps
        date.setMinutes(date.getMinutes() - index);
        return date.toISOString();
    } catch (e) {
        // If parsing fails, use current time minus index minutes
        const date = new Date();
        date.setMinutes(date.getMinutes() - index);
        return date.toISOString();
    }
}

// Display users list
function displayUsers() {
    const usersList = document.getElementById('usersList');
    
    console.log('=== displayUsers called ===');
    console.log('usersList element:', usersList);
    console.log('allChats.length:', allChats.length);
    
    if (!usersList) {
        console.error('usersList element not found!');
        return;
    }
    
    if (allChats.length === 0) {
        console.log('No chats found, showing empty message');
        usersList.innerHTML = '<div class="text-center text-gray-500 py-4">هیچ کاربری یافت نشد</div>';
        return;
    }
    
    console.log('Rendering', allChats.length, 'chats');
    
    usersList.innerHTML = allChats.map(chat => `
        <div class="user-info cursor-pointer hover:bg-gray-50 transition ${currentUserId === chat.userId ? 'bg-blue-50 border-blue-300' : ''}" 
             onclick="selectUser('${chat.userId}')">
            <div class="user-avatar-container">
                <div class="user-avatar user">
                    ${chat.userName.charAt(0).toUpperCase()}
                </div>
                <span class="online-indicator"></span>
            </div>
            <div class="flex-1">
                <div class="font-semibold text-gray-900">${chat.userName}</div>
                <div class="text-sm text-gray-500">${chat.lastMessage.substring(0, 30)}${chat.lastMessage.length > 30 ? '...' : ''}</div>
                <div class="text-xs text-gray-400 mt-1">${formatTime(chat.lastMessageTime)}</div>
            </div>
            ${chat.unreadCount > 0 ? `<span class="badge">${chat.unreadCount}</span>` : ''}
        </div>
    `).join('');
}

// Select user and load chat
function selectUser(userId) {
    console.log('=== selectUser called ===');
    console.log('Selected userId:', userId);
    console.log('Available chats:', allChats.map(c => ({
        userId: c.userId,
        userName: c.userName,
        messageCount: c.messages.length
    })));
    
    currentUserId = userId;
    
    // Find chat by userId or userEmail (since we use email as primary identifier)
    const chat = allChats.find(c => 
        c.userId === userId || 
        c.userEmail === userId ||
        (c.userId && c.userId === userId)
    );
    
    if (!chat) {
        console.log('✗ Chat not found for userId:', userId);
        console.log('Available chats:', allChats.map(c => ({
            userId: c.userId,
            userEmail: c.userEmail,
            userName: c.userName
        })));
        return;
    }
    
    console.log('✓ Chat found:', {
        userId: chat.userId,
        userEmail: chat.userEmail,
        userName: chat.userName,
        messageCount: chat.messages.length
    });
    
    // Use chat.userId (which should be email-based) for filtering
    const actualUserId = chat.userId;
    
    // Mark as read (reset unread count)
    chat.unreadCount = 0;
    chat.lastAdminMessageTime = new Date().toISOString();
    
    // Load chat messages
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const currentUserName = currentUser ? (currentUser.name || currentUser.email || 'کاربر') : 'کاربر ناشناس';
    
    // Filter and process messages - ensure proper timestamp handling
    // Include all messages (with or without text, with or without image) for the selected user
    // Use actualUserId (from chat) which is email-based
    const filterUserId = actualUserId || userId;
    console.log('=== Filtering messages for userId:', filterUserId, '===');
    console.log('Original userId:', userId, 'Actual userId from chat:', actualUserId);
    console.log('Total chatHistory messages:', chatHistory.length);
    
    // Log all user messages to see their userIds
    const allUserMessages = chatHistory.filter(m => m.sender === 'user');
    console.log('All user messages:', allUserMessages.map(m => ({
        userId: m.userId,
        userEmail: m.userEmail,
        userName: m.userName,
        text: m.text ? m.text.substring(0, 20) : 'no text'
    })));
    
    currentChat = chatHistory
        .filter(msg => {
            // User messages: check if userId or userEmail matches exactly
            if (msg.sender === 'user') {
                // Get userId from message (priority: userEmail > userId for consistency)
                const msgUserEmail = msg.userEmail || null;
                const msgUserId = msg.userId || null;
                
                // Log every user message for debugging
                console.log('Checking user message:', {
                    selectedUserId: filterUserId,
                    msgUserId: msgUserId,
                    msgUserEmail: msgUserEmail,
                    userName: msg.userName,
                    text: msg.text ? msg.text.substring(0, 20) : 'no text',
                    userIdMatch: msgUserId === filterUserId,
                    emailMatch: msgUserEmail === filterUserId
                });
                
                // Exact match required - check both userEmail (primary) and userId (fallback) against selected userId
                // Since we use email as primary identifier, check email first
                let matches = false;
                if (msgUserEmail && msgUserEmail === filterUserId) {
                    matches = true;
                    console.log('✓ Matched by userEmail (primary)');
                } else if (msgUserId && msgUserId === filterUserId) {
                    matches = true;
                    console.log('✓ Matched by userId (fallback)');
                } else {
                    console.log('✗ No match - message belongs to different user');
                }
                
                // Only return true if exact match and valid userId
                if (!matches) {
                    return false;
                }
                
                // Ensure we have a valid userId (either from msgUserEmail or msgUserId)
                const validUserId = msgUserEmail || msgUserId;
                const isValid = validUserId && 
                       validUserId !== 'anonymous' && 
                       validUserId !== 'null' && 
                       validUserId !== 'undefined' &&
                       validUserId !== '';
                
                if (isValid) {
                    console.log('✓ Message accepted for user:', filterUserId);
                } else {
                    console.log('✗ Message rejected - invalid userId');
                }
                
                return isValid;
            }
            // Admin messages: check if targetUserId matches exactly
            if (msg.sender === 'admin') {
                const matches = msg.targetUserId === filterUserId || msg.targetUserId === userId;
                if (matches) {
                    console.log('✓ Admin message matches user:', filterUserId);
                } else {
                    console.log('✗ Admin message does not match:', {
                        targetUserId: msg.targetUserId,
                        selectedUserId: filterUserId,
                        originalUserId: userId
                    });
                }
                return matches;
            }
            return false;
        });
    
    console.log('=== Filter Results ===');
    console.log('Filtered messages count:', currentChat.length);
    console.log('Filtered messages details:', currentChat.map(m => ({
        sender: m.sender,
        userId: m.userId,
        userEmail: m.userEmail,
        userName: m.userName,
        text: m.text ? m.text.substring(0, 30) : 'no text',
        hasImage: !!m.image
    })));
    
    currentChat = currentChat
        .map((msg, index) => {
            // Create a copy to avoid mutating original - preserve ALL fields including image, text, topic
            const processedMsg = {
                ...msg,
                image: msg.image, // Explicitly preserve image field
                text: msg.text,   // Explicitly preserve text field
                topic: msg.topic  // Explicitly preserve topic field
            };
            
            // Debug: log if message has image
            if (msg.image) {
                console.log('Processing message with image in map:', {
                    index,
                    sender: msg.sender,
                    userId: msg.userId,
                    text: msg.text,
                    topic: msg.topic,
                    hasImage: !!processedMsg.image,
                    imageType: typeof processedMsg.image,
                    imageLength: processedMsg.image ? processedMsg.image.length : 0
                });
            }
            
            // Add missing fields for user messages
            if (processedMsg.sender === 'user') {
                if (!processedMsg.userId) processedMsg.userId = userId;
                if (!processedMsg.userName) processedMsg.userName = currentUserName;
                
                // Ensure timestamp exists - use existing timestamp or create from time
                if (!processedMsg.timestamp) {
                    if (processedMsg.time) {
                        // Try to convert time string to proper timestamp
                        try {
                            const [hours, minutes] = processedMsg.time.split(':').map(Number);
                            const date = new Date();
                            date.setHours(hours, minutes, 0, 0);
                            // If time seems to be in the future, assume it's from today
                            if (date > new Date()) {
                                date.setDate(date.getDate() - 1);
                            }
                            processedMsg.timestamp = date.toISOString();
                        } catch (e) {
                            // Fallback: use current time minus index minutes
                            const fallbackDate = new Date();
                            fallbackDate.setMinutes(fallbackDate.getMinutes() - (chatHistory.length - index));
                            processedMsg.timestamp = fallbackDate.toISOString();
                        }
                    } else {
                        // No time or timestamp - use index-based fallback
                        const fallbackDate = new Date();
                        fallbackDate.setMinutes(fallbackDate.getMinutes() - (chatHistory.length - index));
                        processedMsg.timestamp = fallbackDate.toISOString();
                    }
                }
            }
            
            // Add missing fields for admin messages
            if (processedMsg.sender === 'admin') {
                if (!processedMsg.timestamp) {
                    if (processedMsg.time) {
                        try {
                            const [hours, minutes] = processedMsg.time.split(':').map(Number);
                            const date = new Date();
                            date.setHours(hours, minutes, 0, 0);
                            if (date > new Date()) {
                                date.setDate(date.getDate() - 1);
                            }
                            processedMsg.timestamp = date.toISOString();
                        } catch (e) {
                            const fallbackDate = new Date();
                            fallbackDate.setMinutes(fallbackDate.getMinutes() - (chatHistory.length - index - 1));
                            processedMsg.timestamp = fallbackDate.toISOString();
                        }
                    } else {
                        const fallbackDate = new Date();
                        fallbackDate.setMinutes(fallbackDate.getMinutes() - (chatHistory.length - index - 1));
                        processedMsg.timestamp = fallbackDate.toISOString();
                    }
                }
            }
            
            return processedMsg;
        })
        .sort((a, b) => {
            // Sort by timestamp - oldest first (ascending)
            // Always use timestamp if available, it's more reliable
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            
            // If timestamps are equal or very close (within 1 second), maintain original order
            if (Math.abs(timeA - timeB) < 1000) {
                return 0;
            }
            
            // Ascending order (oldest first)
            return timeA - timeB;
        });
    
    // Update UI
    document.getElementById('chatTitle').textContent = `چت با ${chat.userName}`;
    document.getElementById('chatInputArea').style.display = 'flex';
    
    displayChat();
    displayUsers(); // Update selected user highlight
    updateSupportBadge(); // Update badge after marking as read
}

// Display chat messages
function displayChat() {
    const chatMessages = document.getElementById('chatMessages');
    
    if (currentChat.length === 0) {
        chatMessages.innerHTML = '<div class="text-center text-gray-500 py-8">هنوز پیامی رد و بدل نشده است</div>';
        return;
    }
    
    // Get user name from current chat
    const userMsg = currentChat.find(msg => msg.sender === 'user');
    const userName = userMsg ? (userMsg.userName || 'کاربر') : 'کاربر';
    
    // Clear and rebuild chat messages using DOM to properly handle images
    chatMessages.innerHTML = '';
    
    console.log('Filtered messages count:', currentChat.length);
    console.log('Messages with images:', currentChat.filter(m => m.image).length);
    
    currentChat.forEach((msg, idx) => {
        const isAdmin = msg.sender === 'admin';
        const time = formatTime(msg.timestamp || msg.time || new Date().toISOString());
        const displayName = isAdmin ? 'پشتیبانی' : userName;
        const displayText = (msg.text || '').trim();
        
        // Debug: log messages with images
        if (msg.image) {
            console.log('Processing message with image:', {
                idx,
                sender: msg.sender,
                text: displayText,
                hasImage: !!msg.image,
                imageType: typeof msg.image,
                imageLength: msg.image ? msg.image.length : 0
            });
        }
        
        // Create message container
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isAdmin ? 'admin' : 'user'}`;
        
        // Create avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = `user-avatar ${isAdmin ? 'admin' : 'user'}`;
        avatarDiv.title = displayName;
        avatarDiv.textContent = isAdmin ? 'A' : displayName.charAt(0).toUpperCase();
        messageDiv.appendChild(avatarDiv);
        
        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = 'flex: 1;';
        
        // Add name
        const nameDiv = document.createElement('div');
        nameDiv.style.cssText = 'font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 500;';
        nameDiv.textContent = displayName;
        contentDiv.appendChild(nameDiv);
        
        // Add topic if exists
        if (msg.topic) {
            const topicDiv = document.createElement('div');
            topicDiv.style.cssText = 'font-size: 11px; color: #6b7280; margin-bottom: 4px;';
            topicDiv.textContent = `📌 ${msg.topic}`;
            contentDiv.appendChild(topicDiv);
        }
        
        // Add text if exists
        if (displayText) {
            const textDiv = document.createElement('div');
            textDiv.className = 'message-content';
            textDiv.textContent = displayText;
            contentDiv.appendChild(textDiv);
        }
        
        // Add image if exists - using DOM to avoid HTML escaping issues
        // Check for image in multiple ways to ensure we catch all cases
        const hasImage = msg.image && 
                        msg.image !== null && 
                        msg.image !== undefined && 
                        msg.image !== 'null' && 
                        msg.image !== 'undefined' &&
                        (typeof msg.image === 'string' ? msg.image.trim() !== '' : true);
        
        if (hasImage) {
            console.log('Adding image to message:', {
                idx,
                sender: msg.sender,
                imageLength: msg.image ? msg.image.length : 0,
                imageStart: msg.image ? msg.image.substring(0, 30) : 'none'
            });
            
            const imageContainer = document.createElement('div');
            imageContainer.style.cssText = 'margin-top: 8px;';
            
            const img = document.createElement('img');
            img.src = msg.image; // Direct assignment works with data URLs
            img.alt = 'تصویر ارسالی';
            img.style.cssText = 'max-width: 300px; max-height: 300px; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb; display: block; object-fit: contain;';
            img.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Open image in new tab
                const newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write(`
                        <html>
                            <head>
                                <title>تصویر ارسالی</title>
                                <style>
                                    body {
                                        margin: 0;
                                        padding: 20px;
                                        background: #1e293b;
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        min-height: 100vh;
                                    }
                                    img {
                                        max-width: 100%;
                                        max-height: 100vh;
                                        border-radius: 8px;
                                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                                    }
                                </style>
                            </head>
                            <body>
                                <img src="${msg.image}" alt="تصویر ارسالی">
                            </body>
                        </html>
                    `);
                } else {
                    // Fallback: show in modal if popup is blocked
                    showImageModal(msg.image);
                }
            };
            
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'display: none; padding: 8px; background: #fee2e2; border-radius: 4px; color: #991b1b; font-size: 12px;';
            errorDiv.textContent = 'خطا در بارگذاری تصویر';
            
            img.onerror = function() {
                console.error('Image load error for message:', {
                    idx,
                    sender: msg.sender,
                    imageSrc: msg.image ? msg.image.substring(0, 50) : 'none'
                });
                this.style.display = 'none';
                errorDiv.style.display = 'block';
            };
            
            img.onload = function() {
                console.log('Image loaded successfully for message:', idx);
            };
            
            imageContainer.appendChild(img);
            imageContainer.appendChild(errorDiv);
            contentDiv.appendChild(imageContainer);
        } else if (msg.image) {
            // Log if image exists but didn't pass the check
            console.warn('Image exists but failed validation:', {
                idx,
                sender: msg.sender,
                image: msg.image,
                imageType: typeof msg.image,
                isNull: msg.image === null,
                isUndefined: msg.image === undefined,
                isString: typeof msg.image === 'string',
                trimmed: typeof msg.image === 'string' ? msg.image.trim() : 'N/A'
            });
        }
        
        // Add time
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = time;
        contentDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show image in modal (fallback if popup is blocked)
function showImageModal(imageSrc) {
    // Remove existing modal if any
    const existingModal = document.getElementById('imageModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; justify-content: center; align-items: center; cursor: pointer;';
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = 'max-width: 90%; max-height: 90vh; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        modal.remove();
    };
    
    modal.appendChild(img);
    modal.appendChild(closeBtn);
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    document.body.appendChild(modal);
}

// Send message
function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text || !currentUserId) return;
    
    // Get the actual userId from chat (email-based)
    const chat = allChats.find(c => 
        c.userId === currentUserId || 
        c.userEmail === currentUserId
    );
    const targetUserId = chat ? chat.userId : currentUserId;
    
    console.log('Sending admin message:', {
        currentUserId: currentUserId,
        targetUserId: targetUserId,
        chatUserId: chat ? chat.userId : 'not found',
        chatUserEmail: chat ? chat.userEmail : 'not found'
    });
    
    // Create message
    const message = {
        id: Date.now(),
        sender: 'admin',
        targetUserId: targetUserId, // Use email-based userId
        text: text,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage first
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.push(message);
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    
    // Reload chat to ensure proper sorting and display
    selectUser(currentUserId);
    
    // Clear input
    input.value = '';
    
    // Update user list
    const updatedChat = allChats.find(c => c.userId === currentUserId);
    if (updatedChat) {
        updatedChat.lastMessage = text;
        updatedChat.lastMessageTime = message.timestamp;
        displayUsers();
    }
}

// Handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Filter chats
function filterChats() {
    const filter = document.getElementById('userFilter').value;
    // For now, just reload all chats
    loadChats();
}

// Format time
function formatTime(dateString) {
    if (!dateString) return '';
    
    let date;
    // Check if it's a time string (HH:MM format)
    if (typeof dateString === 'string' && dateString.match(/^\d{1,2}:\d{2}$/)) {
        const now = new Date();
        const [hours, minutes] = dateString.split(':').map(Number);
        date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    } else {
        date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'همین الان';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} دقیقه پیش`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعت پیش`;
    
    return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clear all existing chat messages
function clearAllChatHistory() {
    if (confirm('آیا مطمئن هستید که می‌خواهید تمام پیام‌های چت را حذف کنید؟ این عمل غیرقابل بازگشت است.')) {
        localStorage.removeItem('chatHistory');
        console.log('All chat history cleared');
        alert('تمام پیام‌های چت حذف شدند.');
        // Reload chats
        loadChats();
        // Clear current chat
        currentChat = [];
        currentUserId = null;
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '<div class="text-center text-gray-500 py-8">هنوز پیامی رد و بدل نشده است</div>';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Clear all existing chat history on first load (uncomment to use)
    // clearAllChatHistory();
    
    console.log('=== Support Panel Initialized ===');
    console.log('Checking localStorage for chatHistory...');
    const testHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    console.log('chatHistory in localStorage:', testHistory.length, 'messages');
    if (testHistory.length > 0) {
        console.log('Sample message:', testHistory[0]);
        console.log('User messages:', testHistory.filter(m => m.sender === 'user').map(m => ({
            userId: m.userId,
            userEmail: m.userEmail,
            userName: m.userName,
            hasText: !!m.text,
            hasImage: !!m.image
        })));
    }
    
    loadChats();
    
    // Auto-refresh every 3 seconds
    setInterval(() => {
        const oldChatsCount = allChats.length;
        loadChats();
        
        // If a user is selected, refresh their chat too
        if (currentUserId) {
            const selectedChat = allChats.find(c => c.userId === currentUserId);
            if (selectedChat) {
                selectUser(currentUserId);
            }
        }
    }, 3000);
    
    // Listen for chat updates from user panel
    window.addEventListener('chatHistoryUpdated', () => {
        loadChats();
        if (currentUserId) {
            selectUser(currentUserId);
        }
    });
});

