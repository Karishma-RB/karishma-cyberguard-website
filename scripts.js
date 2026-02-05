// scripts.js - Main JavaScript file for CyberGuard

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the dashboard page
    const isDashboard = document.body.classList.contains('dashboard-page') || 
                       document.querySelector('.dashboard-main') !== null;
    
    // Initialize common functionality for all pages
    initCommonFunctionality();
    
    // Initialize dashboard-specific functionality if on dashboard
    if (isDashboard) {
        initDashboard();
    }
});

// Common functionality for all pages
function initCommonFunctionality() {
    initMobileMenu();
    initNavbarScroll();
    initSmoothScrolling();
    initFadeAnimations();
    initQuizFunctionality();
    initCardHoverEffects();
    initProgressBars();
    initChatbot();
    initActiveNavLink();
    initCounters();
}

// Dashboard-specific functionality
function initDashboard() {
    console.log('Initializing dashboard...');
    
    // Load user data
    loadUserData();
    
    // Initialize dashboard components
    initSidebar();
    initUserDropdown();
    initLogout();
    initDashboardCounters();
    initDashboardStats();
    
    // Update last login time
    updateLastLogin();
    
    // Initialize dashboard-specific interactions
    initDashboardInteractions();
    
    // Update XP progress bar
    updateXPProgress();
}

// ====================================
// COMMON FUNCTIONS
// ====================================

// Mobile Menu Toggle
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (!mobileMenuBtn || !mobileMenu) return;
    
    mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileMenu.classList.toggle('show');
        mobileMenuBtn.innerHTML = mobileMenu.classList.contains('show') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target) && mobileMenu.classList.contains('show')) {
            mobileMenu.classList.remove('show');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.mobile-menu .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('show');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    
    if (!navbar) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            navbar.style.background = 'rgba(26, 26, 46, 0.98)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.classList.remove('scrolled');
            navbar.style.background = 'rgba(26, 26, 46, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just '#'
            if (href === '#') return;
            
            // Skip for login/register links
            if (href.includes('.html')) return;
            
            e.preventDefault();
            
            const targetId = href;
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.navbar')?.offsetHeight || 80;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update active link for navigation links
                if (this.classList.contains('nav-link')) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                }
                
                // Close mobile menu
                const mobileMenu = document.getElementById('mobileMenu');
                const mobileMenuBtn = document.getElementById('mobileMenuBtn');
                if (mobileMenu && mobileMenu.classList.contains('show')) {
                    mobileMenu.classList.remove('show');
                    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });
}

// Animated number counters for homepage
function initCounters() {
    const heroCounters = document.querySelectorAll('.hero-stats .stat-number[data-target]');
    const statsCounters = document.querySelectorAll('.stats-section .stat-number');
    let heroCountersAnimated = false;
    let statsCountersAnimated = false;
    
    // Hero section counters
    function animateHeroCounters() {
        if (heroCountersAnimated || heroCounters.length === 0) return;
        
        const heroStats = document.querySelector('.hero-stats');
        if (!heroStats) return;
        
        const rect = heroStats.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
            heroCountersAnimated = true;
            
            heroCounters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const increment = target / 100;
                let current = 0;
                
                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.textContent = target === 4.8 
                            ? current.toFixed(1)
                            : Math.floor(current);
                        setTimeout(updateCounter, 20);
                    } else {
                        counter.textContent = target === 4.8 
                            ? target.toFixed(1)
                            : target;
                    }
                };
                
                updateCounter();
            });
        }
    }
    
    // Stats section counters
    function animateStatsCounters() {
        if (statsCountersAnimated || statsCounters.length === 0) return;
        
        const statsSection = document.querySelector('.stats-section');
        if (!statsSection) return;
        
        const rect = statsSection.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
            statsCountersAnimated = true;
            
            statsCounters.forEach(counter => {
                let target;
                let isPercentage = false;
                
                if (counter.id) {
                    switch(counter.id) {
                        case 'totalUsers':
                            target = 10000;
                            break;
                        case 'totalQuizzes':
                            target = 500;
                            break;
                        case 'successRate':
                            target = 95;
                            isPercentage = true;
                            break;
                        case 'countries':
                            target = 50;
                            break;
                        default:
                            target = parseInt(counter.textContent) || 100;
                    }
                } else {
                    target = parseInt(counter.textContent) || 100;
                }
                
                const increment = target / 50;
                let current = 0;
                
                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.textContent = isPercentage 
                            ? Math.floor(current) + '%'
                            : Math.floor(current);
                        setTimeout(updateCounter, 20);
                    } else {
                        counter.textContent = isPercentage ? target + '%' : target;
                    }
                };
                
                updateCounter();
            });
        }
    }
    
    // Initialize counters on scroll
    window.addEventListener('scroll', () => {
        animateHeroCounters();
        animateStatsCounters();
    });
    
    // Trigger initial check
    setTimeout(() => {
        animateHeroCounters();
        animateStatsCounters();
    }, 500);
}

