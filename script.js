document.addEventListener('DOMContentLoaded', () => {

    /* ------------------------------
       MOBILE MENU
    ------------------------------ */
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
            if (nav.style.display === 'flex') {
                nav.style.position = 'absolute';
                nav.style.top = '100%';
                nav.style.left = '0';
                nav.style.width = '100%';
                nav.style.background = 'rgba(5, 10, 8, 0.95)';
                nav.style.padding = '2rem';
                nav.style.flexDirection = 'column';
                nav.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            }
        });
    }

    /* ------------------------------
       SMOOTH SCROLL
    ------------------------------ */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                if (window.innerWidth <= 768) nav.style.display = 'none';
            }
        });
    });

    /* ------------------------------
       INTERSECTION ANIMATIONS
    ------------------------------ */
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = [
        '.feature-item',
        '.step-card',
        '.testimonial-card',
        '.section-title',
        '.hero-content'
    ];

    animatedElements.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, index) => {
            el.classList.add('fade-in-up');
            el.style.animationDelay = `${index * 0.1}s`;
            observer.observe(el);
        });
    });

    /* ------------------------------
       SIMULATION TAB SWITCHING
    ------------------------------ */
    document.querySelectorAll('.sim-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.sim-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.sim-tab-panel').forEach(p => p.classList.add('sim-hidden'));
            tab.classList.add('active');
            document.getElementById('sim-panel-' + tab.dataset.tab).classList.remove('sim-hidden');
        });
    });

    /* ------------------------------
       INIT 3D FEATURE CORRIDOR
    ------------------------------ */
    initFeaturesCorridor3D();
});


/* -----------------------------------------------------------
   3D CORRIDOR EXPERIENCE
----------------------------------------------------------- */
function initFeaturesCorridor3D() {
    const section = document.getElementById('features');
    const canvas = document.getElementById('features-canvas');

    if (!section || !canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020507, 0.16);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });
    renderer.setClearColor(0x0f1c15, 0); // match --bg-gradient-start; 0 alpha = transparent
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 1.4, 6);

    /* LIGHTS */
    scene.add(new THREE.AmbientLight(0x94f9c6, 0.35));

    const keyLight = new THREE.SpotLight(0x4ade80, 1.5, 40, Math.PI/4, 0.5);
    keyLight.position.set(2, 6, 4);
    scene.add(keyLight);

    /* PARTICLES */
    const positions = new Float32Array(220 * 3);
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] = (Math.random() - 0.5) * 14;
        positions[i + 1] = Math.random() * 4 + 0.5;
        positions[i + 2] = -Math.random() * 45;
    }

    const particles = new THREE.Points(
        new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
        new THREE.PointsMaterial({ size: 0.07, color: 0x7cf9c6, opacity: 0.85, transparent: true })
    );
    scene.add(particles);

    /* SCROLL PROGRESS */
    const steps = document.querySelectorAll('.feature-step');
    const numPanels = steps.length;   // 5 text steps
    const spacing = 4;                // needed for camera movement only

    let progress = 0;
    let mouseX = 0, mouseY = 0;

    function updateMetrics() {
        const rect = section.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        return { top, height: rect.height };
    }

    let metrics = updateMetrics();
    window.addEventListener('resize', () => {
        metrics = updateMetrics();
        resizeRenderer();
    });

    /* ------------------------------
       FIXED SCROLL LOGIC
    ------------------------------ */
    window.addEventListener("scroll", () => {
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportH = window.innerHeight;

    const start = metrics.top - viewportH * 0.1;
    const end = metrics.top + metrics.height - viewportH * 0.7;


    const range = end - start;
    progress = (scrollY - start) / range;

    progress = Math.min(1, Math.max(0, progress));
});





    section.addEventListener('mousemove', e => {
        const rect = section.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    /* RESIZE */
    function resizeRenderer() {
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(rect.width || section.clientWidth, 1);
        const h = Math.max(rect.height || window.innerHeight * 0.8, 1);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resizeRenderer();

    /* DOM HIGHLIGHT */
    function updateActiveStep() {
    // evenly divide scroll into exact panel segments
    // 🔥 speed up transitions — make each step shorter in progress space
    const segment = 0.15; // instead of 0.20
    let idx = Math.floor(progress / segment);


    if (idx < 0) idx = 0;
    if (idx >= numPanels) idx = numPanels - 1;

    steps.forEach((step, i) => {
        step.classList.toggle("active", i === idx);
    });
}


    /* ANIMATE */
    const clock = new THREE.Clock();
    let animId = null;
    let isVisible = false;

    // Pause rendering when the section is off-screen — reduces GPU pressure
    // and prevents WebGL context loss from sustained background load
    const visibilityObserver = new IntersectionObserver(entries => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && animId === null) animate();
    }, { threshold: 0 });
    visibilityObserver.observe(section);

    // Recover cleanly if the browser drops the WebGL context
    // (happens on tab switch, GPU memory pressure, hybrid graphics switch)
    canvas.addEventListener('webglcontextlost', e => {
        e.preventDefault();
        cancelAnimationFrame(animId);
        animId = null;
    }, false);

    canvas.addEventListener('webglcontextrestored', () => {
        resizeRenderer();
        if (isVisible) animate();
    }, false);

    function animate() {
        if (!isVisible) { animId = null; return; }
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        /* CAMERA MOTION */
        const startZ = 6;
        const endZ = -spacing * (numPanels - 1) - 3;
        const targetZ = startZ + (endZ - startZ) * progress;

        camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.03;
        camera.position.y += ((1.4 + mouseY * 0.2) - camera.position.y) * 0.03;
        camera.position.z += (targetZ - camera.position.z) * 0.08;

        camera.lookAt(0, 1.5, camera.position.z - 4);

        /* PARTICLE MOTION */
        particles.rotation.y = t * 0.04;

        


        updateActiveStep();
        renderer.render(scene, camera);
    }
}
