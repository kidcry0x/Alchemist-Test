import { Scene, GameObjects } from 'phaser';
import { AlchemistLogo } from '../animation/AlchemistLogo';

export class AnimationScene extends Scene {
    private titleText: GameObjects.Text;
    private backButton: GameObjects.Container;
    private alchemistLogo: AlchemistLogo;
    
    constructor() {
        super('AnimationScene');
    }

    protected preload(): void {
        this.load.plugin('rexglowfilter2pipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexglowfilter2pipelineplugin.min.js', true);
    }

    protected create(): void {
        // Background - completely black
        this.cameras.main.setBackgroundColor('#000000');

        // Title
        this.titleText = this.add.text(this.cameras.main.width / 2, 70, 'Alchemist Logo Animation', {
            fontFamily: 'Arial Black', fontSize: 40, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        // Back button
        this.backButton = this._createButton(this.cameras.main.width * 0.1, 70, 'Back', () => {
            this.scene.start('GridScene');
        });

        // Initialize and run Alchemist logo effect
        this.alchemistLogo = new AlchemistLogo(this);
        this.alchemistLogo.play();
        
        // Listen for resize events
        this.scale.on('resize', this._onHandleResize, this);
    }
    
    private _createButton(x: number, y: number, text: string, callback: Function): GameObjects.Container {
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
     * Method to handle screen resize
     */
    protected _onHandleResize(gameSize: Phaser.Structs.Size): void {
        // Update title position
        if (this.titleText) {
            this.titleText.setPosition(gameSize.width / 2, 70);
        }
        
        // Update back button position
        if (this.backButton) {
            this.backButton.setPosition(gameSize.width * 0.1, 70);
        }
    }
} 