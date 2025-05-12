import { Scene } from 'phaser';
import { CirclePositionHelper } from './effects/CirclePositionHelper';
import { CircleDrawingAnimator, CircleSegment } from './effects/CircleDrawingAnimator';

export interface AlchemistLogoConfig {
    drawDuration?: number;
    outerCircleDuration?: number;
    thinningDuration?: number;
    eraseDuration?: number;
    outerCircleEraseDuration?: number;
}

export class AlchemistLogo {
    private scene: Scene;
    private animator: CircleDrawingAnimator;
    private config: Required<AlchemistLogoConfig>;
    
    // Colors for the circles
    private readonly GREEN_COLOR = 0x00ff00;
    private readonly PINK_COLOR = 0xff00ff;
    private readonly BLUE_COLOR = 0x00ffff;
    
    constructor(scene: Scene, config?: AlchemistLogoConfig) {
        this.scene = scene;
        this.animator = new CircleDrawingAnimator(scene);
        this.config = {
            drawDuration: config?.drawDuration ?? 2,
            outerCircleDuration: config?.outerCircleDuration ?? 1,
            thinningDuration: config?.thinningDuration ?? 3,
            eraseDuration: config?.eraseDuration ?? 2,
            outerCircleEraseDuration: config?.outerCircleEraseDuration ?? 1
        };
    }
    
    /**
     * Start the Alchemist logo effect
     */
    public play(): void {
        // Setup and calculate coordinates
        const { 
            centerX, centerY, radius,
            greenCenterX, greenCenterY,
            pinkCenterX, pinkCenterY,
            blueCenterX, blueCenterY 
        } = CirclePositionHelper.calculateCirclePositions(
            this.scene.cameras.main.width, 
            this.scene.cameras.main.height
        );
        
        // Create graphics and containers
        const { 
            greenOutline, greenContainer,
            pinkOutline, pinkContainer, 
            blueOutline, blueContainer,
            outerCircleGraphics, outerCircleContainer
        } = this._createGraphicsAndContainers();
        
        // Calculate angles and end points
        const { 
            greenEndX, greenEndY, greenEndAngle,
            pinkEndX, pinkEndY, pinkEndAngle,
            blueEndX, blueEndY, blueEndAngle
        } = CirclePositionHelper.calculateEndPoints(
            greenCenterX, greenCenterY, 
            pinkCenterX, pinkCenterY, 
            blueCenterX, blueCenterY, 
            radius
        );
        
        // Calculate center and radius of circle passing through 3 end points
        const { centerX: outerCenterX, centerY: outerCenterY, radius: outerRadius } = 
            CirclePositionHelper.calculateCircleThroughThreePoints(
                greenEndX, greenEndY, 
                pinkEndX, pinkEndY, 
                blueEndX, blueEndY
            );
        
        // Maximum radius for outer circle
        const customOuterRadius = outerRadius * 1.05;
        
        // Initially hide outer circle
        outerCircleGraphics.clear();
        
        // Store segments of each circle for later erasing in reverse
        const greenSegments: CircleSegment[] = [];
        const pinkSegments: CircleSegment[] = [];
        const blueSegments: CircleSegment[] = [];
        
        // Create circle drawing effects
        this._createDrawingEffects(
            greenOutline, greenContainer, greenCenterX, greenCenterY, radius, 
            Phaser.Math.DegToRad(-60), greenEndAngle, this.GREEN_COLOR, greenSegments,
            pinkOutline, pinkContainer, pinkCenterX, pinkCenterY, radius,
            Phaser.Math.DegToRad(60), pinkEndAngle, this.PINK_COLOR, pinkSegments,
            blueOutline, blueContainer, blueCenterX, blueCenterY, radius,
            Phaser.Math.DegToRad(180), blueEndAngle, this.BLUE_COLOR, blueSegments
        );
        
        // Create zoom effect for outer circle after 3 circles are drawn
        this._createOuterCircleEffect(
            outerCircleGraphics, outerCircleContainer, 
            outerCenterX, outerCenterY, customOuterRadius,
            greenOutline, greenCenterX, greenCenterY, radius, greenSegments,
            pinkOutline, pinkCenterX, pinkCenterY, radius, pinkSegments,
            blueOutline, blueCenterX, blueCenterY, radius, blueSegments
        );
    }
    
