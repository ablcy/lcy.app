// ===== Data Loading (async-compatible) =====
let siteData = null;

(function initSite() {
    // 1. 立即用内联数据渲染 Hero（兜底：内联脚本已做，这里确保一致性）
    if (window.__hero_preload) {
        renderHeroFromPreload();
    }

    // 2. DOM 就绪后用完整 data.json 覆盖更新所有区域
    function loadFull() {
        fetch('data.json')
            .then(function(resp) { return resp.ok ? resp.json() : Promise.reject('data.json not found'); })
            .then(function(data) {
                siteData = data;
                renderHero();
                renderAbout();
                renderProjects();
                renderContact();
            })
            .catch(function(e) { console.warn('data.json failed', e); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFull);
    } else {
        loadFull();
    }
})();

function renderHeroFromPreload() {
    var preload = window.__hero_preload;
    if (!preload) return;
    // Title
    var nameEl = document.getElementById('heroName');
    if (nameEl && preload.title) nameEl.textContent = preload.title;
    // Avatar
    var avatarImg = document.getElementById('heroAvatarImg');
    if (avatarImg && preload.image) {
        avatarImg.onload = function() {
            avatarImg.style.transition = 'opacity 0.3s ease';
            avatarImg.style.opacity = '1';
        };
        avatarImg.onerror = function() {
            avatarImg.style.opacity = '1';
        };
        avatarImg.src = preload.image;
    }
    // Subtitle — use localStorage directly to avoid TDZ with 'let lang' declared later
    if (preload.subtitle_zh || preload.subtitle_en) {
        var subEl = document.getElementById('heroSubtitle');
        if (subEl) {
            subEl.setAttribute('data-zh', preload.subtitle_zh || '');
            subEl.setAttribute('data-en', preload.subtitle_en || '');
            var curLang = (localStorage.getItem('lang') || 'zh');
            subEl.textContent = (curLang === 'zh' ? preload.subtitle_zh : preload.subtitle_en) || '';
        }
    }
}

function renderHero() {
    if (!siteData || !siteData.hero) return;
    const h = siteData.hero;
    // Title
    const nameEl = document.getElementById('heroName');
    if (nameEl && h.title) nameEl.textContent = h.title;
    // Subtitle
    const subEl = document.getElementById('heroSubtitle');
    if (subEl) {
        if (h.subtitle_zh || h.subtitle_en) {
            subEl.setAttribute('data-zh', h.subtitle_zh || '');
            subEl.setAttribute('data-en', h.subtitle_en || '');
            subEl.textContent = (lang === 'zh' ? h.subtitle_zh : h.subtitle_en) || '';
        } else {
            subEl.setAttribute('data-zh', '');
            subEl.setAttribute('data-en', '');
            subEl.textContent = '';
        }
    }
    // Avatar — set src after data.json loaded, fade in on load
    const avatarImg = document.getElementById('heroAvatarImg');
    if (avatarImg && h.image) {
        avatarImg.onload = function() {
            avatarImg.style.transition = 'opacity 0.3s ease';
            avatarImg.style.opacity = '1';
        };
        avatarImg.onerror = function() {
            avatarImg.style.opacity = '1';
        };
        avatarImg.src = h.image;
    }
    // Stats
    if (h.stats) {
        const statNums = document.querySelectorAll('.hero-stats .stat-number');
        if (statNums.length >= 3 && h.stats.projects !== undefined) {
            statNums[0].setAttribute('data-count', h.stats.projects);
            statNums[0].textContent = h.stats.projects;
        }
        if (statNums.length >= 2 && h.stats.platforms !== undefined) {
            statNums[1].setAttribute('data-count', h.stats.platforms);
            statNums[1].textContent = h.stats.platforms;
        }
        if (statNums.length >= 3 && h.stats.ideas !== undefined) {
            statNums[2].textContent = h.stats.ideas;
        }
    }
}

function renderAbout() {
    const body = document.getElementById('aboutBody');
    if (!body || !siteData || !siteData.about) return;
    body.innerHTML = '';
    (siteData.about.paragraphs || []).forEach(p => {
        const el = document.createElement('p');
        el.className = 'about-desc';
        el.setAttribute('data-zh', p.zh || '');
        el.setAttribute('data-en', p.en || '');
        el.textContent = lang === 'zh' ? p.zh : p.en;
        body.appendChild(el);
    });
    (siteData.about.images || []).forEach(img => {
        const imgEl = document.createElement('img');
        imgEl.className = 'about-image';
        imgEl.loading = 'lazy';
        imgEl.style.opacity = '0';
        imgEl.onload = function() {
            imgEl.style.transition = 'opacity 0.3s ease';
            imgEl.style.opacity = '1';
        };
        imgEl.onerror = function() {
            imgEl.style.opacity = '1';
        };
        imgEl.src = img;
        body.appendChild(imgEl);
    });
}

function renderProjects() {
    const grid = document.getElementById('workGrid');
    if (!grid || !siteData || !siteData.projects) return;
    grid.innerHTML = '';
    const visibleProjects = siteData.projects
        .filter(p => p.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    visibleProjects.forEach((proj, idx) => {
        const card = document.createElement('a');
        card.href = proj.link || '#';
        card.className = 'work-card';
        card.setAttribute('data-color', 'violet');
        card.target = '_blank';
        card.relList.add('noopener');
        card.innerHTML = `
            <div class="work-card-inner">
                <div class="work-index">${String(idx + 1).padStart(2, '0')}</div>
                <div class="work-info">
                    <div class="work-icon">${proj.iconType === 'emoji' ? proj.icon : `<img src="${proj.icon}" alt="${proj.name}" style="width:1.4em;height:1.4em;border-radius:4px;vertical-align:middle;object-fit:cover;opacity:0;transition:opacity 0.3s ease;" onload="this.style.opacity=1" onerror="this.style.opacity=1">`}</div>
                    <h3 class="work-name">${proj.name}</h3>
                    <p class="work-desc" data-zh="${proj.desc_zh || ''}" data-en="${proj.desc_en || ''}">${lang === 'zh' ? proj.desc_zh : proj.desc_en}</p>
                </div>
                <div class="work-arrow">↗</div>
            </div>
            <div class="work-card-bg"></div>
        `;
        grid.appendChild(card);
    });

    const statNum = document.querySelector('.stat-number[data-count]');
    if (statNum) {
        statNum.setAttribute('data-count', visibleProjects.length);
        statNum.textContent = visibleProjects.length;
    }
}

function renderContact() {
    const grid = document.getElementById('contactGrid');
    if (!grid || !siteData || !siteData.contact) return;
    grid.innerHTML = '';
    const c = siteData.contact;

    const contacts = [
        { name: '微信', handle: c.wechat || '', svg: 'wechat', href: '#', id: 'wechatCard' },
        { name: 'Email', handle: c.email || '', svg: 'email', href: 'mailto:' + (c.email || '') },
        { name: 'QQ', handle: c.qq || '', svg: 'qq', href: c.qqLink || '#', target: '_blank' },
        { name: '抖音', handle: c.douyin || '', svg: 'douyin', href: c.douyinLink || '#', target: '_blank' }
    ];

    contacts.forEach(ct => {
        const card = document.createElement('a');
        card.href = ct.href;
        card.className = 'contact-card';
        if (ct.id) card.id = ct.id;
        if (ct.target) card.setAttribute('target', '_blank');
        if (ct.target) card.relList.add('noopener');
        card.innerHTML = `
            <div class="contact-icon">${getContactIconSVG(ct.svg)}</div>
            <div class="contact-text">
                <span class="contact-name">${ct.name}</span>
                <span class="contact-handle">${ct.handle}</span>
            </div>
            <span class="contact-arrow">→</span>
        `;
        grid.appendChild(card);
    });
}

function getContactIconSVG(type) {
    const icons = {
        wechat: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.49.49 0 0 1 .178-.554C23.028 18.48 24 16.82 24 14.98c0-3.21-2.931-5.952-7.062-6.122zm-2.18 2.769c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/></svg>',
        email: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
        qq: '<svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor"><path d="M6.048 3.323c.022.277-.13.523-.338.55-.21.026-.397-.176-.419-.453s.13-.523.338-.55c.21-.026.397.176.42.453Zm2.265-.24c-.603-.146-.894.256-.936.333-.027.048-.008.117.037.15.045.035.092.025.119-.003.361-.39.751-.172.829-.129l.011.007c.053.024.147.028.193-.098.023-.063.017-.11-.006-.142-.016-.023-.089-.08-.247-.118"/><path d="M11.727 6.719c0-.022.01-.375.01-.557 0-3.07-1.45-6.156-5.015-6.156S1.708 3.092 1.708 6.162c0 .182.01.535.01.557l-.72 1.795a26 26 0 0 0-.534 1.508c-.68 2.187-.46 3.093-.292 3.113.36.044 1.401-1.647 1.401-1.647 0 .979.504 2.256 1.594 3.179-.408.126-.907.319-1.228.556-.29.213-.253.43-.201.518.228.386 3.92.246 4.985.126 1.065.12 4.756.26 4.984-.126.052-.088.088-.305-.2-.518-.322-.237-.822-.43-1.23-.557 1.09-.922 1.594-2.2 1.594-3.178 0 0 1.041 1.69 1.401 1.647.168-.02.388-.926-.292-3.113a26 26 0 0 0-.534-1.508l-.72-1.795ZM9.773 5.53a.1.1 0 0 1-.009.096c-.109.159-1.554.943-3.033.943h-.017c-1.48 0-2.925-.784-3.034-.943a.1.1 0 0 1-.018-.055q0-.022.01-.04c.13-.287 1.43-.606 3.042-.606h.017c1.611 0 2.912.319 3.042.605m-4.32-.989c-.483.022-.896-.529-.922-1.229s.344-1.286.828-1.308c.483-.022.896.529.922 1.23.027.7-.344 1.286-.827 1.307Zm2.538 0c-.484-.022-.854-.607-.828-1.308.027-.7.44-1.25.923-1.23.483.023.853.608.827 1.309-.026.7-.439 1.251-.922 1.23ZM2.928 8.99q.32.063.639.117v2.336s1.104.222 2.21.068V9.363q.49.027.937.023h.017c1.117.013 2.474-.136 3.786-.396.097.622.151 1.386.097 2.284-.146 2.45-1.6 3.99-3.846 4.012h-.091c-2.245-.023-3.7-1.562-3.846-4.011-.054-.9 0-1.663.097-2.285"/></svg>',
        douyin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>'
    };
    return icons[type] || '';
}

// ===== Configuration =====
const html = document.documentElement;
let lang = localStorage.getItem('lang') || 'zh';

// ===== Theme Toggle =====
let theme = localStorage.getItem('theme') || 'light';

function setTheme(t) {
    theme = t;
    localStorage.setItem('theme', t);
    html.setAttribute('data-theme', t);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = t === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
}

(function () {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
})();

document.getElementById('themeToggle').addEventListener('click', () =>
    setTheme(theme === 'dark' ? 'light' : 'dark')
);

// ===== Language Toggle =====
function setLang(l) {
    lang = l;
    localStorage.setItem('lang', l);
    html.setAttribute('lang', l === 'zh' ? 'zh-CN' : 'en');
    document.querySelectorAll('[data-zh]').forEach(el => {
        el.textContent = el.getAttribute('data-' + l);
    });
    document.getElementById('langToggle').textContent = l === 'zh' ? 'EN' : '\u4E2D';
    if (window.walineInstance) {
        walineInstance.update({ lang: l === 'zh' ? 'zh-CN' : 'en' });
    }
}

document.getElementById('langToggle').addEventListener('click', () =>
    setLang(lang === 'zh' ? 'en' : 'zh')
);
setLang(lang);

// ===== Hamburger Menu =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// ===== Hero Entrance Animation =====
function animateHero() {
    const elements = document.querySelectorAll('.hero-left, .hero-name, .hero-stats, .hero-right');
    elements.forEach((el, i) => {
        setTimeout(() => el.classList.add('in-view'), i * 120 + 60);
    });
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', animateHero);
} else {
    animateHero();
}

// ===== Counter Animation =====
const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.count);
            let current = 0;
            const step = Math.ceil(target / 30);
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                entry.target.textContent = current;
            }, 40);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });
