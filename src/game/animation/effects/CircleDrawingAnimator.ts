import { Scene } from 'phaser';

export interface CircleSegment {
    startAngle: number;
    endAngle: number;
    lineWidth: number;
}

export class CircleDrawingAnimator {
    private scene: Scene;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    /**
     * Create circle drawing effect from start point to end point with glow effect
     */
    public animateCircleDrawing(
        outlineGraphics: Phaser.GameObjects.Graphics,
        container: Phaser.GameObjects.Container,
        centerX: number, centerY: number,
        radius: number, startAngle: number, endAngle: number,
        color: number, duration: number, 
        startDelay: number = 0,
        segmentsArray?: CircleSegment[]
    ): void {
        // Calculate total angle
        let totalAngle = endAngle - startAngle;
        // Ensure total angle is in the right direction
        if (startAngle > endAngle) {
            totalAngle = (endAngle + 2 * Math.PI) - startAngle;
        }
        
        // Apply glow effect to container
        this._applyGlowEffect(container, color);
        
        // Set minimum and maximum line width
        const minLineWidth = 3;
        const maxLineWidth = 10;
        
        // Size of the dot at the drawing edge
        const minDotSize = 5;
        const maxDotSize = 15;
        
        // Variable to track drawn segments with corresponding widths
        const segments: CircleSegment[] = segmentsArray || [];
        const segmentStep = 0.05;
        let lastDrawnAngle = startAngle;
        
        // Create tween effect to draw circle segment by segment
        this.scene.tweens.add({
            targets: { progress: 0 },
            progress: 1,
            duration: duration * 1000, // Convert seconds to milliseconds
            delay: startDelay * 1000, // Convert seconds to milliseconds
            ease: 'Linear',
            onUpdate: (tween) => {
                // Get current progress value (0-1)
                const progress = tween.getValue();
                
                // Calculate current angle based on progress
                const currentEndAngle = startAngle + totalAngle * progress;
                
                // Calculate line width based on progress (increases with progress)
                const currentLineWidth = minLineWidth + (maxLineWidth - minLineWidth) * progress;
                
                // Clear current graphics to redraw
                outlineGraphics.clear();
                
                // Add new segment to list if long enough
                if (currentEndAngle - lastDrawnAngle >= segmentStep) {
                    segments.push({
                        startAngle: lastDrawnAngle,
                        endAngle: currentEndAngle,
                        lineWidth: currentLineWidth
                    });
                    lastDrawnAngle = currentEndAngle;
                }
                
                // Draw all completed segments with corresponding widths
                for (const segment of segments) {
                    // Draw main white outline with corresponding width
                    outlineGraphics.lineStyle(segment.lineWidth, 0xffffff, 1);
                    outlineGraphics.beginPath();
                    outlineGraphics.arc(centerX, centerY, radius, segment.startAngle, segment.endAngle, false);
                    outlineGraphics.strokePath();
                }
                
                // Draw a dot at the current position of the drawing
                const currentX = centerX + radius * Math.cos(currentEndAngle);
                const currentY = centerY + radius * Math.sin(currentEndAngle);
                
                // Calculate dot size based on progress
                const currentDotSize = minDotSize + (maxDotSize - minDotSize) * progress;
                
                outlineGraphics.fillStyle(0xffffff, 1);
                outlineGraphics.fillCircle(currentX, currentY, currentDotSize / 2);
            },
            onComplete: () => {
                // Drawing animation completed
            }
        });
    }
    
    /**
     * Apply glow effect to an object
     */
    private _applyGlowEffect(container: Phaser.GameObjects.Container, color: number): void {
        try {
            // Check if plugin is loaded
            if (this.scene.plugins.get('rexglowfilter2pipelineplugin')) {
                (this.scene.plugins.get('rexglowfilter2pipelineplugin') as any).add(container, {
                    outerStrength: 5,
                    innerStrength: 0,
                    glowColor: color,
                    knockout: false,
                    quality: 1,
                    padding: 0
                });
            }
        } catch (error) {
            console.error("Cannot apply glow effect:", error);
        }
    }
    
