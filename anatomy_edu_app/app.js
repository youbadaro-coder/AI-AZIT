document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Logic
    const navItems = document.querySelectorAll('.course-nav li');
    const sections = document.querySelectorAll('.lesson-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('locked')) {
                // If it's a locked item, show the premium overlay section (if exists) or prompt
                const targetId = item.getAttribute('data-target');
                activateSection(targetId, item);
                return;
            }

            const targetId = item.getAttribute('data-target');
            activateSection(targetId, item);
        });
    });

    function activateSection(id, clickedItem) {
        // Update active nav
        navItems.forEach(nav => nav.classList.remove('active'));
        clickedItem.classList.add('active');

        // Update active section
        sections.forEach(sec => {
            sec.classList.remove('active');
            sec.classList.add('hidden');
        });

        const targetSection = document.getElementById(id);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
        }
    }

    // 2. View Selector Logic for Anatomy
    const viewBtns = document.querySelectorAll('.view-btn');
    const viewPanes = document.querySelectorAll('.anatomy-view-pane');

    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons
            viewBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            btn.classList.add('active');

            const viewId = btn.getAttribute('data-view');

            // Hide all panes
            viewPanes.forEach(pane => {
                pane.classList.remove('active');
                pane.classList.add('hidden');
            });

            // Show selected pane
            const targetPane = document.getElementById(`view-${viewId}`);
            if (targetPane) {
                targetPane.classList.remove('hidden');
                targetPane.classList.add('active');
            }
        });
    });

    // 3. Interactive SVG Anatomy Logic
    const zones = document.querySelectorAll('.interactive-zone');
    const tooltip = document.getElementById('infoTooltip');
    const tooltipTitle = document.getElementById('tooltipTitle');
    const tooltipDesc = document.getElementById('tooltipDesc');
    const viewer = document.querySelector('.interactive-viewer');

    if (zones.length > 0 && tooltip && viewer) {
        zones.forEach(zone => {
            zone.addEventListener('mouseenter', (e) => {
                const infoText = zone.getAttribute('data-info');
                const [title, desc] = infoText.split(':');
                
                tooltipTitle.textContent = title ? title.trim() : '세부 정보';
                tooltipDesc.textContent = desc ? desc.trim() : infoText;
                
                tooltip.classList.remove('hidden');
            });

            zone.addEventListener('mousemove', (e) => {
                // Get mouse position relative to the viewer container
                const rect = viewer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                tooltip.style.left = `${x + 15}px`;
                tooltip.style.top = `${y + 15}px`;
            });

            zone.addEventListener('mouseleave', () => {
                tooltip.classList.add('hidden');
            });
        });
    }
});
