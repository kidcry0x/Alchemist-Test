import { Scene } from 'phaser';
import { CirclePositionHelper } from './effects/CirclePositionHelper';
import { CircleDrawingAnimator, CircleSegment } from './effects/CircleDrawingAnimator';

export interface AlchemistLogoConfig {
    drawDuration?: number;
    outerCircleDuration?: number;
    thinningDuration?: number;
    eraseDuration?: number;
}

export class AlchemistLogo {
    private scene: Scene;
    private animator: CircleDrawingAnimator;
    private config: Required<AlchemistLogoConfig>;
    
    // Màu sắc của các đường tròn
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
            eraseDuration: config?.eraseDuration ?? 2
        };
    }
    
    /**
     * Bắt đầu hiệu ứng logo Alchemist
     */
    public play(): void {
        // Thiết lập và tính toán tọa độ
        const { 
            centerX, centerY, radius,
            greenCenterX, greenCenterY,
            pinkCenterX, pinkCenterY,
            blueCenterX, blueCenterY 
        } = CirclePositionHelper.calculateCirclePositions(
            this.scene.cameras.main.width, 
            this.scene.cameras.main.height
        );
        
        // Tạo các graphics và containers
        const { 
            greenOutline, greenContainer,
            pinkOutline, pinkContainer, 
            blueOutline, blueContainer,
            outerCircleGraphics, outerCircleContainer
        } = this.createGraphicsAndContainers();
        
        // Tính toán các góc và điểm kết thúc
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
        
        // Tính toán tâm và bán kính của đường tròn đi qua 3 điểm cuối
        const { centerX: outerCenterX, centerY: outerCenterY, radius: outerRadius } = 
            CirclePositionHelper.calculateCircleThroughThreePoints(
                greenEndX, greenEndY, 
                pinkEndX, pinkEndY, 
                blueEndX, blueEndY
            );
        
        // Bán kính tối đa cho hình tròn ngoài
        const customOuterRadius = outerRadius * 1.1;
        
        // Ẩn hình tròn ngoài ban đầu
        outerCircleGraphics.clear();
        
        // Lưu trữ các segments của mỗi đường tròn để sau này có thể xóa ngược lại
        const greenSegments: CircleSegment[] = [];
        const pinkSegments: CircleSegment[] = [];
        const blueSegments: CircleSegment[] = [];
        
        // Tạo các hiệu ứng vẽ đường tròn
        this.createDrawingEffects(
            greenOutline, greenContainer, greenCenterX, greenCenterY, radius, 
            Phaser.Math.DegToRad(-60), greenEndAngle, this.GREEN_COLOR, greenSegments,
            pinkOutline, pinkContainer, pinkCenterX, pinkCenterY, radius,
            Phaser.Math.DegToRad(60), pinkEndAngle, this.PINK_COLOR, pinkSegments,
            blueOutline, blueContainer, blueCenterX, blueCenterY, radius,
            Phaser.Math.DegToRad(180), blueEndAngle, this.BLUE_COLOR, blueSegments
        );
        
        // Tạo hiệu ứng phóng to cho hình tròn ngoài sau khi 3 đường tròn vẽ xong
        this.createOuterCircleEffect(
            outerCircleGraphics, outerCircleContainer, 
            outerCenterX, outerCenterY, customOuterRadius,
            greenOutline, greenCenterX, greenCenterY, radius, greenSegments,
            pinkOutline, pinkCenterX, pinkCenterY, radius, pinkSegments,
            blueOutline, blueCenterX, blueCenterY, radius, blueSegments
        );
    }
    
    /**
     * Tạo các đối tượng đồ họa và containers
     */
    private createGraphicsAndContainers() {
        // Tạo container cho mỗi đường tròn để áp dụng hiệu ứng glow
        const pinkContainer = this.scene.add.container(0, 0);
        const blueContainer = this.scene.add.container(0, 0);
        const greenContainer = this.scene.add.container(0, 0);
        
        // Tạo đối tượng graphics cho các đường tròn
        const pinkOutline = this.scene.add.graphics();
        const blueOutline = this.scene.add.graphics();
        const greenOutline = this.scene.add.graphics();
        
        // Thêm graphics vào container tương ứng
        pinkContainer.add(pinkOutline);
        blueContainer.add(blueOutline);
        greenContainer.add(greenOutline);
        
        // Tạo đối tượng chấm tròn ở giữa
        const centerDot = this.scene.add.graphics();
        centerDot.fillStyle(0xffffff, 1);
        centerDot.fillCircle(
            this.scene.cameras.main.width / 2, 
            this.scene.cameras.main.height / 2 - 20, 
            3
        );
        
        // Tạo container và graphics cho hình tròn bên ngoài
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
     * Tạo các hiệu ứng vẽ đường tròn
     */
    private createDrawingEffects(
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
        
        // Tạo hiệu ứng vẽ từng phần cho đường tròn xanh lá
        this.animator.animateCircleDrawing(
            greenOutline, greenContainer,
            greenCenterX, greenCenterY,
            radius, greenStartAngle, greenEndAngle,
            greenColor, drawDuration,
            0, // Không delay
            greenSegments // Lưu lại các segments
        );
        
        // Tạo hiệu ứng vẽ từng phần cho đường tròn màu hồng
        this.animator.animateCircleDrawing(
            pinkOutline, pinkContainer,
            pinkCenterX, pinkCenterY,
            pinkRadius, pinkStartAngle, pinkEndAngle,
            pinkColor, drawDuration,
            0, // Không delay
            pinkSegments // Lưu lại các segments
        );
        
        // Tạo hiệu ứng vẽ từng phần cho đường tròn màu xanh dương
        this.animator.animateCircleDrawing(
            blueOutline, blueContainer,
            blueCenterX, blueCenterY,
            blueRadius, blueStartAngle, blueEndAngle,
            blueColor, drawDuration,
            0, // Không delay
            blueSegments // Lưu lại các segments
        );
    }
    
    /**
     * Tạo hiệu ứng cho vòng tròn bên ngoài và các hiệu ứng mỏng dần và xóa
     */
    private createOuterCircleEffect(
        outerCircleGraphics: Phaser.GameObjects.Graphics, outerCircleContainer: Phaser.GameObjects.Container,
        outerCenterX: number, outerCenterY: number, customOuterRadius: number,
        greenOutline: Phaser.GameObjects.Graphics, greenCenterX: number, greenCenterY: number, greenRadius: number, greenSegments: CircleSegment[],
        pinkOutline: Phaser.GameObjects.Graphics, pinkCenterX: number, pinkCenterY: number, pinkRadius: number, pinkSegments: CircleSegment[],
        blueOutline: Phaser.GameObjects.Graphics, blueCenterX: number, blueCenterY: number, blueRadius: number, blueSegments: CircleSegment[]
    ) {
        const { drawDuration, outerCircleDuration, thinningDuration, eraseDuration } = this.config;
        
        this.scene.time.delayedCall(drawDuration * 1000, () => {
            // Tạo hiệu ứng tween để phóng to từ 0 đến bán kính đầy đủ
            this.scene.tweens.add({
                targets: { progress: 0 },
                progress: 1,
                duration: outerCircleDuration * 1000,
                ease: 'Sine.easeOut',
                onUpdate: (tween) => {
                    const progress = tween.getValue();
                    const currentRadius = customOuterRadius * progress;
                    
                    // Xóa và vẽ lại đường tròn ngoài với bán kính hiện tại
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

        // Bắt đầu hiệu ứng làm mỏng các đường tròn sau khi hình tròn ngoài hiện ra hoàn toàn
        this.scene.time.delayedCall(drawDuration * 1000, () => {
            this.applyThinningAndErasingEffects(
                outerCircleGraphics, outerCenterX, outerCenterY, customOuterRadius,
                greenOutline, greenCenterX, greenCenterY, greenRadius, greenSegments,
                pinkOutline, pinkCenterX, pinkCenterY, pinkRadius, pinkSegments,
                blueOutline, blueCenterX, blueCenterY, blueRadius, blueSegments
            );
        });
    }
    
    /**
     * Áp dụng hiệu ứng làm mỏng và xóa dần các đường tròn
     */
    private applyThinningAndErasingEffects(
        outerCircleGraphics: Phaser.GameObjects.Graphics, outerCenterX: number, outerCenterY: number, customOuterRadius: number,
        greenOutline: Phaser.GameObjects.Graphics, greenCenterX: number, greenCenterY: number, greenRadius: number, greenSegments: CircleSegment[],
        pinkOutline: Phaser.GameObjects.Graphics, pinkCenterX: number, pinkCenterY: number, pinkRadius: number, pinkSegments: CircleSegment[],
        blueOutline: Phaser.GameObjects.Graphics, blueCenterX: number, blueCenterY: number, blueRadius: number, blueSegments: CircleSegment[]
    ) {
        const { thinningDuration, eraseDuration } = this.config;
        
        // Làm mỏng đường tròn xanh lá
        this.animator.animateCircleThinning(
            greenOutline,
            greenCenterX, greenCenterY,
            greenRadius, greenSegments,
            thinningDuration,
            () => {
                // Sau khi làm mỏng xong thì xóa
                this.animator.animateCircleErasing(
                    greenOutline,
                    greenCenterX, greenCenterY,
                    greenRadius, greenSegments,
                    eraseDuration
                );
                
                // Làm mờ dần vòng tròn bên ngoài cùng lúc xóa các vòng tròn con
                this.animator.fadeOutCircle(
                    outerCircleGraphics,
                    outerCenterX, outerCenterY,
                    customOuterRadius,
                    eraseDuration
                );
            }
        );
        
        // Làm mỏng đường tròn màu hồng
        this.animator.animateCircleThinning(
            pinkOutline,
            pinkCenterX, pinkCenterY,
            pinkRadius, pinkSegments,
            thinningDuration,
            () => {
                // Sau khi làm mỏng xong thì xóa
                this.animator.animateCircleErasing(
                    pinkOutline,
                    pinkCenterX, pinkCenterY,
                    pinkRadius, pinkSegments,
                    eraseDuration
                );
            }
        );
        
        // Làm mỏng đường tròn màu xanh dương
        this.animator.animateCircleThinning(
            blueOutline,
            blueCenterX, blueCenterY,
            blueRadius, blueSegments,
            thinningDuration,
            () => {
                // Sau khi làm mỏng xong thì xóa
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