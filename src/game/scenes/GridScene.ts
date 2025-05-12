import { Scene, GameObjects } from 'phaser';

export class GridScene extends Scene {
    private gridItems: GameObjects.Container[] = [];
    private selectedItems: Set<number> = new Set();
    private nextItemIndex: number = 0;
    private readonly GRID_COLS: number = 10;
    private readonly ITEM_SIZE: number = 80;
    private readonly ITEM_SPACING: number = 20;
    private readonly MAX_ITEMS: number = 100;
    private GRID_START_X: number = 0;
    private GRID_START_Y: number = 0;
    
    // UI Elements to update position when screen size changes
    private titleText: GameObjects.Text;
    private instructionText: GameObjects.Text;
    private buttonContainers: GameObjects.Container[] = [];

    constructor() {
        super('GridScene');
    }

    /**
     * Calculate grid position based on screen size
     */
    private _calculateGridPosition(width: number, height: number): void {
        // Calculate GRID_START_X position to center the grid horizontally
        
        // Calculate total grid width more accurately:
        // - Number of columns * size of each item = total size of items
        // - (Number of columns - 1) * spacing between items = total spacing
        const itemsWidth = this.GRID_COLS * this.ITEM_SIZE;
        const spacingWidth = (this.GRID_COLS - 1) * this.ITEM_SPACING;
        const totalGridWidth = itemsWidth + spacingWidth;
        
        // Adjust to ensure grid is centered on screen
        // Use Math.round instead of Math.floor for more accurate rounding
        this.GRID_START_X = Math.round((width - totalGridWidth) / 2);
        
        // Ensure not negative
        if (this.GRID_START_X < 0) this.GRID_START_X = 0;

        // Calculate GRID_START_Y position to center grid vertically
        const maxRows = Math.ceil(this.MAX_ITEMS / this.GRID_COLS);
        
        // Calculate total grid height more accurately:
        const itemsHeight = maxRows * this.ITEM_SIZE;
        const spacingHeight = (maxRows - 1) * this.ITEM_SPACING;
        const totalGridHeight = itemsHeight + spacingHeight;
        
        const titleAndInstructionHeight = 230;
        const buttonsHeight = 200;
        const availableHeight = height - titleAndInstructionHeight - buttonsHeight;
        
        if (totalGridHeight < availableHeight) {
            this.GRID_START_Y = titleAndInstructionHeight + Math.round((availableHeight - totalGridHeight) / 2);
        } else {
            this.GRID_START_Y = titleAndInstructionHeight;
        }
        
        // Debug log to check grid position
        console.log(`Grid position: X=${this.GRID_START_X}, Y=${this.GRID_START_Y}, Width=${totalGridWidth}, Screen=${width}x${height}`);
    }

