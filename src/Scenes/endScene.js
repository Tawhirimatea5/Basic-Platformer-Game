class EndScene extends Phaser.Scene {
    constructor() {
        super("endScene");
    }

    create() {
        // Display a message or perform any end-game logic
        this.add.text(100, 100, 'Game Over', { fontSize: '32px', fill: '#fff' });

        // Optionally, you can set up input or additional functionality here
        var restartButton = this.add.text(400, 400, 'Restart', { fontSize: '24px', fill: '#fff', backgroundColor: '#3498db', padding: { x: 10, y: 5 } })
            .setOrigin(0.5)
            .setInteractive();

        // Handle restart button click
        restartButton.on('pointerdown', function() {
            this.restartGame();
        }, this);
    }

    // Restart the game function
    restartGame() {
        this.scene.start('platformerScene');
    }
    }
window.EndScene = EndScene