// Intersection Observer for fade-in animations
function initFadeAnimations() {
    const fadeElements = document.querySelectorAll('.fade-in');
    
    if (fadeElements.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    fadeElements.forEach(el => observer.observe(el));
}

// Quiz functionality
function initQuizFunctionality() {
    const quizOptions = document.querySelectorAll('.quiz-option');
    const showExplanationBtn = document.querySelector('.quiz-preview .btn-secondary');
    
    if (quizOptions.length > 0) {
        quizOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class from all options
                quizOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.style.backgroundColor = '';
                    opt.style.borderColor = '';
                });
                
                // Add selected class to clicked option
                this.classList.add('selected');
                this.style.backgroundColor = 'rgba(94, 53, 177, 0.1)';
                
                // Highlight correct answer (B)
                if (this.querySelector('.option-letter').textContent === 'B') {
                    this.style.borderColor = 'var(--success)';
                    this.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                }
            });
        });
    }
    
    if (showExplanationBtn) {
        showExplanationBtn.addEventListener('click', function() {
            const explanation = document.getElementById('quizExplanation');
            if (explanation) {
                explanation.style.display = explanation.style.display === 'block' ? 'none' : 'block';
            }
        });
    }
}

// Hover effects for cards
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.feature-card, .category-card, .action-card, .challenge-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('category-card')) {
                card.style.transform = 'translateY(-5px) scale(1.02)';
                card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            } else {
                card.style.transform = 'translateY(-5px) scale(1.02)';
                card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
                card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '';
        });
    });
}

// Initialize progress bars animation
function initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    progressBars.forEach(bar => {
        const width = bar.style.width || '0%';
        bar.style.width = '0%';
        
        // Use Intersection Observer to animate when in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        bar.style.width = width;
                        bar.style.transition = 'width 1s ease-in-out';
                    }, 300);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(bar);
    });
}

// Chatbot functionality
function initChatbot() {
    const chatbotIcon = document.getElementById('chatbotIcon');
    const chatbotPopup = document.getElementById('chatbotPopup');
    const closeChatbot = document.getElementById('closeChatbot');
    
    if (!chatbotIcon || !chatbotPopup) return;
    
    chatbotIcon.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (chatbotPopup.style.display === 'block' || chatbotPopup.classList.contains('active')) {
            // If popup is already visible, redirect to chatbot page
            window.location.href = 'chatbot.html';
        } else {
            // Show popup
            chatbotPopup.style.display = 'block';
            chatbotPopup.classList.add('active');
            
            // Auto-close after 10 seconds
            setTimeout(() => {
                if (chatbotPopup.style.display === 'block' || chatbotPopup.classList.contains('active')) {
                    chatbotPopup.style.display = 'none';
                    chatbotPopup.classList.remove('active');
                }
            }, 10000);
        }
    });
    
    if (closeChatbot) {
        closeChatbot.addEventListener('click', function(e) {
            e.stopPropagation();
            chatbotPopup.style.display = 'none';
            chatbotPopup.classList.remove('active');
        });
    }
    
    // Close popup when clicking outside
    document.addEventListener('click', function(e) {
        if (chatbotPopup && 
            (chatbotPopup.style.display === 'block' || chatbotPopup.classList.contains('active')) && 
            !chatbotPopup.contains(e.target) && 
            !chatbotIcon.contains(e.target)) {
            chatbotPopup.style.display = 'none';
            chatbotPopup.classList.remove('active');
        }
    });
}

