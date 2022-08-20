import BaseScene from "./BaseScene";

const pipesToRender = 4;


class PlayScene extends BaseScene {
  constructor(config){
    super('PlayScene', config);

    this.config = config;
    this.initialBirdPosition = {
      x: 80,
      y: 300
    }
    this.bird = null;
    this.pipes = null;
    this.isPaused = false;

    this.gravity = 600;
    this.flapVelocity = 300;

    this.score = 0;
    this.scoreText = '';

    this.currentDifficulty;
    this.difficulties = {
      'easy': {
        pipeHorizontalDistance: [300,350],
        pipeVerticalDistance: [150, 200],
      },
      'normal': {
        pipeHorizontalDistance: [280,330],
        pipeVerticalDistance: [140, 190],
      },
      'hard': {
        pipeHorizontalDistance: [250,310],
        pipeVerticalDistance: [120, 150],
      }
    }
  }

  create(){
    this.currentDifficulty = 'easy';
    super.create();
    this.createBird();
    this.createPipes();
    this.createColliders();
    this.createScore();
    this.createPause();
    this.handleInputs();
    this.listenToEvents();  

    this.anims.create({
      key: 'fly',
      frames: this.anims.generateFrameNumbers('bird', { start: 8, end: 15 }),
      frameRate: 8,
      repeat: -1
    });

    this.bird.play('fly');
  }

  update(){
    this.checkGameStatus();
    this.recyclePipes();
  }

  listenToEvents(){
    if (this.pauseEvent) { return; }

    this.pauseEvent = this.events.on('resume', () => {
      this.initialTime = 3;
      this.countDownText = this.add.text(...this.screenCenter, 'Fly in ' + this.initialTime, this.fontOptions).setOrigin(0.5);
      this.timedEvent = this.time.addEvent({
        delay: 1000,
        callback: this.countDown,
        callbackScope: this,
        loop: true
      })
    });
  }

  countDown() {
    this.initialTime--;
    this.countDownText.setText('Fly in ' + this.initialTime);
    if(this.initialTime <= 0) {
      this.isPaused = false;
      this.countDownText.setText('');
      this.isPaused = false;
      this.physics.resume();
      this.timedEvent.remove();
    }
  }

  createBG(){
    this.add.image(0, 0, 'sky').setOrigin(0, 0)
  }

  createBird(){
    this.bird = this.physics.add.sprite(this.config.startPosition.x, this.config.startPosition.y, 'bird')
      .setFlipX(true)
      .setScale(2)
      .setOrigin(0)
    this.bird.setBodySize(this.bird.width, this.bird.height - 6);
    
    this.bird.body.gravity.y = this.gravity;
    this.bird.setCollideWorldBounds(true);
  }

  createPipes(){
    this.pipes = this.physics.add.group();
    for (let i =0; i< pipesToRender; i++){
      const upperPipe = this.pipes.create(0, 0, 'pipe')
      .setImmovable(true)
      .setOrigin(0, 1);
      const lowerPipe = this.pipes.create(0, 0, 'pipe')
      .setImmovable(true)
      .setOrigin(0, 0);
      this.placePipe(upperPipe, lowerPipe);
    }
    this.pipes.setVelocityX(-200);
  }

  createColliders(){
    this.physics.add.collider(this.bird, this.pipes, this.gameOver, null, this);
  }

  createScore() {
    this.score = 0;
    const bestScore = localStorage.getItem('bestScore');
    this.scoreText = this.add.text(16,16, `Score: ${0}`, { fontSize: '32px', fill: '#000' });
    this.add.text(16,52, `Best Score: ${bestScore || 0}`, { fontSize: '18px', fill: '#000' }); 
  }

  createPause() {
    this.isPaused = false
    const pauseButton = this.add.image(this.config.width - 10, this.config.height - 10, 'pause')
      .setInteractive()  
      .setScale(3)
      .setOrigin(1);

    pauseButton.on('pointerdown', () => {
      this.isPaused = true
      this.physics.pause();
      this.scene.pause();
      this.scene.launch('PauseScene');
    })
  }

  handleInputs(){
    this.input.on('pointerdown', this.flap, this)
    this.input.keyboard.on('keydown_SPACE', this.flap, this)
  }

  checkGameStatus(){
    if(this.bird.getBounds().bottom >= this.config.height || this.bird.y <= 0){
      this.gameOver();
    }
  }

  placePipe(uPipe, lPipe) {
    const difficulty = this.difficulties[this.currentDifficulty];
    const rightMostX = this.getRightmostPipe();
    const pipeVerticalDistance = Phaser.Math.Between(...difficulty.pipeVerticalDistance);
    const pipeVerticalPosition = Phaser.Math.Between(0 + 20, this.config.height - 20 - pipeVerticalDistance);
    const pipeHorizontalDistance = Phaser.Math.Between(...difficulty.pipeHorizontalDistance);
    uPipe.x = rightMostX + pipeHorizontalDistance
    uPipe.y = pipeVerticalPosition
    lPipe.x = uPipe.x;
    lPipe.y = uPipe.y + pipeVerticalDistance;
  }
  
  recyclePipes() {
    const tempPipes = [];
    this.pipes.getChildren().forEach(pipe => {
      if(pipe.getBounds().right <= 0){
        tempPipes.push(pipe);
        if(tempPipes.length === 2) {
          this.placePipe(...tempPipes);
          this.increaseScore();
          this.saveBestSocore();
          this.increaseDifficulty();
        }
      }
    })
  }

  increaseDifficulty() {
    if (this.score <= 10) {
      this.currentDifficulty = 'easy';
      return
    }
    if(this.score <= 30) {
      this.currentDifficulty = 'normal';
      return
    }
    this.currentDifficulty = 'hard';
        
  }

  getRightmostPipe(){
    let rightMostX = 0;
    this.pipes.getChildren().forEach(pipe => {
      rightMostX = Math.max(pipe.x, rightMostX);
    })
    return rightMostX;
  }
  
  saveBestSocore() {
    const bestScoreText = localStorage.getItem('bestScore');
    const bestScore = bestScoreText && parseInt(bestScoreText, 10);

    if(!bestScore || this.score > bestScore) {
      localStorage.setItem('bestScore', this.score);
    }
  }

   gameOver() {
    this.physics.pause();
    this.bird.setTint(0xEE4824);
    this.saveBestSocore();
    this.bird.anims.stop('fly');
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.scene.restart();
      },
      loop: false
    })
  }
  
  flap(){
    if(this.isPaused) { return; }
    this.bird.body.velocity.y = -this.flapVelocity;
  }

  increaseScore() {
    this.score++;
    this.scoreText.setText(`Score: ${this.score}`);
  }
}

export default PlayScene;