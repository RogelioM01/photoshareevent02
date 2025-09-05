interface TextPostImageOptions {
  content: string;
  userName: string;
  timestamp: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  userNameColor?: string;
  fontSize?: number;
  fontFamily?: string;
  padding?: number;
}

export function generateTextPostImage(options: TextPostImageOptions): Promise<string> {
  return new Promise((resolve) => {
    const {
      content,
      userName,
      timestamp,
      width = 800,
      height = 600,
      backgroundColor = '#ffffff',
      textColor = '#374151',
      userNameColor = '#ffffff',
      fontSize = 24,
      fontFamily = 'Arial, sans-serif',
      padding = 40
    } = options;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Add subtle border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Configure text settings
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Draw username badge
    const badgeHeight = 40;
    const badgeY = padding;
    const badgeRadius = 20;
    
    // Create gradient for username badge (similar to current design)
    const gradient = ctx.createLinearGradient(padding, badgeY, padding + 200, badgeY + badgeHeight);
    gradient.addColorStop(0, '#4b5563'); // gray-600
    gradient.addColorStop(1, '#374151'); // gray-700
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(padding, badgeY, 200, badgeHeight, badgeRadius);
    ctx.fill();

    // Draw username text
    ctx.fillStyle = userNameColor;
    ctx.font = `bold ${fontSize * 0.7}px ${fontFamily}`;
    ctx.fillText(userName, padding + 15, badgeY + 12);

    // Draw timestamp
    ctx.fillStyle = '#9ca3af'; // gray-400
    ctx.font = `${fontSize * 0.6}px ${fontFamily}`;
    ctx.fillText(timestamp, width - padding - 200, badgeY + 15);

    // Calculate text area
    const textStartY = badgeY + badgeHeight + padding;
    const textWidth = width - (padding * 2);
    const lineHeight = fontSize * 1.4;

    // Word wrap function
    function wrapText(text: string, maxWidth: number): string[] {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      ctx.font = `${fontSize}px ${fontFamily}`;

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    }

    // Draw main content text
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px ${fontFamily}`;
    
    const lines = wrapText(content, textWidth);
    
    lines.forEach((line, index) => {
      ctx.fillText(line, padding, textStartY + (index * lineHeight));
    });

    // Add decorative element (similar to current design)
    const decorY = height - padding - 20;
    ctx.fillStyle = '#f3f4f6'; // gray-100
    ctx.fillRect(padding, decorY, width - (padding * 2), 2);

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png', 0.9);
    resolve(dataUrl);
  });
}

export function downloadTextPostImage(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}