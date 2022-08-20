import BaseScene from "./BaseScene";

class ScoreScene extends BaseScene {
  constructor(config){
    super('ScoreScene', {...config, canGoBack: true});
  }

  create(){
    super.create()

    const bestScoreText = localStorage.getItem('bestScore');
    this.add.text(...this.screenCenter, `Best Score: ${bestScoreText || 0}`, this.fontOptions)
      .setOrigin(0.5)
  }
  
}

export default ScoreScene;