    /**
     * Animate thinning of circle lines before erasing
     */
    public animateCircleThinning(
        graphics: Phaser.GameObjects.Graphics,
        centerX: number, centerY: number,
        radius: number,
        segments: CircleSegment[],
        duration: number,
        onComplete?: Function
    ): void {
        // Track initial line widths
        const initialLineWidths = segments.map(segment => segment.lineWidth);
        
        // Add subtle oscillation parameters
        const oscillationSpeed = 5;
        const oscillationDepth = 0.1;
        
        // Create tween for thinning segments
        this.scene.tweens.add({
            targets: { progress: 0 },
            progress: 1,
            duration: duration * 1000,
            ease: 'Linear',
            onUpdate: (tween) => {
                const progress = tween.getValue();
                const time = this.scene.time.now / 1000;
                
                // Clear graphics for redrawing
                graphics.clear();
                
                // Redraw segments with decreasing width
                for (let i = 0; i < segments.length; i++) {
                    const segment = segments[i];
                    const initialWidth = initialLineWidths[i];
                    
                    // Add oscillation effect
                    const oscillation = 1 + (Math.sin(time * oscillationSpeed + i * 0.1) * oscillationDepth * (1 - progress));
                    
                    // Calculate new width with oscillation
                    const newLineWidth = initialWidth * (1 - (progress * 0.8)) * oscillation;
                    
                    // Update segment width for later erasing effect
                    segment.lineWidth = newLineWidth;
                    
                    // Redraw segment with new width
                    graphics.lineStyle(newLineWidth, 0xffffff, 1);
                    graphics.beginPath();
                    graphics.arc(centerX, centerY, radius, segment.startAngle, segment.endAngle, false);
                    graphics.strokePath();
                }
                
                // Draw dot at end of last segment, also decreasing in size
                if (segments.length > 0) {
                    const lastSegment = segments[segments.length - 1];
                    const currentX = centerX + radius * Math.cos(lastSegment.endAngle);
                    const currentY = centerY + radius * Math.sin(lastSegment.endAngle);
                    
                    // Calculate dot size based on progress
                    const initialDotSize = 15;
                    const currentDotSize = initialDotSize * (1 - (progress * 0.8));
                    
                    graphics.fillStyle(0xffffff, 1);
                    graphics.fillCircle(currentX, currentY, currentDotSize / 2);
                }
            },
            onComplete: () => {
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }
    
    /**
     * Create effect to gradually erase circle drawing strokes (in reverse order)
     */
    public animateCircleErasing(
        graphics: Phaser.GameObjects.Graphics,
        centerX: number, centerY: number,
        radius: number,
        segments: CircleSegment[],
        duration: number
    ): void {
        // Copy array to avoid affecting the original
        const segmentsCopy = [...segments];
        
        // Get total segments count
        const totalSegments = segmentsCopy.length;
        
        if (totalSegments === 0) return;
        
        // Create tween for erasing segments from beginning to end (reverse of drawing)
        this.scene.tweens.add({
            targets: { progress: 0 },
            progress: 1,
            duration: duration * 1000,
            ease: 'Linear',
            onUpdate: (tween) => {
                const progress = tween.getValue();
                
                // Calculate segments to keep (from the end)
                const segmentsToKeep = Math.ceil(totalSegments * (1 - progress));
                const startIndex = Math.max(0, totalSegments - segmentsToKeep);
                
                // Clear graphics for redrawing
                graphics.clear();
                
                // Add glowing trail effect
                const trailLength = Math.min(5, startIndex);
                for (let i = Math.max(0, startIndex - trailLength); i < startIndex; i++) {
                    const segment = segmentsCopy[i];
                    const trailProgress = (startIndex - i) / trailLength;
                    const alpha = 0.7 * (1 - trailProgress);
                    const glowWidth = segment.lineWidth * 1.5;
                    
                    // Draw glowing trail
                    graphics.lineStyle(glowWidth, 0xffffff, alpha);
                    graphics.beginPath();
                    graphics.arc(centerX, centerY, radius, segment.startAngle, segment.endAngle, false);
                    graphics.strokePath();
                }
                
                // Redraw remaining segments (keeping the end part)
                for (let i = startIndex; i < totalSegments; i++) {
                    const segment = segmentsCopy[i];
                    graphics.lineStyle(segment.lineWidth, 0xffffff, 1);
                    graphics.beginPath();
                    graphics.arc(centerX, centerY, radius, segment.startAngle, segment.endAngle, false);
                    graphics.strokePath();
                }
                
                // Draw dot at beginning of first remaining segment
                if (segmentsToKeep > 0) {
                    const firstSegment = segmentsCopy[startIndex];
                    const currentX = centerX + radius * Math.cos(firstSegment.startAngle);
                    const currentY = centerY + radius * Math.sin(firstSegment.startAngle);
                    
                    // Calculate dot size based on progress
                    const currentDotSize = Math.max(15 * (1 - progress), 5);
                    
                    graphics.fillStyle(0xffffff, 1);
                    graphics.fillCircle(currentX, currentY, currentDotSize / 2);
                    
                    // Add glow effect to the erasure point
                    const glowRadius = currentDotSize;
                    graphics.fillStyle(0xffffff, 0.3);
                    graphics.fillCircle(currentX, currentY, glowRadius);
                    graphics.fillStyle(0xffffff, 0.15);
                    graphics.fillCircle(currentX, currentY, glowRadius * 1.5);
                }
            },
            onComplete: () => {
                // Ensure complete clearing when animation ends
                graphics.clear();
            }
        });
    }
    /**
     * Create effect to gradually fade out the outer circle
     */
    public fadeOutCircle(
        graphics: Phaser.GameObjects.Graphics,
        centerX: number, centerY: number,
        radius: number,
        duration: number
    ): void {
        // Create variables to track alpha and line width
        const params = { alpha: 0.5, lineWidth: 2 };
        
        // Create tween effect to gradually decrease alpha and line width
        this.scene.tweens.add({
            targets: params,
            alpha: 0,
            lineWidth: 0.2,
            duration: duration * 1000,
            ease: 'Linear',
            onUpdate: () => {
                // Clear current graphics to redraw
                graphics.clear();
                
                // Redraw circle with new alpha and line width
                graphics.lineStyle(params.lineWidth, 0xffffff, params.alpha);
                graphics.beginPath();
                graphics.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                graphics.strokePath();
            },
            onComplete: () => {
                // Ensure complete clearing when animation ends
                graphics.clear();
            }
        });
    }
} 