counters.forEach(c => counterObserver.observe(c));

// ===== Scroll Entrance (IntersectionObserver) =====
const scrollObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            const cards = entry.target.querySelectorAll('.work-card, .contact-card');
            cards.forEach((card, i) => {
                setTimeout(() => card.classList.add('in-view'), i * 70);
            });
            scrollObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.08 });

document.querySelectorAll('.section').forEach(s => scrollObserver.observe(s));

// ===== Nav Highlight + Scrolled State =====
const nav = document.getElementById('nav');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

function onScroll() {
    const scrollY = window.scrollY;
    nav.classList.toggle('nav-scrolled', scrollY > 50);

    let current = '';
    sections.forEach(sec => {
        if (scrollY >= sec.offsetTop - 150) current = sec.id;
    });

    navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === '#' + current;
        link.classList.toggle('active', isActive);
    });
}

window.addEventListener('scroll', onScroll, { passive: true });

// ===== Waline =====
let walineLoaded = false;
window.initWaline = function (Waline) {
    window.walineInstance = Waline.init({
        el: '#waline',
        serverURL: 'https://waline.luckyan.dpdns.org',
        lang: lang === 'zh' ? 'zh-CN' : 'en',
        dark: 'html[data-theme="dark"]',
        meta: ['nick', 'mail'],
        requiredMeta: [],
        login: 'disable',
        wordLimit: [0, 500],
        pageSize: 10,
    });
};

