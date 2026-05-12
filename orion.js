document.addEventListener("DOMContentLoaded", function() {
    
    // --- Helper: Dynamisch scripts laden ---
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // --- 1. Bootstrap JS (Altijd laden) ---
    loadScript("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js");

    // --- 2. Syntax Highlighting (Async laden indien nodig) ---
    const codeWrappers = document.querySelectorAll('.code-wrapper');
    if (codeWrappers.length > 0) {
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js")
            .then(() => {
                // Detecteer benodigde talen
                const languages = new Set();
                codeWrappers.forEach(w => w.classList.forEach(c => {
                    if (c.startsWith('language-')) languages.add(c.replace('language-', ''));
                }));
                // Laad taal-bestanden
                return Promise.all(Array.from(languages).map(lang => 
                    loadScript(`https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/${lang}.min.js`)
                        .catch(() => console.warn(`Taal module niet gevonden: ${lang}`))
                ));
            })
            .then(() => loadScript("https://cdnjs.cloudflare.com/ajax/libs/highlightjs-line-numbers.js/2.8.0/highlightjs-line-numbers.min.js"))
            .then(() => {
                // Re-select wrappers because DOM might have changed (e.g. Accordion logic)
                document.querySelectorAll('.code-wrapper').forEach(wrapper => {
                    // Extract language for display (zet data-language attribuut)
                    wrapper.classList.forEach(cls => {
                        if (cls.startsWith('language-')) {
                            wrapper.setAttribute('data-language', cls.replace('language-', ''));
                        }
                    });

                    // Opbouw <pre><code> structuur
                    if (wrapper.tagName === 'PRE') {
                        if (!wrapper.querySelector('code')) {
                            const content = wrapper.innerHTML;
                            const code = document.createElement('code');
                            wrapper.classList.forEach(cls => { if (cls.startsWith('language-')) code.classList.add(cls); });
                            code.innerHTML = content;
                            wrapper.innerHTML = '';
                            wrapper.appendChild(code);
                        }
                    } else if (!wrapper.querySelector('pre code')) {
                        const content = wrapper.innerHTML.trim();
                        const pre = document.createElement('pre');
                        const code = document.createElement('code');
                        wrapper.classList.forEach(cls => { if (cls.startsWith('language-')) code.classList.add(cls); });
                        code.innerHTML = content;
                        pre.appendChild(code);
                        wrapper.innerHTML = '';
                        wrapper.appendChild(pre);
                    }
                    
                    // Highlight & Line Numbers
                    const codeBlock = wrapper.querySelector('code');
                    if (codeBlock) {
                        if (wrapper.hasAttribute('data-start')) codeBlock.setAttribute('data-ln-start-from', wrapper.getAttribute('data-start'));
                        hljs.highlightElement(codeBlock);
                        if (wrapper.classList.contains('linenumbers')) hljs.lineNumbersBlock(codeBlock);
                    }

                    // Voeg copy button toe (pas na highlighting)
                    addCopyButton(wrapper);
                });
            });
    }

    // --- Automatisatie: Figure Zoom ---
    // Zoek alle figures met class 'figure-zoom'
    const zoomFigures = document.querySelectorAll('figure.figure-zoom');
    
    zoomFigures.forEach(figure => {
        const img = figure.querySelector('img');
        if (!img) return;

        // 1. Wrap image in anchor (<a>) als dat nog niet gebeurd is
        if (img.parentElement.tagName !== 'A') {
            const link = document.createElement('a');
            link.href = img.src;
            link.target = '_blank';
            link.rel = 'noopener';
            link.className = 'zoom-link';
            link.title = 'Klik om te vergroten';
            
            // Plaats de link voor de afbeelding
            img.parentNode.insertBefore(link, img);
            // Verplaats de afbeelding in de link
            link.appendChild(img);
        }

        // 2. Voeg figcaption toe als die niet bestaat
        let caption = figure.querySelector('figcaption');
        if (!caption) {
            caption = document.createElement('figcaption');
            caption.innerText = 'Klik op de afbeelding om te vergroten';
            figure.appendChild(caption);
        } else if (!caption.innerText.trim()) {
            caption.innerText = 'Klik op de afbeelding om te vergroten';
        }
        // Zorg dat de juiste class aanwezig is voor de CSS styling
        caption.classList.add('figure-caption');
    });

    // --- Helper: Copy Code Button ---
    function addCopyButton(wrapper) {
        if (wrapper.querySelector('.btn-copy')) return;
        const button = document.createElement('button');
        button.className = 'btn-copy';
        button.title = 'Kopieer naar klembord';
        button.setAttribute('aria-label', 'Kopieer naar klembord');
        wrapper.appendChild(button);
        
        button.addEventListener('click', () => {
            const codeBlock = wrapper.querySelector('code');
            if (!codeBlock) return;
            
            const text = codeBlock.innerText;
            
            // Probeer Clipboard API (werkt enkel op HTTPS of localhost)
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(showSuccess)
                    .catch(err => {
                        console.warn("Clipboard API failed, trying fallback", err);
                        fallbackCopy(text);
                    });
            } else {
                fallbackCopy(text);
            }

            function showSuccess() {
                button.classList.add('copied');
                setTimeout(() => button.classList.remove('copied'), 2000);
            }

            function fallbackCopy(text) {
                // Fallback voor oudere browsers of niet-secure context (file://)
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed"; // Vermijd scrollen naar beneden
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    if (document.execCommand('copy')) showSuccess();
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }
        });
    }

    // --- Functionaliteit: Accordion ---
    document.querySelectorAll('.accordion-container').forEach((container, index) => {
        // Voeg de Bootstrap class toe
        container.classList.add('accordion');
        
        // Genereer een uniek ID voor de parent als die er nog niet is
        const accordionId = container.id || `accordionGen${index}`;
        container.id = accordionId;

        container.querySelectorAll('.accordion-item').forEach((item, itemIndex) => {
            // 1. Titel ophalen
            let titleText = 'Item';
            const titleEl = item.querySelector(':scope > .title');
            if (titleEl) {
                titleText = titleEl.innerHTML;
                titleEl.remove();
            }

            // 2. Content bewaren (alles wat overblijft in de item div)
            const content = item.innerHTML;
            item.innerHTML = ''; // Item leegmaken om opnieuw op te bouwen

            // 3. Unieke IDs genereren voor de koppeling button <-> collapse
            const headingId = `${accordionId}-heading${itemIndex}`;
            const collapseId = `${accordionId}-collapse${itemIndex}`;

            // 4. Bootstrap structuur opbouwen
            // Header (H2) met Button
            const header = document.createElement('h2');
            header.className = 'accordion-header';
            header.id = headingId;

            const btn = document.createElement('button');
            btn.className = 'accordion-button collapsed';
            btn.type = 'button';
            btn.setAttribute('data-bs-toggle', 'collapse');
            btn.setAttribute('data-bs-target', `#${collapseId}`);
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-controls', collapseId);
            btn.innerHTML = titleText;

            header.appendChild(btn);

            // Collapse container met Body
            const collapse = document.createElement('div');
            collapse.id = collapseId;
            collapse.className = 'accordion-collapse collapse';
            collapse.setAttribute('aria-labelledby', headingId);
            collapse.setAttribute('data-bs-parent', `#${accordionId}`);
            collapse.innerHTML = `<div class="accordion-body">${content}</div>`;

            item.appendChild(header);
            item.appendChild(collapse);
        });
    });

    // --- Functionaliteit: Spoiler Container ---
    document.querySelectorAll('.spoiler-container').forEach(container => {
        // 1. Elementen ophalen
        const basicEl = container.querySelector(':scope > .basic');
        const buttonEl = container.querySelector(':scope > .button');
        const hiddenEl = container.querySelector(':scope > .hidden');

        // 2. Data ophalen
        const basicHTML = basicEl ? basicEl.innerHTML : '';
        let textHidden = 'Meer tonen';
        let textShown = 'Meer tonen';

        if (buttonEl) {
            textHidden = buttonEl.innerText;
            textShown = buttonEl.getAttribute('data-shown') || textHidden;
        } else if (container.dataset.title) {
            textHidden = container.dataset.title;
            textShown = container.dataset.shown || textHidden;
        }

        // Content ophalen (expliciet of fallback voor backward compatibility)
        let hiddenHTML = '';
        if (hiddenEl) {
            hiddenHTML = hiddenEl.innerHTML;
        } else {
            // Fallback: kloon container, verwijder bekende elementen, rest is content
            const clone = container.cloneNode(true);
            clone.querySelectorAll(':scope > .basic, :scope > .button, :scope > .intro, :scope > .title').forEach(el => el.remove());
            hiddenHTML = clone.innerHTML.trim();
        }

        // 3. Container leegmaken en herbouwen
        container.innerHTML = '';

        // Button
        const btn = document.createElement('button');
        btn.className = 'btn-spoiler';
        btn.innerText = textHidden;

        // Basic text (Introductie)
        if (basicHTML) {
            const basicDiv = document.createElement('div');
            basicDiv.style.marginBottom = '10px';
            basicDiv.innerHTML = basicHTML;
            
            // Probeer de knop in de laatste paragraaf te steken als die bestaat, anders gewoon achteraan de div
            const lastChild = basicDiv.lastElementChild;
            if (lastChild && (lastChild.tagName === 'P' || lastChild.tagName === 'DIV')) {
                lastChild.appendChild(btn);
            } else {
                basicDiv.appendChild(btn);
            }
            container.appendChild(basicDiv);
        } else {
            container.appendChild(btn);
        }
        
        // Content wrapper
        const contentDiv = document.createElement('div');
        contentDiv.className = 'spoiler-content';
        contentDiv.innerHTML = hiddenHTML;

        container.appendChild(contentDiv);

        // 4. Click event
        btn.addEventListener('click', () => {
            const isActive = btn.classList.toggle('active');
            contentDiv.classList.toggle('active');
            btn.innerText = isActive ? textShown : textHidden;
        });
    });

    // --- Functionaliteit: Stappenplan (Wizard) ---
    document.querySelectorAll('.steps-container').forEach(container => {
        // 1. Titel en caption ophalen (via attribuut of child element met class .title/.caption)
        let containerTitle = container.dataset.title;
        let containerCaption = container.dataset.caption;

        const titleEl = container.querySelector(':scope > .title');
        if (titleEl) {
            containerTitle = titleEl.innerText;
            titleEl.remove();
        }

        const captionEl = container.querySelector(':scope > .caption');
        if (captionEl) {
            containerCaption = captionEl.innerText;
            captionEl.remove();
        }

        if (containerTitle) {
            const title = document.createElement('h3');
            title.innerText = containerTitle;
            title.style.marginBottom = '5px'; // Minder marge zodat onderschrift aansluit
            
            const subtitle = document.createElement('p');
            subtitle.className = 'text-muted fst-italic small';
            subtitle.innerText = containerCaption || 'Gebruik de pijltjes om de stappen te overlopen';
            subtitle.style.marginBottom = '20px';
            
            container.prepend(subtitle);
            container.prepend(title);
        }

        // Haal alle directe kinderen op die een stap zijn
        const steps = Array.from(container.children).filter(el => el.classList.contains('step-item'));
        
        steps.forEach((step, index) => {
            // 1. Maak de navigatie header
            const nav = document.createElement('div');
            nav.className = 'step-navigation';

            // Vorige knop
            const btnBack = document.createElement('button');
            btnBack.className = 'btn-step-nav btn-step-back';
            btnBack.ariaLabel = "Vorige stap";
            if (index === 0) btnBack.disabled = true;
            else btnBack.onclick = () => setActiveStep(steps, index - 1);

            // Titel
            let stepTitle = step.dataset.title;
            const stepTitleEl = step.querySelector(':scope > .step');
            if (stepTitleEl) {
                stepTitle = stepTitleEl.innerText;
                stepTitleEl.remove();
            }

            const title = document.createElement('h3');
            title.innerText = stepTitle || `STAP ${index + 1}`;

            // Volgende knop
            const btnNext = document.createElement('button');
            btnNext.className = 'btn-step-nav btn-step-next';
            btnNext.ariaLabel = "Volgende stap";
            if (index === steps.length - 1) btnNext.disabled = true;
            else btnNext.onclick = () => setActiveStep(steps, index + 1);

            // Voeg alles samen
            nav.appendChild(btnBack);
            nav.appendChild(title);
            nav.appendChild(btnNext);
            
            // Plaats de navigatie bovenaan in de stap
            step.prepend(nav);
        });

        // Activeer de eerste stap bij het laden
        if (steps.length > 0) setActiveStep(steps, 0);
    });

    function setActiveStep(steps, index) {
        steps.forEach((step, i) => {
            if (i === index) step.classList.add('active');
            else step.classList.remove('active');
        });
    }

    // --- Functionaliteit: Download Container ---
    document.querySelectorAll('.download-container').forEach(container => {
        const link = container.querySelector('a');
        const list = container.querySelector('ul');

        if (!link) return;

        // Data ophalen
        const linkHref = link.getAttribute('href');
        const linkText = link.innerText.trim();
        const listContent = list ? list.innerHTML : '';

        // Container leegmaken en herbouwen
        container.innerHTML = '';

        const row = document.createElement('div');
        row.className = 'row align-items-center gy-3';

        // 1. Knop kolom
        const colBtn = document.createElement('div');
        colBtn.className = 'col-md-auto';
        const btn = document.createElement('a');
        btn.href = linkHref;
        btn.className = 'btn btn-download shadow-sm';
        btn.innerText = linkText;
        colBtn.appendChild(btn);
        row.appendChild(colBtn);

        // 2. Instructies kolom (alleen als er een lijst is)
        if (listContent) {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-md-auto d-none d-md-block';
            colDiv.innerHTML = '<div class="vr" style="height: 50px; opacity: 0.2;"></div>';
            row.appendChild(colDiv);

            const colList = document.createElement('div');
            colList.className = 'col-md';
            const ul = document.createElement('ul');
            ul.className = 'download-instructions';
            ul.innerHTML = listContent;
            colList.appendChild(ul);
            row.appendChild(colList);
        }
        
        container.appendChild(row);
    });

    // --- 3. JSON Viewer (Async laden indien nodig) ---
    const jsonWrappers = document.querySelectorAll('.json-wrapper');
    if (jsonWrappers.length > 0) {
        loadScript("https://code.jquery.com/jquery-3.7.1.min.js")
            .then(() => loadScript("https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.min.js"))
            .then(() => {
                document.querySelectorAll('.json-wrapper').forEach(wrapper => {
                    let element = wrapper;
                    // Fix voor Brightspace: als het een <pre> is, omzetten naar <div> voor correcte rendering plugin
                    if (element.tagName === 'PRE') {
                        const div = document.createElement('div');
                        div.className = element.className;
                        div.textContent = element.textContent;
                        element.parentNode.replaceChild(div, element);
                        element = div;
                    }
                    const $this = $(element);
                    const text = $this.text().trim();
                    if (!text) return;
                    try {
                        const jsonContent = JSON.parse(text);
                        $this.html('');
                        $this.jsonViewer(jsonContent, { collapsed: true, withQuotes: false });
                        
                        // Eerste niveau uitklappen
                        $this.find('a.json-toggle').first().click();

                        // Voeg copy button toe (jQuery style)
                        const $btn = $('<button class="btn-copy" title="Kopieer JSON"></button>');
                        $btn.on('click', function() {
                            navigator.clipboard.writeText(JSON.stringify(jsonContent, null, 2)).then(() => {
                                $btn.addClass('copied');
                                setTimeout(() => $btn.removeClass('copied'), 2000);
                            });
                        });
                        $this.append($btn);
                    } catch (e) {
                        console.error("Invalid JSON:", e);
                        $this.html(`<div class="text-danger p-2 border border-danger bg-light"><strong>Error:</strong><br>${e.message}</div>`);
                    }
                });
            });
    }

    // --- 4. MathJax (Async laden indien nodig) ---
    if (document.querySelectorAll('.math-tex').length > 0) {
        window.MathJax = {
            tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
            svg: { fontCache: 'global' }
        };
        loadScript("https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js");
    }

    // --- 5. STL Viewer (Three.js) ---
    const stlContainers = document.querySelectorAll('.stl-viewer');
    if (stlContainers.length > 0) {
        // Load Three.js core
        loadScript("https://cdn.jsdelivr.net/npm/three@0.146.0/build/three.min.js")
            .then(() => {
                // Load dependencies (Loader & Controls) - using 0.146.0 for 'examples/js' support
                return Promise.all([
                    loadScript("https://cdn.jsdelivr.net/npm/three@0.146.0/examples/js/loaders/STLLoader.js"),
                    loadScript("https://cdn.jsdelivr.net/npm/three@0.146.0/examples/js/controls/OrbitControls.js")
                ]);
            })
            .then(() => {
                document.querySelectorAll('.stl-viewer').forEach(container => {
                    const src = container.getAttribute('data-src');
                    if (!src) return;

                    // Setup Scene
                    const width = container.clientWidth;
                    const height = container.clientHeight;
                    const scene = new THREE.Scene();
                    scene.background = new THREE.Color(0xf9f9f9); // Match var(--box-bg)

                    // Camera
                    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
                    camera.position.set(50, 50, 50);

                    // Renderer
                    const renderer = new THREE.WebGLRenderer({ antialias: true });
                    renderer.setSize(width, height);
                    container.appendChild(renderer.domElement);

                    // Controls
                    const controls = new THREE.OrbitControls(camera, renderer.domElement);
                    controls.enableDamping = true;

                    // Lights
                    const ambientLight = new THREE.AmbientLight(0x404040);
                    scene.add(ambientLight);
                    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
                    dirLight.position.set(0, 1, 0);
                    scene.add(dirLight);
                    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
                    dirLight2.position.set(1, -1, 1);
                    scene.add(dirLight2);

                    // Load STL
                    const loader = new THREE.STLLoader();
                    loader.load(src, function (geometry) {
                        const material = new THREE.MeshPhongMaterial({ 
                            color: 0x004d40, // var(--primary)
                            specular: 0x111111, 
                            shininess: 200 
                        });
                        const mesh = new THREE.Mesh(geometry, material);
                        
                        // Center geometry
                        geometry.computeBoundingBox();
                        geometry.center();
                        
                        // Auto-scale to fit view roughly (target size ~50 units)
                        const box = geometry.boundingBox;
                        const size = new THREE.Vector3();
                        box.getSize(size);
                        const maxDim = Math.max(size.x, size.y, size.z);
                        if (maxDim > 0) {
                            const scale = 50 / maxDim; 
                            mesh.scale.set(scale, scale, scale);
                        }

                        scene.add(mesh);
                        
                        // Animation Loop
                        function animate() {
                            requestAnimationFrame(animate);
                            controls.update();
                            renderer.render(scene, camera);
                        }
                        animate();
                    }, undefined, function (error) {
                        console.error(error);
                        let errorMsg = `Error loading STL: ${src}`;
                        if (window.location.protocol === 'file:') {
                            errorMsg += '<br><small class="text-muted">Browsers blokkeren externe bestanden via file:// protocol.<br>Gebruik een lokale webserver (bv. VS Code Live Server).</small>';
                        }
                        container.innerHTML = `<div class="d-flex flex-column align-items-center justify-content-center h-100 text-danger text-center p-3">${errorMsg}</div>`;
                    });

                    // Handle Resize
                    window.addEventListener('resize', () => {
                        if (container.clientWidth > 0 && container.clientHeight > 0) {
                            const newWidth = container.clientWidth;
                            const newHeight = container.clientHeight;
                            camera.aspect = newWidth / newHeight;
                            camera.updateProjectionMatrix();
                            renderer.setSize(newWidth, newHeight);
                        }
                    });
                });
            })
            .catch(err => console.error("Failed to load Three.js", err));
    }

    // --- 6. Terminal Window ---
    document.querySelectorAll('.terminal-window').forEach(terminal => {
        terminal.querySelectorAll('.term-line').forEach(line => {
            const cmd = line.querySelector('.term-cmd');
            if (!cmd) return;

            const btn = document.createElement('button');
            btn.className = 'btn-copy-cmd';
            btn.title = 'Kopieer commando';
            btn.setAttribute('aria-label', 'Kopieer commando');
            
            btn.addEventListener('click', () => {
                const text = cmd.innerText.trim();
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(showSuccess);
                } else {
                    // Fallback
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try { document.execCommand('copy'); showSuccess(); } catch (err) {}
                    document.body.removeChild(textArea);
                }
                function showSuccess() { btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 2000); }
            });
            line.appendChild(btn);
        });
    });

    // --- Functionaliteit: Ants ---
    document.querySelectorAll('.ants-zone').forEach(el => {
        el.title = "Klik om de mieren te laten verdwijnen";
        el.addEventListener('click', (e) => {
            el.classList.add('ants-gone');
            el.removeAttribute('title');
        });
    });

    // --- 7. Config Editor ---
    document.querySelectorAll('.config-window').forEach(window => {
        window.querySelectorAll('.conf-line.new, .conf-line.mod').forEach(line => {
            // Check of er tekst is
            if (!line.innerText.trim()) return;

            const btn = document.createElement('button');
            btn.className = 'btn-copy-conf';
            btn.title = 'Kopieer regel';
            btn.setAttribute('aria-label', 'Kopieer regel');
            
            btn.addEventListener('click', () => {
                const text = line.innerText.trim();
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(showSuccess);
                } else {
                    // Fallback
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try { document.execCommand('copy'); showSuccess(); } catch (err) {}
                    document.body.removeChild(textArea);
                }
                function showSuccess() { btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 2000); }
            });
            line.appendChild(btn);
        });
    });
});