// Set active nav link based on scroll position
function initActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');
    
    if (sections.length === 0 || navLinks.length === 0) return;
    
    function setActiveLink() {
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', setActiveLink);
    
    // Set initial active link
    setTimeout(setActiveLink, 100);
}

// ====================================
// DASHBOARD FUNCTIONS
// ====================================

// Load user data from localStorage
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('cyberguard_user')) || {
        name: 'John Doe',
        email: 'john@example.com',
        level: 5,
        xp: 2450,
        streak: 15,
        joined: new Date().toISOString()
    };
    
    // Update UI with user data
    document.querySelectorAll('#userName, #mobileUserName, #sidebarUserName, #welcomeUserName').forEach(el => {
        if (el && el.id === 'welcomeUserName') {
            el.textContent = user.name.split(' ')[0]; // First name only
        } else if (el) {
            el.textContent = user.name;
        }
    });
    
    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    if (sidebarUserEmail) {
        sidebarUserEmail.textContent = user.email;
    }
    
    // Update level and XP
    const xpElement = document.querySelector('.xp-progress');
    if (xpElement) {
        xpElement.textContent = `${user.xp.toLocaleString()}/5,000 XP`;
    }
    
    const levelBadge = document.querySelector('.level-badge');
    if (levelBadge) {
        levelBadge.textContent = `Level ${user.level}`;
    }
    
    // Update streak
    const streakElement = document.querySelector('.stat-card-small:first-child .stat-number');
    if (streakElement) {
        streakElement.textContent = user.streak;
    }
}

// Initialize sidebar toggle
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const dashboardMain = document.querySelector('.dashboard-main');
    
    if (!sidebarToggle || !sidebar) return;
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('show');
        
        // Update toggle icon
        const icon = this.querySelector('i');
        if (sidebar.classList.contains('show')) {
            icon.classList.remove('fa-chevron-left');
            icon.classList.add('fa-chevron-right');
        } else {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
        }
    });
    
    // Close sidebar when clicking outside on mobile
    if (window.innerWidth <= 1024) {
        dashboardMain?.addEventListener('click', function() {
            if (sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
                const icon = sidebarToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-left');
                }
            }
        });
    }
}

// Initialize user dropdown
function initUserDropdown() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (!userMenuBtn || !dropdownMenu) return;
    
    userMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        dropdownMenu.classList.remove('show');
    });
    
    // Prevent dropdown from closing when clicking inside
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Initialize logout functionality
function initLogout() {
    const logoutBtns = document.querySelectorAll('#logoutBtn, #mobileLogoutBtn');
    
    logoutBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Clear user session
                localStorage.removeItem('cyberguard_user');
                localStorage.removeItem('cyberguard_token');
                
                // Show logout message
                showNotification('Logged out successfully. Redirecting...', 'success');
                
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            });
        }
    });
}

// Initialize animated counters for dashboard
function initDashboardCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = +counter.textContent.replace(/[^0-9.]/g, '');
        const suffix = counter.textContent.replace(/[0-9.]/g, '');
        
        // Reset counter
        counter.textContent = '0' + suffix;
        
        const updateCounter = () => {
            const current = +counter.textContent.replace(/[^0-9.]/g, '');
            const increment = target / 200;
            
            if (current < target) {
                counter.textContent = Math.ceil(current + increment).toLocaleString() + suffix;
                setTimeout(updateCounter, 10);
            } else {
                counter.textContent = target.toLocaleString() + suffix;
            }
        };
        
        // Start counter when element is in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
}

