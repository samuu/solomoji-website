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
        // File upload events - ensure proper event handling
        this.uploadArea.addEventListener('click', (e) => {
            // Only trigger file input if the click is not on the browse link
            if (!e.target.classList.contains('browse-link')) {
                e.preventDefault();
                console.log('Upload area clicked');
                this.fileInput.click();
            }
        });
        
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Browse link click
        const browseLink = document.querySelector('.browse-link');
        if (browseLink) {
            browseLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Browse link clicked');
                this.fileInput.click();
            });
        }
        
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
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        e.preventDefault();
        e.stopPropagation();
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.txt')) {
            alert('Please select a .txt file from WhatsApp chat export.');
            this.resetToUpload();
            return;
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert('File is too large. Please select a file smaller than 50MB.');
            this.resetToUpload();
            return;
        }

        // Validate file is not empty
        if (file.size === 0) {
            alert('The selected file appears to be empty. Please select a valid WhatsApp chat export.');
            this.resetToUpload();
            return;
        }

        // Show processing state
        this.showProcessing();

        // Read file with proper encoding handling
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log('File loaded successfully, content length:', e.target.result.length);
            setTimeout(() => {
                this.processChatContent(e.target.result);
            }, 500); // Small delay for UX
        };
        
        reader.onerror = (e) => {
            console.error('Error reading file:', e);
            alert('Error reading file. Please try again.');
            this.resetToUpload();
        };
        
        reader.onabort = () => {
            console.log('File reading was aborted');
            this.resetToUpload();
        };
        
        // Try UTF-8 first, fallback to other encodings if needed
        try {
            reader.readAsText(file, 'UTF-8');
        } catch (error) {
            console.error('Error starting file read:', error);
            alert('Error processing file. Please try again.');
            this.resetToUpload();
        }
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
        console.log('Resetting to upload state');
        this.uploadArea.style.display = 'block';
        this.processingArea.style.display = 'none';
        this.resultArea.style.display = 'none';
        
        // Clear file input properly
        this.fileInput.value = '';
        this.fileInput.type = 'text';
        this.fileInput.type = 'file';
        
        // Clear data
        this.extractedEmojis = '';
        this.chatStats = {};
        
        // Clear any dragover state
        this.uploadArea.classList.remove('dragover');
        
        // Clear outputs
        if (this.emojiOutput) this.emojiOutput.textContent = '';
        if (this.resultStats) this.resultStats.innerHTML = '';
    }

    processChatContent(content) {
        try {
            console.log('Starting chat content processing, content preview:', content.substring(0, 200));
            
            // Validate content looks like WhatsApp export
            if (!this.isValidWhatsAppExport(content)) {
                alert('This doesn\'t appear to be a valid WhatsApp chat export. Please make sure you\'ve exported your chat as a .txt file from WhatsApp.');
                this.resetToUpload();
                return;
            }
            
            // Extract emojis from WhatsApp chat
            this.extractedEmojis = this.extractEmojis(content);
            console.log('Extracted emojis length:', this.extractedEmojis.length);
            
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

    isValidWhatsAppExport(content) {
        // Check for common WhatsApp export patterns
        const patterns = [
            /\[\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}.*\]/,  // [DD.MM.YY] or [DD/MM/YY]
            /\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}.*-/,     // DD.MM.YY - or DD/MM/YY -
            /\d{1,2}:\d{2}/                           // Time format
        ];
        
        const lines = content.split('\n').slice(0, 10); // Check first 10 lines
        let matches = 0;
        
        for (const line of lines) {
            for (const pattern of patterns) {
                if (pattern.test(line)) {
                    matches++;
                    break;
                }
            }
        }
        
        return matches > 0; // At least one line should match WhatsApp format
    }

    extractEmojis(chatContent) {
        console.log('Starting emoji extraction...');
        const lines = chatContent.split('\n');
        const emojis = [];
        
        // Comprehensive emoji regex that handles complex sequences and variations
        const emojiRegex = /(?:[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{E000}-\u{F8FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}])/gu;
        
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
                line.includes('GIF omitted') ||
                line.includes('sticker omitted') ||
                line.includes('Messages and calls are end-to-end encrypted') ||
                line.includes('Nachrichten und Anrufe sind Ende-zu-Ende-verschlüsselt') ||
                line.includes('You deleted this message') ||
                line.includes('This message was deleted') ||
                line.includes('Missed voice call') ||
                line.includes('Missed video call')) {
                return;
            }
            
            // Extract timestamp and message content
            // Support multiple WhatsApp formats
            const formats = [
                /^\[(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.*)$/i,
                /^(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.*)$/i
            ];
            
            let messageContent = '';
            let found = false;
            
            for (const format of formats) {
                const match = line.match(format);
                if (match) {
                    messageContent = match[4] || match[3]; // Get message content
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                // Try to extract emojis from any line that might contain them
                // but skip obvious system messages
                if (!line.includes('joined') && 
                    !line.includes('left') && 
                    !line.includes('changed') &&
                    !line.includes('created') &&
                    !line.includes('added') &&
                    !line.includes('removed')) {
                    messageContent = line;
                }
            }
            
            if (messageContent) {
                // Extract all emojis using comprehensive approach
                const foundEmojis = this.extractAllEmojisFromText(messageContent);
                if (foundEmojis.length > 0) {
                    emojis.push(...foundEmojis);
                    console.log(`Line ${index + 1}: Found ${foundEmojis.length} emojis:`, foundEmojis);
                }
            }
        });
        
        console.log(`Total emojis extracted: ${emojis.length}`);
        return emojis.join('');
    }

    extractAllEmojisFromText(text) {
        // Use a single, clean approach to avoid duplicates and false positives
        const emojis = [];
        
        // Split text into individual characters (properly handling Unicode surrogate pairs)
        const chars = [...text];
        
        chars.forEach(char => {
            const code = char.codePointAt(0);
            
            // Check if character is in emoji ranges (most comprehensive approach)
            if (this.isEmojiCharacter(code)) {
                emojis.push(char);
            }
        });
        
        return emojis;
    }

    isEmojiCharacter(codePoint) {
        // More precise emoji detection to avoid false positives
        return (
            // Emoticons and faces
            (codePoint >= 0x1F600 && codePoint <= 0x1F64F) ||
            // Miscellaneous Symbols and Pictographs
            (codePoint >= 0x1F300 && codePoint <= 0x1F5FF) ||
            // Transport and Map Symbols
            (codePoint >= 0x1F680 && codePoint <= 0x1F6FF) ||
            // Supplemental Symbols and Pictographs
            (codePoint >= 0x1F900 && codePoint <= 0x1F9FF) ||
            // Symbols and Pictographs Extended-A
            (codePoint >= 0x1FA00 && codePoint <= 0x1FA6F) ||
            (codePoint >= 0x1FA70 && codePoint <= 0x1FAFF) ||
            // Miscellaneous symbols (selective)
            (codePoint >= 0x2600 && codePoint <= 0x26FF) ||
            // Dingbats (selective)
            (codePoint >= 0x2700 && codePoint <= 0x27BF) ||
            // Playing card black joker
            codePoint === 0x1F0CF ||
            // Mahjong tile red dragon
            codePoint === 0x1F004 ||
            // Some common additional emojis
            codePoint === 0x203C || // ‼️
            codePoint === 0x2049 || // ⁉️
            codePoint === 0x2122 || // ™️
            codePoint === 0x2139 || // ℹ️
            codePoint === 0x2194 || // ↔️
            codePoint === 0x2195 || // ↕️
            codePoint === 0x2196 || // ↖️
            codePoint === 0x2197 || // ↗️
            codePoint === 0x2198 || // ↘️
            codePoint === 0x2199 || // ↙️
            codePoint === 0x21A9 || // ↩️
            codePoint === 0x21AA || // ↪️
            codePoint === 0x231A || // ⌚
            codePoint === 0x231B || // ⌛
            codePoint === 0x2328 || // ⌨️
            codePoint === 0x23CF || // ⏏️
            codePoint === 0x23E9 || // ⏩
            codePoint === 0x23EA || // ⏪
            codePoint === 0x23EB || // ⏫
            codePoint === 0x23EC || // ⏬
            codePoint === 0x23ED || // ⏭️
            codePoint === 0x23EE || // ⏮️
            codePoint === 0x23EF || // ⏯️
            codePoint === 0x23F0 || // ⏰
            codePoint === 0x23F1 || // ⏱️
            codePoint === 0x23F2 || // ⏲️
            codePoint === 0x23F3 || // ⏳
            codePoint === 0x23F8 || // ⏸️
            codePoint === 0x23F9 || // ⏹️
            codePoint === 0x23FA || // ⏺️
            codePoint === 0x24C2 || // Ⓜ️
            codePoint === 0x25AA || // ▪️
            codePoint === 0x25AB || // ▫️
            codePoint === 0x25B6 || // ▶️
            codePoint === 0x25C0 || // ◀️
            codePoint === 0x25FB || // ◻️
            codePoint === 0x25FC || // ◼️
            codePoint === 0x25FD || // ◽
            codePoint === 0x25FE || // ◾
            codePoint === 0x2600 || // ☀️
            codePoint === 0x2601 || // ☁️
            codePoint === 0x2602 || // ☂️
            codePoint === 0x2603 || // ☃️
            codePoint === 0x2604 || // ☄️
            codePoint === 0x260E || // ☎️
            codePoint === 0x2611 || // ☑️
            codePoint === 0x2614 || // ☔
            codePoint === 0x2615 || // ☕
            codePoint === 0x2618 || // ☘️
            codePoint === 0x261D || // ☝️
            codePoint === 0x2620 || // ☠️
            codePoint === 0x2622 || // ☢️
            codePoint === 0x2623 || // ☣️
            codePoint === 0x2626 || // ☦️
            codePoint === 0x262A || // ☪️
            codePoint === 0x262E || // ☮️
            codePoint === 0x262F || // ☯️
            codePoint === 0x2638 || // ☸️
            codePoint === 0x2639 || // ☹️
            codePoint === 0x263A || // ☺️
            codePoint === 0x2640 || // ♀️
            codePoint === 0x2642 || // ♂️
            codePoint === 0x2648 || // ♈
            codePoint === 0x2649 || // ♉
            codePoint === 0x264A || // ♊
            codePoint === 0x264B || // ♋
            codePoint === 0x264C || // ♌
            codePoint === 0x264D || // ♍
            codePoint === 0x264E || // ♎
            codePoint === 0x264F || // ♏
            codePoint === 0x2650 || // ♐
            codePoint === 0x2651 || // ♑
            codePoint === 0x2652 || // ♒
            codePoint === 0x2653 || // ♓
            codePoint === 0x265F || // ♟️
            codePoint === 0x2660 || // ♠️
            codePoint === 0x2663 || // ♣️
            codePoint === 0x2665 || // ♥️
            codePoint === 0x2666 || // ♦️
            codePoint === 0x2668 || // ♨️
            codePoint === 0x267B || // ♻️
            codePoint === 0x267E || // ♾️
            codePoint === 0x267F || // ♿
            codePoint === 0x2692 || // ⚒️
            codePoint === 0x2693 || // ⚓
            codePoint === 0x2694 || // ⚔️
            codePoint === 0x2695 || // ⚕️
            codePoint === 0x2696 || // ⚖️
            codePoint === 0x2697 || // ⚗️
            codePoint === 0x2699 || // ⚙️
            codePoint === 0x269B || // ⚛️
            codePoint === 0x269C || // ⚜️
            codePoint === 0x26A0 || // ⚠️
            codePoint === 0x26A1 || // ⚡
            codePoint === 0x26AA || // ⚪
            codePoint === 0x26AB || // ⚫
            codePoint === 0x26B0 || // ⚰️
            codePoint === 0x26B1 || // ⚱️
            codePoint === 0x26BD || // ⚽
            codePoint === 0x26BE || // ⚾
            codePoint === 0x26C4 || // ⛄
            codePoint === 0x26C5 || // ⛅
            codePoint === 0x26C8 || // ⛈️
            codePoint === 0x26CE || // ⛎
            codePoint === 0x26CF || // ⛏️
            codePoint === 0x26D1 || // ⛑️
            codePoint === 0x26D3 || // ⛓️
            codePoint === 0x26D4 || // ⛔
            codePoint === 0x26E9 || // ⛩️
            codePoint === 0x26EA || // ⛪
            codePoint === 0x26F0 || // ⛰️
            codePoint === 0x26F1 || // ⛱️
            codePoint === 0x26F2 || // ⛲
            codePoint === 0x26F3 || // ⛳
            codePoint === 0x26F4 || // ⛴️
            codePoint === 0x26F5 || // ⛵
            codePoint === 0x26F7 || // ⛷️
            codePoint === 0x26F8 || // ⛸️
            codePoint === 0x26F9 || // ⛹️
            codePoint === 0x26FA || // ⛺
            codePoint === 0x26FD    // ⛽
        );
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

    async generatePDF() {
        try {
            console.log('Starting PDF generation with emojis:', this.extractedEmojis.length);
            
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
            pdf.text('Your Emoji Story', pageWidth / 2, margin + 10, { align: 'center' });

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

            // Since jsPDF has limited emoji support, we'll use canvas-based approach
            await this.addEmojisToPDF(pdf, margin, yPosition, contentWidth, pageWidth, pageHeight);

            // Footer
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'italic');
            pdf.text('Created with love by Solomoji - Transform your chat memories into art', pageWidth / 2, pageHeight - 10, { align: 'center' });

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

    async addEmojisToPDF(pdf, startX, startY, contentWidth, pageWidth, pageHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size for high quality
        const canvasWidth = 800;
        const canvasHeight = 600;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Set font for emoji rendering
        ctx.font = '48px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", sans-serif';
        ctx.fillStyle = '#000000';
        ctx.textBaseline = 'top';
        
        const emojiSize = 50; // Size of each emoji in pixels
        const emojisPerRow = Math.floor(canvasWidth / emojiSize);
        const rowHeight = emojiSize + 10;
        
        let currentRow = 0;
        let currentCol = 0;
        let yPosition = startY;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Convert emojis to array
        const emojiArray = [...this.extractedEmojis];
        
        console.log(`Rendering ${emojiArray.length} emojis to PDF`);
        
        for (let i = 0; i < emojiArray.length; i++) {
            const emoji = emojiArray[i];
            
            // Calculate position
            const x = currentCol * emojiSize + 10;
            const y = currentRow * rowHeight + 10;
            
            // Draw emoji on canvas
            try {
                ctx.fillText(emoji, x, y);
            } catch (e) {
                console.warn(`Failed to render emoji: ${emoji}`, e);
                // Fallback: draw a placeholder
                ctx.fillRect(x, y, 40, 40);
            }
            
            currentCol++;
            
            // Check if we need to move to next row
            if (currentCol >= emojisPerRow) {
                currentCol = 0;
                currentRow++;
                
                // Check if we need to add this canvas to PDF and start a new one
                if ((currentRow + 1) * rowHeight > canvasHeight - 50) {
                    // Add current canvas to PDF
                    await this.addCanvasToPDF(pdf, canvas, startX, yPosition, contentWidth);
                    
                    // Check if we need a new page
                    yPosition += (canvasHeight * contentWidth / canvasWidth) + 10;
                    if (yPosition > pageHeight - 50) {
                        pdf.addPage();
                        yPosition = 30;
                    }
                    
                    // Clear canvas for next batch
                    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                    currentRow = 0;
                }
            }
        }
        
        // Add final canvas if it has content
        if (currentRow > 0 || currentCol > 0) {
            await this.addCanvasToPDF(pdf, canvas, startX, yPosition, contentWidth);
        }
    }

    async addCanvasToPDF(pdf, canvas, x, y, width) {
        try {
            // Convert canvas to image data
            const imgData = canvas.toDataURL('image/png');
            
            // Calculate height maintaining aspect ratio
            const aspectRatio = canvas.height / canvas.width;
            const height = width * aspectRatio;
            
            // Add image to PDF
            pdf.addImage(imgData, 'PNG', x, y, width, height);
        } catch (error) {
            console.error('Error adding canvas to PDF:', error);
            
            // Fallback: Add text representation
            pdf.setFontSize(12);
            pdf.text('Emojis could not be rendered. Total emojis: ' + this.extractedEmojis.length, x, y);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Solomoji app initializing...');
    const processor = new SolomojiProcessor();
    console.log('Solomoji app initialized successfully');
    
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