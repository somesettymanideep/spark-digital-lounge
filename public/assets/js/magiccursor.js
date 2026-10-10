/**
 * SEA Animated Flying Parrot Custom Cursor Loader
 * Automatically attaches sea-cursor stylesheet and controller to any template page.
 */
(function () {
    'use strict';

    if (window.__SEA_MAGICCURSOR_LOADED__) return;
    window.__SEA_MAGICCURSOR_LOADED__ = true;

    function injectStyles() {
        if (!document.querySelector('link[href*="sea-cursor.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'assets/css/sea-cursor.css';
            document.head.appendChild(link);
        }
    }

    function injectScript() {
        if (!window.__SEA_CURSOR_INITIALIZED__ && !document.querySelector('script[src*="sea-cursor.js"]')) {
            const script = document.createElement('script');
            script.src = 'assets/js/sea-cursor.js';
            document.body.appendChild(script);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectStyles();
            injectScript();
        });
    } else {
        injectStyles();
        injectScript();
    }
})();
