function CHelp(){
    
    var _oParent = this;
    
    var _oBg;
    var _oGroup1;
    var _oGroup2;
    
    var _bGroup1On = true;

    var _oMsgTextOutline;
    var _oMsgText;
    var _oMsgTextSlowDownStroke;
    var _oMsgTextSlowDown;
    var _oMsgTextHammerStroke;
    var _oMsgTextHammer;
    
    var _oHelpSprite;
    var _oHelpSprite2;
    var _oArrowLeft;
    var _oArrowRight;
    var _oButPlay;
    
    
    this._init = function(){
        _oBg = createBitmap(s_oSpriteLibrary.getSprite('bg_scroll_1'));
        s_oStage.addChild(_oBg);
        
        _oGroup1 = new createjs.Container();
        _oGroup1.alpha = 0;
        
        _oGroup2 = new createjs.Container();
        _oGroup2.alpha=0;
        
        _oBg = createBitmap(s_oSpriteLibrary.getSprite('msg_box'));
        
        s_oStage.addChild(_oBg);
                
        _oMsgTextOutline = new createjs.Text(""," 25px "+FONT, "#410701");
        _oMsgTextOutline.x = CANVAS_WIDTH/2+1;
        _oMsgTextOutline.y = (CANVAS_HEIGHT/2)+71;
        _oMsgTextOutline.textAlign = "center";
        _oMsgTextOutline.textBaseline = "alphabetic";
        _oMsgTextOutline.lineWidth = 400;     
        _oGroup1.addChild(_oMsgTextOutline);
                
        _oMsgText = new createjs.Text(""," 25px "+FONT, "#ffb400");
        _oMsgText.x = CANVAS_WIDTH/2;
        _oMsgText.y = (CANVAS_HEIGHT/2)+70;
        _oMsgText.textAlign = "center";
        _oMsgText.textBaseline = "alphabetic";
        _oMsgText.lineWidth = 400;     
        _oGroup1.addChild(_oMsgText);
        
        //GROUP 1
        if(!s_bMobile){
            //I'M ON A DESKTOP
            _oMsgTextOutline.text = TEXT_DESKTOP;
            _oMsgText.text = TEXT_DESKTOP;
            _oHelpSprite = createBitmap(s_oSpriteLibrary.getSprite('arrow_keys'));
            _oHelpSprite.x = CANVAS_WIDTH/2-100;
            _oHelpSprite.y = CANVAS_HEIGHT/2-100;
            _oGroup1.addChild(_oHelpSprite);
        }else{
            //I'M ON A MOBILE
            _oMsgTextOutline.text = TEXT_MOBILE;
            _oMsgText.text = TEXT_MOBILE;
            _oMsgTextOutline.y -= 15;
            _oMsgText.y -= 15;
            var oSprite = s_oSpriteLibrary.getSprite('arrow');
            _oHelpSprite = createBitmap(oSprite)
            _oHelpSprite.x = CANVAS_WIDTH/2-50;
            _oHelpSprite.y = CANVAS_HEIGHT/2-100;
            _oHelpSprite.scaleX = -1;
            _oGroup1.addChild(_oHelpSprite);

            _oHelpSprite2 = createBitmap(oSprite);
            _oHelpSprite2.x = CANVAS_WIDTH/2+50;
            _oHelpSprite2.y = CANVAS_HEIGHT/2-100;
            _oGroup1.addChild(_oHelpSprite2);
        }
        
        //GROUP 2
        
        var oSourceImage = s_oSpriteLibrary.getSprite('slow_bonus');
        var oData = {   
                    images: [oSourceImage], 
                    // width, height & registration point of each sprite
                    frames: {width: SLOW_WIDTH, height: SLOW_HEIGHT, regX: SLOW_WIDTH/2, regY: SLOW_HEIGHT/2}, 
                    animations: {idle:[0, 29, "idle"]}
                };

        var oSpriteSheet = new createjs.SpriteSheet(oData);
        var oSlow = createSprite(oSpriteSheet, "idle", 0, 0, SLOW_WIDTH/2, SLOW_HEIGHT/2);
        oSlow.x = CANVAS_WIDTH/2-120;
        oSlow.y = 420;
        _oGroup2.addChild(oSlow);
        
        var oSourceImage = s_oSpriteLibrary.getSprite('destroy_bonus');
        var oData = {   
                    images: [oSourceImage], 
                    // width, height & registration point of each sprite
                    frames: {width: DESTROY_WIDTH, height: DESTROY_HEIGHT, regX: DESTROY_WIDTH/2, regY: DESTROY_HEIGHT/2}, 
                    animations: {idle:[0, 17, "idle"]}
                };

        var oSpriteSheet = new createjs.SpriteSheet(oData);
        var oHammer = createSprite(oSpriteSheet, "idle", 0, 0, DESTROY_WIDTH/2, DESTROY_HEIGHT/2);
        oHammer.x = CANVAS_WIDTH/2-120;
        oHammer.y = 580;
        _oGroup2.addChild(oHammer);
        
        _oMsgTextSlowDownStroke = new createjs.Text(TEXT_SLOW_DOWN," 25px "+FONT, "#410701");
        _oMsgTextSlowDownStroke.x = CANVAS_WIDTH/2+51;
        _oMsgTextSlowDownStroke.y = (CANVAS_HEIGHT/2)-59;
        _oMsgTextSlowDownStroke.textAlign = "center";
        _oMsgTextSlowDownStroke.textBaseline = "alphabetic";
        _oMsgTextSlowDownStroke.lineWidth = 300;     
        _oGroup2.addChild(_oMsgTextSlowDownStroke);
                
        _oMsgTextSlowDown = new createjs.Text(TEXT_SLOW_DOWN," 25px "+FONT, "#ffb400");
        _oMsgTextSlowDown.x = CANVAS_WIDTH/2+50;
        _oMsgTextSlowDown.y = (CANVAS_HEIGHT/2)-60;
        _oMsgTextSlowDown.textAlign = "center";
        _oMsgTextSlowDown.textBaseline = "alphabetic";
        _oMsgTextSlowDown.lineWidth = 300;     
        _oGroup2.addChild(_oMsgTextSlowDown);
        
        _oMsgTextHammerStroke = new createjs.Text(TEXT_HAMMER," 25px "+FONT, "#410701");
        _oMsgTextHammerStroke.x = CANVAS_WIDTH/2+51;
        _oMsgTextHammerStroke.y = (CANVAS_HEIGHT/2)+101;
        _oMsgTextHammerStroke.textAlign = "center";
        _oMsgTextHammerStroke.textBaseline = "alphabetic";
        _oMsgTextHammerStroke.lineWidth = 300;     
        _oGroup2.addChild(_oMsgTextHammerStroke);
                
        _oMsgTextHammer = new createjs.Text(TEXT_HAMMER," 25px "+FONT, "#ffb400");
        _oMsgTextHammer.x = CANVAS_WIDTH/2+50;
        _oMsgTextHammer.y = (CANVAS_HEIGHT/2)+100;
        _oMsgTextHammer.textAlign = "center";
        _oMsgTextHammer.textBaseline = "alphabetic";
        _oMsgTextHammer.lineWidth = 300;     
        _oGroup2.addChild(_oMsgTextHammer);
        
        s_oStage.addChild(_oGroup1);
        s_oStage.addChild(_oGroup2);
                
        _oArrowLeft = createBitmap(s_oSpriteLibrary.getSprite('but_skip'));
        _oArrowLeft.x = CANVAS_WIDTH/2-220;
        _oArrowLeft.y = CANVAS_HEIGHT/2-10;
        _oArrowLeft.regX = 30;
        _oArrowLeft.regY = 43;
        _oArrowLeft.scaleX = -0.8;
        _oArrowLeft.cursor = "pointer";
        s_oStage.addChild(_oArrowLeft);
        
        _oArrowRight = createBitmap(s_oSpriteLibrary.getSprite('but_skip'));
        _oArrowRight.x = CANVAS_WIDTH/2+220;
        _oArrowRight.y = CANVAS_HEIGHT/2-10;
        _oArrowRight.regX = 30;
        _oArrowRight.regY = 43;
        _oArrowRight.scaleX = 0.8;
        _oArrowRight.cursor = "pointer";
        s_oStage.addChild(_oArrowRight);
        
        _oButPlay = createBitmap(s_oSpriteLibrary.getSprite('but_next'));
        _oButPlay.x = CANVAS_WIDTH/2-45;
        _oButPlay.y = CANVAS_HEIGHT/2+160;
        _oButPlay.cursor = "pointer";
        s_oStage.addChild(_oButPlay);
        
        _oArrowLeft.alpha = 0;
        _oArrowRight.alpha= 1;
        this.show();
    };
    
    this._initListener = function(){
        _oArrowLeft.addEventListener("click",this._previousPage);
        _oArrowRight.addEventListener("click",this._nextPage);
        _oButPlay.addEventListener("click",this._onExit);
    };
    
    this._previousPage = function(){
        if(!_bGroup1On){
            createjs.Tween.get(_oGroup1).to({alpha:1 }, 1000).call(function() {});
            createjs.Tween.get(_oGroup2).to({alpha:0 }, 500).call(function() { });
            createjs.Tween.get(_oArrowRight).to({alpha:1 }, 1000).call(function() {});
            createjs.Tween.get(_oArrowLeft).to({alpha:0 }, 500).call(function() {});
            _bGroup1On = true;
        }
    };
    
    this._nextPage = function(){
        if(_bGroup1On){
            createjs.Tween.get(_oGroup1).to({alpha:0 }, 500).call(function() {});
            createjs.Tween.get(_oGroup2).to({alpha:1 }, 1000).call(function() {});
            createjs.Tween.get(_oArrowRight).to({alpha:0 }, 500).call(function() {});
            createjs.Tween.get(_oArrowLeft).to({alpha:1 }, 1000).call(function() {});
            _bGroup1On = false;
        }
    };
    
    this.show = function(){
        
        createjs.Tween.get(_oGroup1).to({alpha:1 }, 500).call(function() {_oParent._initListener();});
    };
    
    this._onExit = function(){
        _oParent.unload();
        s_oMain.gotoGame();
    };
    
    this.unload = function(){
        _oArrowLeft.removeAllEventListeners ("click");
        _oArrowRight.removeAllEventListeners ("click");
        
        createjs.Tween.removeAllTweens();
        s_oStage.removeAllChildren();
        
    };
    
    this._init();
    
    return this;
}
