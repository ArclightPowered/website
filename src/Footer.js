import React from 'react';
import './Footer.css';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-links">
                    <a href="https://github.com/IzzelAliz/Arclight" className="footer-link">GitHub</a>
                    <a href="https://wiki.izzel.io/s/arclight-docs" className="footer-link">Document</a>
                    <a href="https://discord.gg/ZvTY5SC" className="footer-link">Discord</a>
                    <a href="https://github.com/IzzelAliz/Arclight/issues/new/choose" className="footer-link">Support</a>
                </div>
                <div className="footer-copyright">
                    <p>&#127279; 2020-{currentYear} Arclight. Licensed under GPL-v3.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