    /**
     * Create graphics and containers
     */
    private _createGraphicsAndContainers() {
        // Create container for each circle to apply glow effect
        const pinkContainer = this.scene.add.container(0, 0);
        const blueContainer = this.scene.add.container(0, 0);
        const greenContainer = this.scene.add.container(0, 0);
        
        // Create graphics objects for circles
        const pinkOutline = this.scene.add.graphics();
        const blueOutline = this.scene.add.graphics();
        const greenOutline = this.scene.add.graphics();
        
        // Add graphics to corresponding containers
        pinkContainer.add(pinkOutline);
        blueContainer.add(blueOutline);
        greenContainer.add(greenOutline);
        
        // Create center dot graphics
        const centerDot = this.scene.add.graphics();
        centerDot.fillStyle(0xffffff, 1);
        centerDot.fillCircle(
            this.scene.cameras.main.width / 2, 
            this.scene.cameras.main.height / 2 - 20, 
            3
        );
        
        // Create container and graphics for outer circle
        const outerCircleContainer = this.scene.add.container(0, 0);
        const outerCircleGraphics = this.scene.add.graphics();
        outerCircleContainer.add(outerCircleGraphics);
        
        return {
            greenOutline, greenContainer,
            pinkOutline, pinkContainer,
            blueOutline, blueContainer,
            outerCircleGraphics, outerCircleContainer,
            centerDot
        };
    }
    
    /**
     * Create circle drawing effects
     */
    private _createDrawingEffects(
        greenOutline: Phaser.GameObjects.Graphics, greenContainer: Phaser.GameObjects.Container,
        greenCenterX: number, greenCenterY: number, radius: number, 
        greenStartAngle: number, greenEndAngle: number, greenColor: number, greenSegments: CircleSegment[],
        
        pinkOutline: Phaser.GameObjects.Graphics, pinkContainer: Phaser.GameObjects.Container,
        pinkCenterX: number, pinkCenterY: number, pinkRadius: number,
        pinkStartAngle: number, pinkEndAngle: number, pinkColor: number, pinkSegments: CircleSegment[],
        
        blueOutline: Phaser.GameObjects.Graphics, blueContainer: Phaser.GameObjects.Container,
        blueCenterX: number, blueCenterY: number, blueRadius: number,
        blueStartAngle: number, blueEndAngle: number, blueColor: number, blueSegments: CircleSegment[]
    ) {
        const drawDuration = this.config.drawDuration;
        
        // Create drawing effect for green circle
        this.animator.animateCircleDrawing(
            greenOutline, greenContainer,
            greenCenterX, greenCenterY,
            radius, greenStartAngle, greenEndAngle,
            greenColor, drawDuration,
            0, // No delay
            greenSegments // Store segments
        );
        
        // Create drawing effect for pink circle
        this.animator.animateCircleDrawing(
            pinkOutline, pinkContainer,
            pinkCenterX, pinkCenterY,
            pinkRadius, pinkStartAngle, pinkEndAngle,
            pinkColor, drawDuration,
            0, // No delay
            pinkSegments // Store segments
        );
        
        // Create drawing effect for blue circle
        this.animator.animateCircleDrawing(
            blueOutline, blueContainer,
            blueCenterX, blueCenterY,
            blueRadius, blueStartAngle, blueEndAngle,
            blueColor, drawDuration,
            0, // No delay
            blueSegments // Store segments
        );
    }
    
