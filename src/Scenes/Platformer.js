class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 375;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.coinsCollected = 0;
        this.hasKey = false;
    }

    create() {
        // Audio
        this.footstepSound = this.sound.add('footstep');
        this.impactSound = this.sound.add('impact');

        // Create a new tilemap game object
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 60, 25);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({ collides: true });

        // Create coins, key, and lock objects
        this.coins = this.map.createFromObjects("Objects", { name: "coin", key: "tilemap_sheet", frame: 151 });
        this.key = this.map.createFromObjects("Objects", { name: "key", key: "tilemap_sheet", frame: 27 });
        this.lock = this.map.createFromObjects("Objects", { name: "lock", key: "tilemap_sheet", frame: 28 });

        // Make key invisible to start
        this.key.forEach(key => {
            key.setVisible(false);
            key.setActive(false);
        });

        // Convert to Arcade Physics sprites
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.key, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.lock, Phaser.Physics.Arcade.STATIC_BODY);

        // Create groups for collision detection
        this.coinGroup = this.add.group(this.coins);
        this.keyGroup = this.add.group(this.key);
        this.lockGroup = this.add.group(this.lock);

        // Set up player avatar
        this.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        this.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(this.player, this.groundLayer);

        // Coin collision handler
        this.physics.add.overlap(this.player, this.coinGroup, (player, coin) => {
            coin.destroy();
            this.coinsCollected++;
            this.impactSound.play();
            console.log(`Coins collected: ${this.coinsCollected}`);
            if (this.coinsCollected === this.coins.length) {
                this.key.forEach(key => {
                    key.setVisible(true);
                    key.setActive(true);
                    console.log('Key is now visible.');
                });
            }
        });

        // Key collection/collision
        this.physics.add.overlap(this.player, this.keyGroup, (player, key) => {
            if (key.visible) {
                key.destroy();
                this.hasKey = true;
                this.impactSound.play();
                console.log('Key collected.');
            }
        });

        // Lock opening/usage
        this.physics.add.overlap(this.player, this.lockGroup, (player, lock) => {
            if (this.hasKey) {
                this.impactSound.play();
                console.log('Lock opened. Ending level...');
                this.scene.start('endScene');
            }
        });

        // Set up Phaser-provided cursor key input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');

        // Debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;
            this.physics.world.debugGraphic.clear();
        }, this);

        // Walking particles
        this.walkingParticles = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            scale: { start: 0.03, end: 0.01 },
            maxAliveParticles: 18,
            lifespan: 300,
            gravityY: -300,
            alpha: { start: 1, end: 0.1 },
        });
        this.walkingParticles.stop();

        // Jumping particles
        this.jumpingParticles = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            scale: { start: 0.03, end: 0.01 },
            maxAliveParticles: 18,
            lifespan: 300,
            gravityY: -300,
            alpha: { start: 1, end: 0.1 },
        });
        this.jumpingParticles.stop();

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.25, 0.25);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setAccelerationX(-this.ACCELERATION);
            this.player.resetFlip();
            this.player.anims.play('walk', true);
            this.walkingParticles.startFollow(this.player, this.player.displayWidth / 2 - 10, this.player.displayHeight / 2 - 5, false);
            this.walkingParticles.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (this.player.body.blocked.down) {
                this.walkingParticles.start();
                if (!this.footstepSound.isPlaying) this.footstepSound.play();
            }

        } else if (this.cursors.right.isDown) {
            this.player.setAccelerationX(this.ACCELERATION);
            this.player.setFlip(true, false);
            this.player.anims.play('walk', true);
            this.walkingParticles.startFollow(this.player, this.player.displayWidth / 2 - 10, this.player.displayHeight / 2 - 5, false);
            this.walkingParticles.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (this.player.body.blocked.down) {
                this.walkingParticles.start();
                if (!this.footstepSound.isPlaying) this.footstepSound.play();
            }

        } else {
            this.player.setAccelerationX(0);
            this.player.setDragX(this.DRAG);
            this.player.anims.play('idle');
            this.walkingParticles.stop();
        }

        // Player jump
        if (!this.player.body.blocked.down) {
            this.player.anims.play('jump');
        }
        if (this.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpingParticles.startFollow(this.player, 0, this.player.displayHeight / 2, false);
            this.jumpingParticles.start();
            this.footstepSound.play();
        }

        if (this.player.y > this.map.heightInPixels) {
            this.scene.restart();
        }

        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}