// Initialize dashboard stats
function initDashboardStats() {
    // Initialize any dashboard-specific stats here
    updateXPProgress();
}

// Update last login time
function updateLastLogin() {
    const lastLogin = localStorage.getItem('cyberguard_last_login');
    const now = new Date();
    
    // Format: "Last seen: Today at 14:30"
    const formattedTime = `Today at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Save current time as last login
    localStorage.setItem('cyberguard_last_login', now.toISOString());
    
    // You could display this somewhere in the dashboard
    // console.log(`Last login updated: ${formattedTime}`);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    // Add keyframe animation
    const style = document.createElement('style');
    if (!document.querySelector('style[data-notification-animations]')) {
        style.setAttribute('data-notification-animations', 'true');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                margin-left: 1rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    document.body.appendChild(notification);
}

// Update XP progress bar
function updateXPProgress() {
    const user = JSON.parse(localStorage.getItem('cyberguard_user')) || { xp: 0 };
    const xpProgress = document.querySelector('.xp-progress-bar .progress-fill');
    
    if (xpProgress) {
        const xpPercentage = Math.min((user.xp / 5000) * 100, 100);
        xpProgress.style.width = `${xpPercentage}%`;
    }
}

// Initialize dashboard interactions
function initDashboardInteractions() {
    // Handle action card clicks
    document.addEventListener('click', function(e) {
        if (e.target.closest('.action-card')) {
            const card = e.target.closest('.action-card');
            const quizTitle = card.querySelector('h3')?.textContent || 'Quiz';
            showNotification(`Starting ${quizTitle}...`, 'info');
        }
        
        if (e.target.closest('.challenge-card .btn')) {
            const card = e.target.closest('.challenge-card');
            const challengeTitle = card.querySelector('h3')?.textContent || 'Challenge';
            showNotification(`Continuing ${challengeTitle}...`, 'info');
        }
    });
    
    // Example: Simulate quiz completion for demo purposes
    const simulateQuizBtn = document.querySelector('[data-simulate-quiz]');
    if (simulateQuizBtn) {
        simulateQuizBtn.addEventListener('click', function() {
            simulateQuizCompletion('demo-quiz', 85); // 85% score
        });
    }
}

// Simulate quiz completion
function simulateQuizCompletion(quizId, score) {
    const user = JSON.parse(localStorage.getItem('cyberguard_user')) || {};
    
    // Update XP
    user.xp = (user.xp || 0) + (score * 10);
    
    // Check if user should level up
    const newLevel = Math.floor(user.xp / 1000) + 1;
    if (newLevel > user.level) {
        user.level = newLevel;
        showNotification(`🎉 Congratulations! You've reached Level ${user.level}!`, 'success');
    }
    
    // Update streak if not already updated today
    const lastStreakUpdate = localStorage.getItem('cyberguard_streak_date');
    const today = new Date().toDateString();
    
    if (lastStreakUpdate !== today) {
        user.streak = (user.streak || 0) + 1;
        localStorage.setItem('cyberguard_streak_date', today);
    }
    
    // Save updated user data
    localStorage.setItem('cyberguard_user', JSON.stringify(user));
    
    // Update UI
    loadUserData();
    updateXPProgress();
    
    // Show notification
    showNotification(`Quiz completed! You earned ${score * 10} XP.`, 'success');
}

// Initialize on page load
window.addEventListener('load', function() {
    // Trigger initial animations
    setTimeout(() => {
        document.querySelectorAll('.fade-in').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('visible');
            }
        });
    }, 200);
    
    // Set current year in footer if needed
    const currentYearElements = document.querySelectorAll('[data-current-year]');
    if (currentYearElements.length > 0) {
        const currentYear = new Date().getFullYear();
        currentYearElements.forEach(el => {
            el.textContent = currentYear;
        });
    }
    
    // Add logout confirmation
    const logoutButtons = document.querySelectorAll('[data-logout]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to logout?')) {
                e.preventDefault();
            }
        });
    });
});