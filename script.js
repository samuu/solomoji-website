// Solomoji - WhatsApp Chat to Emoji Poster
// All processing happens client-side for privacy

class SolomojiProcessor {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.processingArea = document.getElementById('processingArea');
        this.resultArea = document.getElementById('resultArea');
        this.emojiOutput = document.getElementById('emojiOutput');
        this.resultStats = document.getElementById('resultStats');
        this.downloadPdfBtn = document.getElementById('downloadPdf');
        this.createAnotherBtn = document.getElementById('createAnother');
        
        this.extractedEmojis = '';
        this.chatStats = {};
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Browse link click
        document.querySelector('.browse-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.fileInput.click();
        });
        
        // Button events
        this.downloadPdfBtn.addEventListener('click', () => this.generatePDF());
        this.createAnotherBtn.addEventListener('click', () => this.resetToUpload());
        
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.txt')) {
            alert('Please select a .txt file from WhatsApp chat export.');
            return;
        }

        // Show processing state
        this.showProcessing();

        // Read file
        const reader = new FileReader();
        reader.onload = (e) => {
            setTimeout(() => {
                this.processChatContent(e.target.result);
            }, 500); // Small delay for UX
        };
        reader.onerror = () => {
            alert('Error reading file. Please try again.');
            this.resetToUpload();
        };
        reader.readAsText(file);
    }

    showProcessing() {
        this.uploadArea.style.display = 'none';
        this.processingArea.style.display = 'block';
        this.resultArea.style.display = 'none';
    }

    showResults() {
        this.uploadArea.style.display = 'none';
        this.processingArea.style.display = 'none';
        this.resultArea.style.display = 'block';
    }

    resetToUpload() {
        this.uploadArea.style.display = 'block';
        this.processingArea.style.display = 'none';
        this.resultArea.style.display = 'none';
        this.fileInput.value = '';
        this.extractedEmojis = '';
        this.chatStats = {};
    }

    processChatContent(content) {
        try {
            // Extract emojis from WhatsApp chat
            this.extractedEmojis = this.extractEmojis(content);
            this.chatStats = this.generateStats(content, this.extractedEmojis);
            
            if (this.extractedEmojis.length === 0) {
                alert('No emojis found in this chat file. Please make sure you\'ve selected a WhatsApp chat export with emojis.');
                this.resetToUpload();
                return;
            }

            // Display results
            this.displayResults();
            this.showResults();
            
        } catch (error) {
            console.error('Error processing chat:', error);
            alert('Error processing the chat file. Please make sure it\'s a valid WhatsApp export.');
            this.resetToUpload();
        }
    }

    extractEmojis(chatContent) {
        // Use a more robust emoji detection approach
        // This regex captures most modern emojis including complex sequences
        const emojiRegex = /(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
        
        // Fallback regex for older browsers or if the above doesn't work
        const fallbackEmojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{1f700}-\u{1f77f}\u{1f780}-\u{1f7ff}\u{1f800}-\u{1f8ff}\u{1f900}-\u{1f9ff}\u{1fa00}-\u{1fa6f}\u{1fa70}-\u{1faff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu;
        
        const lines = chatContent.split('\n');
        const emojis = [];
        
        lines.forEach((line, index) => {
            // Skip system messages and empty lines
            if (line.trim() === '' || 
                line.includes('‎Bild weggelassen') || 
                line.includes('‎Video weggelassen') ||
                line.includes('‎Audio weggelassen') ||
                line.includes('‎Dokument weggelassen') ||
                line.includes('image omitted') ||
                line.includes('video omitted') ||
                line.includes('audio omitted') ||
                line.includes('document omitted') ||
                line.includes('Messages and calls are end-to-end encrypted') ||
                line.includes('Nachrichten und Anrufe sind Ende-zu-Ende-verschlüsselt')) {
                return;
            }
            
            // Extract timestamp and message content
            // WhatsApp format: [DD.MM.YY, HH:MM:SS] Name: Message
            const messageMatch = line.match(/^\[[\d.,\s:]+\]\s+([^:]+):\s*(.*)$/);
            if (messageMatch) {
                const messageContent = messageMatch[2];
                
                // Try modern emoji regex first
                let messageEmojis = messageContent.match(emojiRegex);
                
                // If that doesn't work, try fallback
                if (!messageEmojis || messageEmojis.length === 0) {
                    messageEmojis = messageContent.match(fallbackEmojiRegex);
                }
                
                // If still no emojis, try character-by-character approach
                if (!messageEmojis || messageEmojis.length === 0) {
                    const chars = [...messageContent];
                    const foundEmojis = [];
                    chars.forEach(char => {
                        // Check if character is in emoji ranges
                        const code = char.codePointAt(0);
                        if ((code >= 0x1F600 && code <= 0x1F64F) || // Emoticons
                            (code >= 0x1F300 && code <= 0x1F5FF) || // Misc Symbols and Pictographs
                            (code >= 0x1F680 && code <= 0x1F6FF) || // Transport and Map
                            (code >= 0x1F1E6 && code <= 0x1F1FF) || // Regional indicators
                            (code >= 0x2600 && code <= 0x26FF) ||   // Misc symbols
                            (code >= 0x2700 && code <= 0x27BF) ||   // Dingbats
                            (code >= 0x1F900 && code <= 0x1F9FF) || // Supplemental Symbols and Pictographs
                            (code >= 0x1FA00 && code <= 0x1FA6F)) { // Chess Symbols
                            foundEmojis.push(char);
                        }
                    });
                    messageEmojis = foundEmojis;
                }
                
                if (messageEmojis && messageEmojis.length > 0) {
                    emojis.push(...messageEmojis);
                }
            }
        });
        
        return emojis.join('');
    }

    generateStats(chatContent, emojis) {
        const lines = chatContent.split('\n').filter(line => 
            line.trim() !== '' && 
            !line.includes('‎Bild weggelassen') && 
            !line.includes('‎Video weggelassen') &&
            !line.includes('image omitted') &&
            !line.includes('video omitted')
        );
        
        const messageLines = lines.filter(line => 
            line.match(/^\[[\d.,\s:]+\]\s+([^:]+):\s*(.*)$/)
        );
        
        // Count unique emojis
        const uniqueEmojis = [...new Set(emojis)];
        
        // Extract date range
        const dates = [];
        messageLines.forEach(line => {
            const dateMatch = line.match(/^\[(\d{1,2}\.\d{1,2}\.\d{2,4})/);
            if (dateMatch) {
                dates.push(dateMatch[1]);
            }
        });
        
        return {
            totalEmojis: emojis.length,
            uniqueEmojis: uniqueEmojis.length,
            totalMessages: messageLines.length,
            dateRange: dates.length > 0 ? {
                first: dates[0],
                last: dates[dates.length - 1]
            } : null
        };
    }

    displayResults() {
        // Display emojis
        this.emojiOutput.textContent = this.extractedEmojis;
        
        // Display stats
        let statsHTML = `
            <div class="stat-item">
                <strong>${this.chatStats.totalEmojis}</strong> total emojis found
            </div>
            <div class="stat-item">
                <strong>${this.chatStats.uniqueEmojis}</strong> unique emojis
            </div>
            <div class="stat-item">
                From <strong>${this.chatStats.totalMessages}</strong> messages
            </div>
        `;
        
        if (this.chatStats.dateRange) {
            statsHTML += `
                <div class="stat-item">
                    Date range: <strong>${this.chatStats.dateRange.first}</strong> to <strong>${this.chatStats.dateRange.last}</strong>
                </div>
            `;
        }
        
        this.resultStats.innerHTML = statsHTML;
    }

    generatePDF() {
        try {
            // Create new PDF document
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // PDF dimensions
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);

            // Title
            pdf.setFontSize(24);
            pdf.setFont(undefined, 'bold');
            pdf.text('🎨 Your Emoji Story', pageWidth / 2, margin + 10, { align: 'center' });

            // Subtitle
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'normal');
            pdf.text('Generated by Solomoji', pageWidth / 2, margin + 20, { align: 'center' });

            // Stats
            let yPosition = margin + 40;
            pdf.setFontSize(10);
            
            if (this.chatStats.dateRange) {
                pdf.text(`Chat period: ${this.chatStats.dateRange.first} - ${this.chatStats.dateRange.last}`, margin, yPosition);
                yPosition += 8;
            }
            
            pdf.text(`Total emojis: ${this.chatStats.totalEmojis} | Unique emojis: ${this.chatStats.uniqueEmojis} | Messages: ${this.chatStats.totalMessages}`, margin, yPosition);
            yPosition += 20;

            // Emojis section
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text('Your Emoji Journey:', margin, yPosition);
            yPosition += 15;

            // Add emojis (Note: PDF generation with emojis is limited, so we'll create a text representation)
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'normal');
            
            // Split emojis into lines that fit the page width
            const emojisPerLine = Math.floor(contentWidth / 8); // Approximate emoji width
            const emojiLines = [];
            
            for (let i = 0; i < this.extractedEmojis.length; i += emojisPerLine) {
                emojiLines.push(this.extractedEmojis.slice(i, i + emojisPerLine));
            }

            // Add emoji lines to PDF
            emojiLines.forEach(line => {
                if (yPosition > pageHeight - margin - 20) {
                    pdf.addPage();
                    yPosition = margin + 20;
                }
                
                // Center the emoji line
                const lineWidth = line.length * 4; // Approximate width
                const xPosition = (pageWidth - lineWidth) / 2;
                
                pdf.text(line, xPosition, yPosition);
                yPosition += 12;
            });

            // Footer
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'italic');
            pdf.text('Created with ❤️ by Solomoji - Transform your chat memories into art', pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().split('T')[0];
            const filename = `solomoji-poster-${timestamp}.pdf`;

            // Save the PDF
            pdf.save(filename);

            // Track download event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'download', {
                    event_category: 'PDF',
                    event_label: 'Emoji Poster',
                    value: this.chatStats.totalEmojis
                });
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SolomojiProcessor();
    
    // Add some CSS for stats display
    const style = document.createElement('style');
    style.textContent = `
        .stat-item {
            margin-bottom: 0.5rem;
            font-size: 1rem;
        }
        .stat-item strong {
            color: #667eea;
        }
    `;
    document.head.appendChild(style);
});

// Add some utility functions for better UX
window.addEventListener('load', () => {
    // Smooth reveal animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe sections for animation
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});