const guestbookTrigger = document.getElementById('guestbookTrigger');
if (guestbookTrigger) {
    guestbookTrigger.addEventListener('click', function loadWalineOnce() {
        if (!walineLoaded) {
            walineLoaded = true;
            const script = document.createElement('script');
            script.type = 'module';
            script.textContent = `
                import { init } from 'https://unpkg.com/@waline/client@v3/dist/waline.js';
                window.initWaline({ init });
            `;
            document.body.appendChild(script);
            guestbookTrigger.removeEventListener('click', loadWalineOnce);
        }
    });
}

// ===== Busuanzi Stats (deferred) =====
setTimeout(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    document.body.appendChild(script);
}, 2000);

// ===== Site Runtime =====
(function () {
    const LAUNCH_DATE = new Date('2026-04-16T19:35:00+08:00');

    function formatRuntime() {
        const now = new Date();
        const diff = now - LAUNCH_DATE;
        if (diff < 0) return '0\u5929';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const l = window.__yan_lang || localStorage.getItem('lang') || 'zh';
        if (l === 'en') {
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
        return `${days}\u5929 ${hours}\u65F6 ${minutes}\u5206 ${seconds}\u79D2`;
    }

    const el = document.getElementById('siteRuntime');
    if (el) {
        el.textContent = formatRuntime();
        setInterval(() => {
            el.textContent = formatRuntime();
        }, 1000);
    }

    const origSetLang = window.setLang;
    if (typeof origSetLang === 'function') {
        window.setLang = function (l) {
            origSetLang(l);
            window.__yan_lang = l;
        };
    }
})();

// ===== Collapse Logic (Guestbook & Changelog) =====
function setupCollapse(trigger, content, isOpen) {
    if (!trigger || !content) return;
    content.style.display = isOpen ? 'block' : 'none';
    trigger.classList.toggle('collapsed', !isOpen);

    trigger.addEventListener('click', () => {
        const open = content.style.display === 'none';
        content.style.display = open ? 'block' : 'none';
        trigger.classList.toggle('collapsed', !open);
    });
}

setupCollapse(
    document.getElementById('guestbookTrigger'),
    document.getElementById('guestbookContent'),
    false
);
setupCollapse(
    document.getElementById('changelogTrigger'),
    document.getElementById('changelogContent'),
    false
);

// ===== WeChat Modal =====
(function () {
    const wechatCard = document.getElementById('wechatCard');
    const modal = document.getElementById('wechatModal');
    const close = document.getElementById('wechatModalClose');
    const bg = document.getElementById('wechatModalBg');
    if (!wechatCard || !modal) return;
    wechatCard.addEventListener('click', function (e) {
        e.preventDefault();
        modal.classList.add('active');
    });
    function closeModal() {
        modal.classList.remove('active');
    }
    close.addEventListener('click', closeModal);
    bg.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });
})();