    /**
     * Create zoom effect for outer circle and thinning and erasing effects
     */
    private _createOuterCircleEffect(
        outerCircleGraphics: Phaser.GameObjects.Graphics, outerCircleContainer: Phaser.GameObjects.Container,
        outerCenterX: number, outerCenterY: number, customOuterRadius: number,
        greenOutline: Phaser.GameObjects.Graphics, greenCenterX: number, greenCenterY: number, greenRadius: number, greenSegments: CircleSegment[],
        pinkOutline: Phaser.GameObjects.Graphics, pinkCenterX: number, pinkCenterY: number, pinkRadius: number, pinkSegments: CircleSegment[],
        blueOutline: Phaser.GameObjects.Graphics, blueCenterX: number, blueCenterY: number, blueRadius: number, blueSegments: CircleSegment[]
    ) {
        const { drawDuration, outerCircleDuration, thinningDuration, eraseDuration } = this.config;
        
        this.scene.time.delayedCall(drawDuration * 1000, () => {
            // Create tween effect to zoom from 0 to full radius
            this.scene.tweens.add({
                targets: { progress: 0 },
                progress: 1,
                duration: outerCircleDuration * 1000,
                ease: 'Sine.easeOut',
                onUpdate: (tween) => {
                    const progress = tween.getValue();
                    const currentRadius = customOuterRadius * progress;
                    
                    // Clear and redraw outer circle with current radius
                    outerCircleGraphics.clear();
                    outerCircleGraphics.lineStyle(3, 0xffffff, 0.5);
                    outerCircleGraphics.beginPath();
                    outerCircleGraphics.arc(outerCenterX, outerCenterY, currentRadius, 0, 2 * Math.PI);
                    outerCircleGraphics.strokePath();
                },
                onComplete: () => {

                }
            });
        });

        // Start thinning and erasing effects after outer circle is fully drawn
        this.scene.time.delayedCall(drawDuration * 1000, () => {
            this._applyThinningAndErasingEffects(
                outerCircleGraphics, outerCenterX, outerCenterY, customOuterRadius,
                greenOutline, greenCenterX, greenCenterY, greenRadius, greenSegments,
                pinkOutline, pinkCenterX, pinkCenterY, pinkRadius, pinkSegments,
                blueOutline, blueCenterX, blueCenterY, blueRadius, blueSegments
            );
        });
    }
    
    /**
     * Apply thinning and erasing effects
     */
    private _applyThinningAndErasingEffects(
        outerCircleGraphics: Phaser.GameObjects.Graphics, outerCenterX: number, outerCenterY: number, customOuterRadius: number,
        greenOutline: Phaser.GameObjects.Graphics, greenCenterX: number, greenCenterY: number, greenRadius: number, greenSegments: CircleSegment[],
        pinkOutline: Phaser.GameObjects.Graphics, pinkCenterX: number, pinkCenterY: number, pinkRadius: number, pinkSegments: CircleSegment[],
        blueOutline: Phaser.GameObjects.Graphics, blueCenterX: number, blueCenterY: number, blueRadius: number, blueSegments: CircleSegment[]
    ): void {
        const { thinningDuration, eraseDuration, outerCircleEraseDuration } = this.config;
        
        // Thinning green circle
        this.animator.animateCircleThinning(
            greenOutline,
            greenCenterX, greenCenterY,
            greenRadius, greenSegments,
            thinningDuration,
            () => {
                // After thinning is done, erase
                this.animator.animateCircleErasing(
                    greenOutline,
                    greenCenterX, greenCenterY,
                    greenRadius, greenSegments,
                    eraseDuration
                );
                
                // Fade out outer circle while erasing circles
                this.animator.fadeOutCircle(
                    outerCircleGraphics,
                    outerCenterX, outerCenterY,
                    customOuterRadius,
                    outerCircleEraseDuration
                );
            }
        );
        
        // Thinning pink circle
        this.animator.animateCircleThinning(
            pinkOutline,
            pinkCenterX, pinkCenterY,
            pinkRadius, pinkSegments,
            thinningDuration,
            () => {
                // After thinning is done, erase
                this.animator.animateCircleErasing(
                    pinkOutline,
                    pinkCenterX, pinkCenterY,
                    pinkRadius, pinkSegments,
                    eraseDuration
                );
            }
        );
        
        // Thinning blue circle
        this.animator.animateCircleThinning(
            blueOutline,
            blueCenterX, blueCenterY,
            blueRadius, blueSegments,
            thinningDuration,
            () => {
                // After thinning is done, erase
                this.animator.animateCircleErasing(
                    blueOutline,
                    blueCenterX, blueCenterY,
                    blueRadius, blueSegments,
                    eraseDuration
                );
            }
        );
    }
} 