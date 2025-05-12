import { Scene, GameObjects } from 'phaser';

export class AnimationScene extends Scene {
    private titleText: GameObjects.Text;
    private backButton: GameObjects.Container;
    
    constructor() {
        super('AnimationScene');
    }

    preload() {
        // Tải plugin Rex Glow Filter để tạo hiệu ứng glow đẹp hơn
        this.load.plugin('rexglowfilter2pipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexglowfilter2pipelineplugin.min.js', true);
    }

    create() {
        // Background - đen hoàn toàn
        this.cameras.main.setBackgroundColor('#000000');

        // Title
        this.titleText = this.add.text(this.cameras.main.width / 2, 70, 'Alchemist Logo Animation', {
            fontFamily: 'Arial Black', fontSize: 40, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        // Back button
        this.backButton = this.createButton(this.cameras.main.width * 0.1, 70, 'Back', () => {
            this.scene.start('GridScene');
        });

        // Tạo hiệu ứng quỹ đạo
        this.createOrbitEffects();
        
        // Lắng nghe sự kiện thay đổi kích thước
        this.scale.on('resize', this.handleResize, this);
    }
    
    /**
     * Tạo hiệu ứng quỹ đạo giống hình ảnh
     */
    private createOrbitEffects() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const radius = 120; // Giảm bán kính để thấy rõ hơn hiệu ứng giao nhau
        
        // Vị trí tâm của 3 hình tròn - điều chỉnh để tất cả đều cắt qua tâm của nhau
        
        // Tạo tam giác với hai hình tròn ở trên và một hình tròn ở dưới
        // Hình xanh lá nằm trên bên trái, hình hồng nằm trên bên phải, hình xanh nước biển nằm dưới
        
        // Khoảng cách từ tâm chính
        const distanceLeftRight = radius;
        const distanceBottom = radius / 2;
        
        // Vị trí tâm của 3 hình tròn
        // Hình xanh lá nằm bên trái
        const greenCenterX = centerX - distanceLeftRight / 2;
        const greenCenterY = centerY - distanceBottom;
        
        // Hình hồng nằm bên phải
        const pinkCenterX = centerX + distanceLeftRight / 2;
        const pinkCenterY = centerY - distanceBottom;
        
        // Hình xanh dương nằm dưới
        const blueCenterX = centerX;
        const blueCenterY = centerY + distanceBottom - 15;
        
        // Tạo container cho mỗi đường tròn để áp dụng hiệu ứng glow
        const pinkContainer = this.add.container(0, 0);
        const blueContainer = this.add.container(0, 0);
        const greenContainer = this.add.container(0, 0);
        
        // Tạo đối tượng graphics cho các đường tròn
        const pinkOutline = this.add.graphics();
        const blueOutline = this.add.graphics();
        const greenOutline = this.add.graphics();
        
        // Thêm graphics vào container tương ứng
        pinkContainer.add(pinkOutline);
        blueContainer.add(blueOutline);
        greenContainer.add(greenOutline);
        
        // Vẽ chấm tròn màu trắng ở giữa
        const centerDot = this.add.graphics();
        centerDot.fillStyle(0xffffff, 1);
        centerDot.fillCircle(centerX, centerY, 3);
        
        // Thời gian hoàn thành hiệu ứng vẽ (giây)
        const animDuration = 2;
        
        // Tính toán vị trí điểm cuối của mỗi đường tròn
        const greenEndAngle = Phaser.Math.DegToRad(120);
        const pinkEndAngle = Phaser.Math.DegToRad(-120);
        const blueEndAngle = Phaser.Math.DegToRad(0);
        
        const greenEndX = greenCenterX + radius * Math.cos(greenEndAngle);
        const greenEndY = greenCenterY + radius * Math.sin(greenEndAngle);
        
        const pinkEndX = pinkCenterX + radius * Math.cos(pinkEndAngle);
        const pinkEndY = pinkCenterY + radius * Math.sin(pinkEndAngle);
        
        const blueEndX = blueCenterX + radius * Math.cos(blueEndAngle);
        const blueEndY = blueCenterY + radius * Math.sin(blueEndAngle);
        
        // Tạo container và graphics cho hình tròn bên ngoài
        const outerCircleContainer = this.add.container(0, 0);
        const outerCircleGraphics = this.add.graphics();
        outerCircleContainer.add(outerCircleGraphics);
        
        // Tính toán tâm và bán kính của đường tròn đi qua 3 điểm cuối
        const { centerX: outerCenterX, centerY: outerCenterY, radius: outerRadius } = 
            this.calculateCircleThroughThreePoints(greenEndX, greenEndY, pinkEndX, pinkEndY, blueEndX, blueEndY);
        
        // Bán kính tối đa cho hình tròn ngoài (có thể tùy chỉnh)
        const customOuterRadius = outerRadius * 1.1; // Có thể thay đổi hệ số này để tùy chỉnh bán kính
        
        // Hiển thị các điểm cuối để kiểm tra
        const endPointsGraphics = this.add.graphics();
        endPointsGraphics.fillStyle(0xffffff, 1);
        endPointsGraphics.fillCircle(greenEndX, greenEndY, 5);
        endPointsGraphics.fillCircle(pinkEndX, pinkEndY, 5);
        endPointsGraphics.fillCircle(blueEndX, blueEndY, 5);
        
        // Ẩn hình tròn ngoài ban đầu
        outerCircleGraphics.clear();
        
        // Tạo hiệu ứng vẽ từng phần cho đường tròn xanh lá
        this.animateCircleDrawing(
            greenOutline, greenContainer,
            greenCenterX, greenCenterY,
            radius, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(120),
            0x00ff00, animDuration
        );
        
        // Tạo hiệu ứng vẽ từng phần cho đường tròn màu hồng
        this.animateCircleDrawing(
            pinkOutline, pinkContainer,
            pinkCenterX, pinkCenterY,
            radius, Phaser.Math.DegToRad(60), Phaser.Math.DegToRad(-120),
            0xff00ff, animDuration,
        );
        
        // Tạo hiệu ứng vẽ từng phần cho đường tròn màu xanh dương
        this.animateCircleDrawing(
            blueOutline, blueContainer,
            blueCenterX, blueCenterY,
            radius, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(0),
            0x00ffff, animDuration,
        );
        
        // Tạo hiệu ứng phóng to cho hình tròn ngoài sau khi 3 đường tròn vẽ xong
        this.time.delayedCall(animDuration * 1000, () => {
            // Thời gian cho hiệu ứng scale
            const outerCircleAnimDuration = 1; // 1 giây
            
            // Tạo hiệu ứng tween để phóng to từ 0 đến bán kính đầy đủ
            this.tweens.add({
                targets: { progress: 0 },
                progress: 1,
                duration: outerCircleAnimDuration * 1000,
                ease: 'Sine.easeOut',
                onUpdate: (tween) => {
                    const progress = tween.getValue();
                    const currentRadius = customOuterRadius * progress;
                    
                    // Xóa và vẽ lại đường tròn ngoài với bán kính hiện tại
                    outerCircleGraphics.clear();
                    outerCircleGraphics.lineStyle(2, 0xffffff, 0.5);
                    outerCircleGraphics.beginPath();
                    outerCircleGraphics.arc(outerCenterX, outerCenterY, currentRadius, 0, 2 * Math.PI);
                    outerCircleGraphics.strokePath();
                },
                onComplete: () => {
                    // Áp dụng hiệu ứng glow cho hình tròn ngoài khi nó đã mở rộng hoàn toàn
                    this.applyGlowEffect(outerCircleContainer, 0xffffff);
                }
            });
        });
    }
    
    /**
     * Tính tâm và bán kính của đường tròn đi qua 3 điểm
     */
    private calculateCircleThroughThreePoints(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        // Sử dụng công thức từ hình học để tính
        const temp = x2 * x2 + y2 * y2;
        const bc = (x1 * x1 + y1 * y1 - temp) / 2;
        const cd = (temp - x3 * x3 - y3 * y3) / 2;
        const det = (x1 - x2) * (y2 - y3) - (x2 - x3) * (y1 - y2);
        
        if (Math.abs(det) < 1e-10) {
            console.error("Các điểm thẳng hàng, không thể tạo đường tròn!");
            // Trong trường hợp điểm thẳng hàng, trả về tâm là trung điểm của x1, y1 và x3, y3
            const centerX = (x1 + x3) / 2;
            const centerY = (y1 + y3) / 2;
            // Bán kính là khoảng cách từ tâm đến điểm xa nhất
            const radius = Math.max(
                Math.sqrt((x1 - centerX) * (x1 - centerX) + (y1 - centerY) * (y1 - centerY)),
                Math.sqrt((x3 - centerX) * (x3 - centerX) + (y3 - centerY) * (y3 - centerY))
            );
            return { centerX, centerY, radius };
        }
        
        const centerX = (bc * (y2 - y3) - cd * (y1 - y2)) / det;
        const centerY = ((x1 - x2) * cd - (x2 - x3) * bc) / det;
        const radius = Math.sqrt((centerX - x1) * (centerX - x1) + (centerY - y1) * (centerY - y1));
        
        return { centerX, centerY, radius };
    }
    
    /**
     * Áp dụng hiệu ứng glow cho một đối tượng
     */
    private applyGlowEffect(container: Phaser.GameObjects.Container, color: number) {
        try {
            // Kiểm tra xem plugin đã tải hay chưa
            if (this.plugins.get('rexglowfilter2pipelineplugin')) {
                (this.plugins.get('rexglowfilter2pipelineplugin') as any).add(container, {
                    outerStrength: 5,
                    innerStrength: 0,
                    glowColor: color,
                    knockout: false,
                    quality: 1,
                    padding: 0
                });
            }
        } catch (error) {
            console.error("Không thể áp dụng hiệu ứng glow:", error);
        }
    }
    
    /**
     * Tạo hiệu ứng vẽ đường tròn từ điểm bắt đầu đến điểm kết thúc với hiệu ứng glow
     */
    private animateCircleDrawing(
        outlineGraphics: Phaser.GameObjects.Graphics,
        container: Phaser.GameObjects.Container,
        centerX: number, centerY: number,
        radius: number, startAngle: number, endAngle: number,
        color: number, duration: number, 
        startDelay: number = 0
    ) {
        // Tính toán góc tổng
        let totalAngle = endAngle - startAngle;
        // Đảm bảo góc tổng đúng hướng
        if (startAngle > endAngle) {
            totalAngle = (endAngle + 2 * Math.PI) - startAngle;
        }
        
        // Áp dụng hiệu ứng glow cho container
        this.applyGlowEffect(container, color);
        
        // Thiết lập độ rộng đường viền tối thiểu và tối đa
        const minLineWidth = 3;
        const maxLineWidth = 10;
        
        // Kích thước của chấm tròn ở đầu nét vẽ
        const minDotSize = 5;
        const maxDotSize = 15;
        
        // Biến theo dõi các phần đã vẽ với độ rộng tương ứng
        const segments: {startAngle: number, endAngle: number, lineWidth: number}[] = [];
        const segmentStep = 0.05;
        let lastDrawnAngle = startAngle;
        
        // Tạo hiệu ứng tween để vẽ đường tròn từng phần
        this.tweens.add({
            targets: { progress: 0 },
            progress: 1,
            duration: duration * 1000, // Chuyển đổi từ giây sang mili giây
            delay: startDelay * 1000, // Chuyển đổi từ giây sang mili giây
            ease: 'Linear',
            onUpdate: (tween) => {
                // Lấy giá trị tiến độ hiện tại (0-1)
                const progress = tween.getValue();
                
                // Tính toán góc hiện tại dựa trên tiến độ
                const currentEndAngle = startAngle + totalAngle * progress;
                
                // Tính toán độ rộng nét vẽ dựa trên tiến độ (tăng dần theo tiến trình)
                const currentLineWidth = minLineWidth + (maxLineWidth - minLineWidth) * progress;
                
                // Xóa đồ họa hiện tại để vẽ lại
                outlineGraphics.clear();
                
                // Thêm đoạn mới vào danh sách nếu đủ dài
                if (currentEndAngle - lastDrawnAngle >= segmentStep) {
                    segments.push({
                        startAngle: lastDrawnAngle,
                        endAngle: currentEndAngle,
                        lineWidth: currentLineWidth
                    });
                    lastDrawnAngle = currentEndAngle;
                }
                
                // Vẽ tất cả các đoạn đã hoàn thành với độ rộng tương ứng
                for (const segment of segments) {
                    // Vẽ đường viền chính màu trắng với độ rộng tương ứng
                    outlineGraphics.lineStyle(segment.lineWidth, 0xffffff, 1);
                    outlineGraphics.beginPath();
                    outlineGraphics.arc(centerX, centerY, radius, segment.startAngle, segment.endAngle, false);
                    outlineGraphics.strokePath();
                }
                
                // Vẽ chấm tròn ở vị trí hiện tại của nét vẽ
                const currentX = centerX + radius * Math.cos(currentEndAngle);
                const currentY = centerY + radius * Math.sin(currentEndAngle);
                
                // Tính toán kích thước dot theo tiến trình
                const currentDotSize = minDotSize + (maxDotSize - minDotSize) * progress;
                
                outlineGraphics.fillStyle(0xffffff, 1);
                outlineGraphics.fillCircle(currentX, currentY, currentDotSize / 2);
            },
            onComplete: () => {

            }
        });
    }
    
    private createButton(x: number, y: number, text: string, callback: Function): GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Button background
        const bg = this.add.rectangle(0, 0, 120, 50, 0x4a4a4a, 1)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => callback())
            .on('pointerover', () => bg.fillColor = 0x666666)
            .on('pointerout', () => bg.fillColor = 0x4a4a4a);
        
        // Button text
        const buttonText = this.add.text(0, 0, text, {
            fontFamily: 'Arial', fontSize: 20, color: '#ffffff',
        }).setOrigin(0.5);
        
        container.add([bg, buttonText]);
        return container;
    }
    
    /**
     * Phương thức xử lý khi màn hình thay đổi kích thước
     */
    handleResize(gameSize: Phaser.Structs.Size) {
        // Cập nhật vị trí title
        if (this.titleText) {
            this.titleText.setPosition(gameSize.width / 2, 70);
        }
        
        // Cập nhật vị trí nút Back
        if (this.backButton) {
            this.backButton.setPosition(gameSize.width * 0.1, 70);
        }
    }
} 