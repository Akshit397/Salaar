function CHelpPanel(){
    var _oBg;

    var _oLabelText;
    var _oLabelText1;

    var _oContainer;
    
    this._init = function(){
        _oContainer = new createjs.Container();
        s_oStage.addChild(_oContainer);
        _oBg = createBitmap(s_oSpriteLibrary.getSprite("bg_help_panel"));
                _oContainer.addChild(_oBg);

        _oLabelText = new createjs.Text(TEXT_HELP, "52px " + PRIMARY_FONT, "#d99b01");
        _oLabelText1 = new createjs.Text(TEXT_HELP, "52px " + PRIMARY_FONT, "#000");

        _oLabelText.textAlign = "right";
        _oLabelText.x = _oContainer.getBounds().width/2 + 250;
        _oLabelText.y = 60;
        _oLabelText.lineWidth = 500;
        _oLabelText1.textAlign = "right";
        _oLabelText1.x = _oContainer.getBounds().width/2 + 250;
        _oLabelText1.y = 60;
        _oLabelText1.lineWidth = 500;
        _oLabelText1.outline = 2;
        _oContainer.addChild(_oLabelText1);

        _oContainer.addChild(_oLabelText);
        _oContainer.x = CANVAS_WIDTH/2 - _oContainer.getBounds().width/2;
        _oContainer.y = - _oContainer.getBounds().height;
        this.show();
        var _oHitArea = new createjs.Shape();
        _oHitArea.graphics.beginFill("white").drawRect(0, 10, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oHitArea.alpha = 0.01;
        s_oStage.addChild(_oHitArea);
        _oHitArea.on("pressup", function ()
        {
                  new createjs.Tween.get(_oContainer).to({y: -_oContainer.getBounds().height}, 1000, createjs.Ease.cubicOut);
                  s_oStage.removeChild(_oHitArea);
 
        }
          ) ;
       
        
    };
    
    this.unload = function()
    {
    };
    
    this.show = function (){
      	new createjs.Tween.get(_oContainer).to({y: 500}, 500, createjs.Ease.cubicOut);
    };
    
   
    
    this._init();
}