    protected create(): void {
        // Background
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background')
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Calculate grid position
        this._calculateGridPosition(this.cameras.main.width, this.cameras.main.height);
        
        // Draw grid boundaries for visualization
        this._drawGridBoundaries();

        // Title
        this.titleText = this.add.text(this.cameras.main.width / 2, 70, 'Interactive Grid Scene', {
            fontFamily: 'Arial Black', fontSize: 40, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        // Instruction
        this.instructionText = this.add.text(this.cameras.main.width / 2, 140, 'Click on items to select/deselect them', {
            fontFamily: 'Arial', fontSize: 24, color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Create buttons
        const buttonY = this.cameras.main.height - 150;
        this.buttonContainers = [
            this._createButton(this.cameras.main.width / 2 - 300, buttonY, 'Add', () => this._addItem()),
            this._createButton(this.cameras.main.width / 2, buttonY, 'Remove Selected', () => this._removeSelected()),
            this._createButton(this.cameras.main.width / 2 + 300, buttonY, 'Next Scene', () => this._goToNextScene())
        ];
        
        // Listen for resize events
        this.scale.on('resize', this._handleResize, this);
    }
    
    /**
     * Draw grid boundaries for easy position checking
     */
    private _drawGridBoundaries(): void {
        // Calculate total grid size
        const itemsWidth = this.GRID_COLS * this.ITEM_SIZE;
        const spacingWidth = (this.GRID_COLS - 1) * this.ITEM_SPACING;
        const totalGridWidth = itemsWidth + spacingWidth;
        
        const maxRows = Math.ceil(this.MAX_ITEMS / this.GRID_COLS);
        const itemsHeight = maxRows * this.ITEM_SIZE;
        const spacingHeight = (maxRows - 1) * this.ITEM_SPACING;
        const totalGridHeight = itemsHeight + spacingHeight;
        
        // Draw grid border
        const gridBounds = this.add.rectangle(
            this.GRID_START_X + totalGridWidth / 2, 
            this.GRID_START_Y + totalGridHeight / 2,
            totalGridWidth,
            totalGridHeight
        );
        
        gridBounds.setStrokeStyle(2, 0xff0000);
        gridBounds.setDepth(-1);
    }

    /**
     * Method to handle screen resize
     */
    private _handleResize(gameSize: Phaser.Structs.Size): void {
        // Update background
        if (this.children) {
            const bg = this.children.list.find(child => child.type === 'Image') as Phaser.GameObjects.Image;
            if (bg) {
                bg.setPosition(gameSize.width / 2, gameSize.height / 2)
                  .setDisplaySize(gameSize.width, gameSize.height);
            }
        }
        
        // Update title and instruction positions
        if (this.titleText) {
            this.titleText.setPosition(gameSize.width / 2, 70);
        }
        
        if (this.instructionText) {
            this.instructionText.setPosition(gameSize.width / 2, 140);
        }
        
        // Update button positions
        const buttonY = gameSize.height - 150;
        if (this.buttonContainers.length === 3) {
            this.buttonContainers[0].setPosition(gameSize.width / 2 - 300, buttonY);
            this.buttonContainers[1].setPosition(gameSize.width / 2, buttonY);
            this.buttonContainers[2].setPosition(gameSize.width / 2 + 300, buttonY);
        }
        
        // Recalculate grid position to always be centered
        this._calculateGridPosition(gameSize.width, gameSize.height);
        
        // Remove all old grid boundary objects
        this.children.list.forEach(child => {
            if (child.type === 'Rectangle') {
                const rect = child as Phaser.GameObjects.Rectangle;
                if (rect.strokeColor === 0xff0000) {
                    rect.destroy();
                }
            }
        });
        
        // Redraw grid boundaries
        this._drawGridBoundaries();
        
        // Update grid item positions immediately
        this._realignGrid(true);
    }

    private _createButton(x: number, y: number, text: string, callback: Function): GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Button background
        const bg = this.add.rectangle(0, 0, 200, 50, 0x4a4a4a, 1)
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

    private _addItem(): void {
        if (this.gridItems.length >= this.MAX_ITEMS) {
            return;
        }

        const col = this.gridItems.length % this.GRID_COLS;
        const row = Math.floor(this.gridItems.length / this.GRID_COLS);
        
        // Calculate exact position for new item
        const x = this.GRID_START_X + (col * this.ITEM_SIZE) + (col * this.ITEM_SPACING) + (this.ITEM_SIZE / 2);
        const y = this.GRID_START_Y + (row * this.ITEM_SIZE) + (row * this.ITEM_SPACING) + (this.ITEM_SIZE / 2);
        
        const container = this.add.container(x, y);
        const index = this.nextItemIndex++;
        
        // Item background
        const bg = this.add.rectangle(0, 0, this.ITEM_SIZE, this.ITEM_SIZE, 0x028af8, 1)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._toggleItemSelection(index));
        
        // Item text (index)
        const indexText = this.add.text(0, 0, index.toString(), {
            fontFamily: 'Arial', fontSize: 24, color: '#ffffff',
        }).setOrigin(0.5);
        
        container.add([bg, indexText]);
        container.setData('index', index);
        container.setData('background', bg);
        
        this.gridItems.push(container);
        
        // Debug - display position of item
        console.log(`Added item at position: x=${x}, y=${y}, col=${col}, row=${row}`);
    }

    private _toggleItemSelection(itemIndex: number): void {
        const container = this.gridItems.find(item => item.getData('index') === itemIndex);
        if (!container) return;
        
        const bg = container.getData('background') as GameObjects.Rectangle;
        
        if (this.selectedItems.has(itemIndex)) {
            this.selectedItems.delete(itemIndex);
            bg.fillColor = 0x028af8; // Default blue
        } else {
            this.selectedItems.add(itemIndex);
            bg.fillColor = 0xf85502; // Selected orange
        }
    }

    private _removeSelected(): void {
        if (this.selectedItems.size === 0) return;
        
        // Remove selected items from gridItems array
        this.gridItems = this.gridItems.filter(item => {
            const index = item.getData('index');
            if (this.selectedItems.has(index)) {
                item.destroy();
                return false;
            }
            return true;
        });
        
        // Clear selected items
        this.selectedItems.clear();
        
        // Realign remaining items
        this._realignGrid();
    }

    /**
     * Realign the grid
     * @param immediate If true, move immediately without animation
     */
    private _realignGrid(immediate: boolean = false): void {
        this.gridItems.forEach((container, i) => {
            const col = i % this.GRID_COLS;
            const row = Math.floor(i / this.GRID_COLS);
            
            // Calculate exact position for each item
            const x = this.GRID_START_X + (col * this.ITEM_SIZE) + (col * this.ITEM_SPACING) + (this.ITEM_SIZE / 2);
            const y = this.GRID_START_Y + (row * this.ITEM_SIZE) + (row * this.ITEM_SPACING) + (this.ITEM_SIZE / 2);
            
            if (immediate) {
                container.setPosition(x, y);
            } else {
                this.tweens.add({
                    targets: container,
                    x: x,
                    y: y,
                    duration: 300,
                    ease: 'Power2'
                });
            }
        });
    }

    private _goToNextScene(): void {
        this.scene.start('AnimationScene');
    }
} 