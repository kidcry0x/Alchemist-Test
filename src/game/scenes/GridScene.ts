import { Scene, GameObjects, Types } from 'phaser';

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
    
    // Scroll view elements
    private gridMask: Phaser.Display.Masks.GeometryMask;
    private gridContainer: Phaser.GameObjects.Container;
    private dragStartY: number = 0;
    private isDragging: boolean = false;
    private gridContentBounds: {width: number, height: number} = {width: 0, height: 0};
    private scrollAreaHeight: number = 0;
    
    // Scrollbar elements
    private scrollbar: Phaser.GameObjects.Rectangle;
    private scrollThumb: Phaser.GameObjects.Rectangle;
    private isScrollbarDragging: boolean = false;
    private readonly SCROLLBAR_WIDTH: number = 12;
    private readonly SCROLLBAR_PADDING: number = 4;

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
        
        // Store the grid content bounds for scrolling calculations
        this.gridContentBounds.width = totalGridWidth;
        this.gridContentBounds.height = totalGridHeight;
        
        // Store the scroll area height
        this.scrollAreaHeight = availableHeight;
        
        if (totalGridHeight < availableHeight) {
            this.GRID_START_Y = titleAndInstructionHeight + Math.round((availableHeight - totalGridHeight) / 2);
        } else {
            this.GRID_START_Y = titleAndInstructionHeight;
        }
        
        // Debug log to check grid position
        console.log(`Grid position: X=${this.GRID_START_X}, Y=${this.GRID_START_Y}, Width=${totalGridWidth}, Screen=${width}x${height}`);
    }

    /**
     * Reset all scene data
     */
    private _resetScene(): void {
        // Clear existing grid items
        this.gridItems.forEach(item => item.destroy());
        this.gridItems = [];
        
        // Clear selected items
        this.selectedItems.clear();
        
        // Reset item index
        this.nextItemIndex = 0;
    }

    protected create(): void {
        // Background
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background')
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Calculate grid position
        this._calculateGridPosition(this.cameras.main.width, this.cameras.main.height);
        
        // Create grid container and mask
        this._createGridContainerAndMask();

        // Title
        this.titleText = this.add.text(this.cameras.main.width / 2, 70, 'Interactive Grid Scene + Mask + Scroll View', {
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
        
        // Setup input events for scrolling
        this._setupScrollEvents();
    }
    
    /**
     * Create grid container and mask for scrollable area
     */
    private _createGridContainerAndMask(): void {
        // Calculate total grid size
        const itemsWidth = this.GRID_COLS * this.ITEM_SIZE;
        const spacingWidth = (this.GRID_COLS - 1) * this.ITEM_SPACING;
        const totalGridWidth = itemsWidth + spacingWidth;
        
        const maxRows = Math.ceil(this.MAX_ITEMS / this.GRID_COLS);
        const itemsHeight = maxRows * this.ITEM_SIZE;
        const spacingHeight = (maxRows - 1) * this.ITEM_SPACING;
        const totalGridHeight = itemsHeight + spacingHeight;
        
        // Create a container for all grid items
        this.gridContainer = this.add.container(0, 0);
        
        // Create a mask graphics object
        const maskGraphics = this.make.graphics({});
        
        // Calculate mask bounds
        const titleAndInstructionHeight = 230;
        const buttonsHeight = 200;
        const availableHeight = this.cameras.main.height - titleAndInstructionHeight - buttonsHeight;
        
        // Draw mask rect
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(
            this.GRID_START_X,
            this.GRID_START_Y,
            totalGridWidth,
            availableHeight
        );
        
        // Create mask from graphics
        this.gridMask = maskGraphics.createGeometryMask();
        
        // Apply mask to container
        this.gridContainer.setMask(this.gridMask);
        
        // Create scrollbar
        this._createScrollbar(totalGridWidth, availableHeight);
        
        // Draw grid boundaries
        this._drawGridBoundaries();
    }
    
    /**
     * Create scrollbar
     */
    private _createScrollbar(containerWidth: number, availableHeight: number): void {
        // Only create scrollbar if content is taller than visible area
        if (this.gridContentBounds.height <= this.scrollAreaHeight) {
            return;
        }
        
        // Scrollbar background
        this.scrollbar = this.add.rectangle(
            this.GRID_START_X + containerWidth + this.SCROLLBAR_PADDING + (this.SCROLLBAR_WIDTH / 2),
            this.GRID_START_Y + availableHeight / 2,
            this.SCROLLBAR_WIDTH,
            availableHeight
        );
        this.scrollbar.setFillStyle(0x333333, 0.6);
        this.scrollbar.setStrokeStyle(0, 0x000000);
        
        // Calculate thumb height - proportional to visible content
        const thumbHeightRatio = this.scrollAreaHeight / this.gridContentBounds.height;
        const thumbHeight = Math.max(30, availableHeight * thumbHeightRatio); // Minimum thumb height
        
        // Scrollbar thumb
        this.scrollThumb = this.add.rectangle(
            this.GRID_START_X + containerWidth + this.SCROLLBAR_PADDING + (this.SCROLLBAR_WIDTH / 2),
            this.GRID_START_Y, // Will be updated in updateScrollThumbPosition
            this.SCROLLBAR_WIDTH,
            thumbHeight
        );
        this.scrollThumb.setFillStyle(0xaaaaaa, 1);
        this.scrollThumb.setStrokeStyle(0, 0x000000);
        this.scrollThumb.setInteractive({ useHandCursor: true })
            .on('pointerdown', this._onScrollThumbDown, this)
            .on('pointerover', () => this.scrollThumb.setFillStyle(0xcccccc, 1))
            .on('pointerout', () => this.scrollThumb.setFillStyle(0xaaaaaa, 1));
        
        // Scrollbar background events
        this.scrollbar.setInteractive({ useHandCursor: true })
            .on('pointerdown', this._onScrollbarBackgroundDown, this);
        
        // Update thumb position
        this._updateScrollThumbPosition();
    }
    
    /**
     * Handle scroll thumb drag start
     */
    private _onScrollThumbDown(pointer: Phaser.Input.Pointer): void {
        this.isScrollbarDragging = true;
        this.dragStartY = pointer.y;
    }
    
    /**
     * Handle scrollbar background click
     */
    private _onScrollbarBackgroundDown(pointer: Phaser.Input.Pointer): void {
        // Get the position of the click relative to the scrollbar
        const relativePosition = (pointer.y - this.GRID_START_Y) / this.scrollAreaHeight;
        
        // Set container position proportionally
        const targetPosition = -relativePosition * (this.gridContentBounds.height - this.scrollAreaHeight);
        this.gridContainer.y = targetPosition;
        
        // Update thumb position
        this._updateScrollThumbPosition();
    }
    
    /**
     * Update scroll thumb position based on container position
     */
    private _updateScrollThumbPosition(): void {
        if (!this.scrollThumb || !this.gridContainer) return;
        
        // Calculate relative scroll position (0 to 1)
        const scrollRatio = this.gridContentBounds.height <= this.scrollAreaHeight 
            ? 0 
            : -this.gridContainer.y / (this.gridContentBounds.height - this.scrollAreaHeight);
        
        // Calculate available area for thumb to move
        const availableHeight = this.scrollAreaHeight - this.scrollThumb.height;
        
        // Update thumb position
        const newY = this.GRID_START_Y + (scrollRatio * availableHeight) + (this.scrollThumb.height / 2);
        this.scrollThumb.y = newY;
    }

    /**
     * Setup input events for scrolling
     */
    private _setupScrollEvents(): void {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this._isPointerInScrollArea(pointer)) {
                this.isDragging = true;
                this.dragStartY = pointer.y;
            }
        });
        
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // Handle scrollbar thumb dragging
            if (this.isScrollbarDragging && this.scrollThumb) {
                const deltaY = pointer.y - this.dragStartY;
                this.dragStartY = pointer.y;
                
                // Calculate available area for thumb to move
                const availableHeight = this.scrollAreaHeight - this.scrollThumb.height;
                
                // Update thumb position with constraints
                const newY = Phaser.Math.Clamp(
                    this.scrollThumb.y + deltaY,
                    this.GRID_START_Y + this.scrollThumb.height / 2,
                    this.GRID_START_Y + availableHeight + this.scrollThumb.height / 2
                );
                this.scrollThumb.y = newY;
                
                // Calculate relative position (0 to 1)
                const relativePosition = (this.scrollThumb.y - this.GRID_START_Y - this.scrollThumb.height / 2) / availableHeight;
                
                // Update container position based on thumb
                if (this.gridContentBounds.height > this.scrollAreaHeight) {
                    const newContainerY = -relativePosition * (this.gridContentBounds.height - this.scrollAreaHeight);
                    this.gridContainer.y = newContainerY;
                }
                
                return;
            }
            
            // Handle grid content dragging
            if (this.isDragging) {
                const deltaY = pointer.y - this.dragStartY;
                this.dragStartY = pointer.y;
                
                if (this.gridContentBounds.height > this.scrollAreaHeight) {
                    const currentY = this.gridContainer.y;
                    let newY = currentY + deltaY;
                    
                    // Calculate the lower and upper bounds for scrolling
                    const lowerBound = this.scrollAreaHeight - this.gridContentBounds.height;
                    const upperBound = 0;
                    
                    // Clamp within bounds
                    newY = Phaser.Math.Clamp(newY, lowerBound, upperBound);
                    
                    this.gridContainer.y = newY;
                    
                    // Update scroll thumb position
                    this._updateScrollThumbPosition();
                }
            }
        });
        
        this.input.on('pointerup', () => {
            this.isDragging = false;
            this.isScrollbarDragging = false;
        });
        
        // Add mouse wheel support
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
            if (this._isPointerInScrollArea(pointer) && this.gridContentBounds.height > this.scrollAreaHeight) {
                const scrollFactor = 15; // Adjust for scroll sensitivity
                const currentY = this.gridContainer.y;
                let newY = currentY - (deltaY * scrollFactor);
                
                // Calculate the lower and upper bounds for scrolling
                const lowerBound = this.scrollAreaHeight - this.gridContentBounds.height;
                const upperBound = 0;
                
                // Clamp within bounds
                newY = Phaser.Math.Clamp(newY, lowerBound, upperBound);
                
                this.gridContainer.y = newY;
                
                // Update scroll thumb position
                this._updateScrollThumbPosition();
            }
        });
    }
    
    /**
     * Check if pointer is in scroll area
     */
    private _isPointerInScrollArea(pointer: Phaser.Input.Pointer): boolean {
        return (
            pointer.x >= this.GRID_START_X && 
            pointer.x <= this.GRID_START_X + this.gridContentBounds.width &&
            pointer.y >= this.GRID_START_Y && 
            pointer.y <= this.GRID_START_Y + this.scrollAreaHeight
        );
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
        
        gridBounds.setStrokeStyle(0, 0xff0000);
        gridBounds.setDepth(-1);
        
        // Add gridBounds to container
        this.gridContainer.add(gridBounds);
        
        // Không hiển thị viền của scroll view (mask boundary)
        const titleAndInstructionHeight = 230;
        const buttonsHeight = 200;
        const availableHeight = this.cameras.main.height - titleAndInstructionHeight - buttonsHeight;
        
        const maskBounds = this.add.rectangle(
            this.GRID_START_X + totalGridWidth / 2,
            this.GRID_START_Y + availableHeight / 2,
            totalGridWidth,
            availableHeight
        );
        
        maskBounds.setStrokeStyle(2, 0x00ff00);
        maskBounds.setDepth(-1);
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
        
        // Update grid container and mask
        this._updateGridContainerAndMask();
        
        // Update grid item positions immediately
        this._realignGrid(true);
    }
    
    /**
     * Update grid container and mask when resizing
     */
    private _updateGridContainerAndMask(): void {
        // Destroy old mask
        if (this.gridMask) {
            this.gridMask.destroy();
        }
        
        // Destroy old scrollbar elements
        if (this.scrollbar) {
            this.scrollbar.destroy();
        }
        
        if (this.scrollThumb) {
            this.scrollThumb.destroy();
        }
        
        // Clear old boundary visuals from container
        if (this.gridContainer) {
            this.gridContainer.each((child: Phaser.GameObjects.GameObject) => {
                if (child.type === 'Rectangle') {
                    child.destroy();
                }
            });
        }
        
        // Create new mask
        const maskGraphics = this.make.graphics({});
        
        // Calculate mask bounds
        const titleAndInstructionHeight = 230;
        const buttonsHeight = 200;
        const availableHeight = this.cameras.main.height - titleAndInstructionHeight - buttonsHeight;
        
        // Draw mask rect
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(
            this.GRID_START_X,
            this.GRID_START_Y,
            this.gridContentBounds.width,
            availableHeight
        );
        
        // Create mask from graphics
        this.gridMask = maskGraphics.createGeometryMask();
        
        // Apply mask to container
        this.gridContainer.setMask(this.gridMask);
        
        // Reset grid container position if needed
        if (this.gridContentBounds.height <= this.scrollAreaHeight) {
            this.gridContainer.y = 0;
        } else if (this.gridContainer.y < this.scrollAreaHeight - this.gridContentBounds.height) {
            this.gridContainer.y = this.scrollAreaHeight - this.gridContentBounds.height;
        }
        
        // Create scrollbar
        this._createScrollbar(this.gridContentBounds.width, availableHeight);
        
        // Redraw grid boundaries
        this._drawGridBoundaries();
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
        
        // Add to container instead of directly to scene
        this.gridContainer.add(container);
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
        // Reset the scene before switching
        this._resetScene();
        this.scene.start('AnimationScene');
    }
    
    protected shutdown(): void {
        // Clean up resources when scene shuts down
        this._resetScene();
        
        // Clean up input events
        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.off('pointerup');
        this.input.off('wheel');
        
        // Remove resize listener
        this.scale.off('resize', this._handleResize);
        
        // Destroy mask if it exists
        if (this.gridMask) {
            this.gridMask.destroy();
        }
        
        // Destroy scrollbar elements
        if (this.scrollbar) {
            this.scrollbar.destroy();
        }
        
        if (this.scrollThumb) {
            this.scrollThumb.destroy();
        }
    }
} 