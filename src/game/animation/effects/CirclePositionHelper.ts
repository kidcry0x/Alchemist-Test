export class CirclePositionHelper {
    /**
     * Calculate positions of the three circles
     */
    public static calculateCirclePositions(screenWidth: number, screenHeight: number): {
        centerX: number;
        centerY: number;
        radius: number;
        greenCenterX: number;
        greenCenterY: number;
        pinkCenterX: number;
        pinkCenterY: number;
        blueCenterX: number;
        blueCenterY: number;
    } {
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        const radius = 120; // Reduced radius for better overlap effect
        
        // Distances from main center
        const distanceLeftRight = radius;
        const distanceBottom = radius / 2;
        
        // Green circle on the left
        const greenCenterX = centerX - distanceLeftRight / 2;
        const greenCenterY = centerY - distanceBottom;
        
        // Pink circle on the right
        const pinkCenterX = centerX + distanceLeftRight / 2;
        const pinkCenterY = centerY - distanceBottom;
        
        // Blue circle at the bottom
        const blueCenterX = centerX;
        const blueCenterY = centerY + distanceBottom - 20;
        
        return {
            centerX, centerY, radius,
            greenCenterX, greenCenterY,
            pinkCenterX, pinkCenterY,
            blueCenterX, blueCenterY
        };
    }
    
    /**
     * Calculate end points and angles for the circles
     */
    public static calculateEndPoints(
        greenCenterX: number, greenCenterY: number,
        pinkCenterX: number, pinkCenterY: number,
        blueCenterX: number, blueCenterY: number,
        radius: number
    ): {
        greenEndX: number;
        greenEndY: number;
        greenEndAngle: number;
        pinkEndX: number;
        pinkEndY: number;
        pinkEndAngle: number;
        blueEndX: number;
        blueEndY: number;
        blueEndAngle: number;
    } {
        const greenEndAngle = Phaser.Math.DegToRad(120);
        const pinkEndAngle = Phaser.Math.DegToRad(-120);
        const blueEndAngle = Phaser.Math.DegToRad(0);
        
        const greenEndX = greenCenterX + radius * Math.cos(greenEndAngle);
        const greenEndY = greenCenterY + radius * Math.sin(greenEndAngle);
        
        const pinkEndX = pinkCenterX + radius * Math.cos(pinkEndAngle);
        const pinkEndY = pinkCenterY + radius * Math.sin(pinkEndAngle);
        
        const blueEndX = blueCenterX + radius * Math.cos(blueEndAngle);
        const blueEndY = blueCenterY + radius * Math.sin(blueEndAngle);
        
        return {
            greenEndX, greenEndY, greenEndAngle,
            pinkEndX, pinkEndY, pinkEndAngle,
            blueEndX, blueEndY, blueEndAngle
        };
    }
    
    /**
     * Calculate center and radius of a circle passing through three points
     */
    public static calculateCircleThroughThreePoints(
        x1: number, y1: number, 
        x2: number, y2: number, 
        x3: number, y3: number
    ): {
        centerX: number;
        centerY: number;
        radius: number;
    } {
        // Use geometric formula for calculation
        const temp = x2 * x2 + y2 * y2;
        const bc = (x1 * x1 + y1 * y1 - temp) / 2;
        const cd = (temp - x3 * x3 - y3 * y3) / 2;
        const det = (x1 - x2) * (y2 - y3) - (x2 - x3) * (y1 - y2);
        
        if (Math.abs(det) < 1e-10) {
            console.error("Points are collinear, cannot create circle!");
            // For collinear points, use midpoint of first and last point
            const centerX = (x1 + x3) / 2;
            const centerY = (y1 + y3) / 2;
            // Radius is distance to furthest point
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
} 