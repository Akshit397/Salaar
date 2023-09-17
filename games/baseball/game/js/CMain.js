function CMain(oData){
    var _bUpdate;
    var _iCurResource = 0;
    var RESOURCE_TO_LOAD = 0;
    var _iState = STATE_LOADING;
    var _oData;
    
    var _oPreloader;
    var _oMenu;
    var _oHelp;
    var _oGame;

    this.initContainer = function(){
        s_oCanvas = document.getElementById("canvas");
        s_oStage = new createjs.Stage(s_oCanvas);
        createjs.Touch.enable(s_oStage);
		
	s_bMobile = jQuery.browser.mobile;
        if(s_bMobile === false){
            s_oStage.enableMouseOver(20);  
            $('body').on('contextmenu', '#canvas', function(e){ return false; });
        }
		
        s_iPrevTime = new Date().getTime();

	createjs.Ticker.addEventListener("tick", this._update);
        createjs.Ticker.framerate = 30;
        
        if(navigator.userAgent.match(/Windows Phone/i)){
                DISABLE_SOUND_MOBILE = true;
        }
        
        s_oSpriteLibrary  = new CSpriteLibrary();

        //ADD PRELOADER
        _oPreloader = new CPreloader();
    };
    
    this.preloaderReady = function(){
        this._loadImages();
        
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            this._initSounds();
        }
        
        
        _bUpdate = true;
    };
    
    this.soundLoaded = function(){
        _iCurResource++;
        var iPerc = Math.floor(_iCurResource/RESOURCE_TO_LOAD *100);
        _oPreloader.refreshLoader(iPerc);

    };

    
    this._initSounds = function(){
        var aSoundsInfo = new Array();
        aSoundsInfo.push({path: './sounds/',filename:'baseball_buzzer',loop:false,volume:1, ingamename: 'baseball_buzzer'});
        aSoundsInfo.push({path: './sounds/',filename:'baseball_countdown_1',loop:false,volume:1, ingamename: 'baseball_countdown_1'});
        aSoundsInfo.push({path: './sounds/',filename:'baseball_countdown_2',loop:false,volume:1, ingamename: 'baseball_countdown_2'});
        aSoundsInfo.push({path: './sounds/',filename:'baseball_crowd_homerun',loop:false,volume:1, ingamename: 'baseball_crowd_homerun'});
        aSoundsInfo.push({path: './sounds/',filename:'baseball_crowd_strike',loop:false,volume:1, ingamename: 'baseball_crowd_strike'});
        aSoundsInfo.push({path: './sounds/',filename:'baseball_drop_bounce_grass',loop:false,volume:1, ingamename: 'baseball_drop_bounce_grass'});
        aSoundsInfo.push({path: './sounds/',filename:'baseball_hit_ball',loop:false,volume:1, ingamename: 'baseball_hit_ball'});
        aSoundsInfo.push({path: './sounds/',filename:'crowd_cheering',loop:true,volume:1, ingamename: 'crowd_cheering'});
        aSoundsInfo.push({path: './sounds/',filename:'baseball_applauses',loop:false,volume:1, ingamename: 'baseball_applauses'});
        aSoundsInfo.push({path: './sounds/',filename:'crowd_ohhh',loop:false,volume:1, ingamename: 'crowd_ohhh'});
        aSoundsInfo.push({path: './sounds/',filename:'soundtrack',loop:true,volume:1, ingamename: 'soundtrack'});
        
        RESOURCE_TO_LOAD += aSoundsInfo.length;

        s_aSounds = new Array();
        for(var i=0; i<aSoundsInfo.length; i++){
            s_aSounds[aSoundsInfo[i].ingamename] = new Howl({ 
                                                            src: [aSoundsInfo[i].path+aSoundsInfo[i].filename+'.mp3'],
                                                            autoplay: false,
                                                            preload: true,
                                                            loop: aSoundsInfo[i].loop, 
                                                            volume: aSoundsInfo[i].volume,
                                                            onload: s_oMain.soundLoaded
                                                        });
        }
        
    };  

    this._loadImages = function(){
        s_oSpriteLibrary.init( this._onImagesLoaded,this._onAllImagesLoaded, this );

        s_oSpriteLibrary.addSprite("but_play","./sprites/but_play.png");
        s_oSpriteLibrary.addSprite("msg_box","./sprites/msg_box.png");
        
        s_oSpriteLibrary.addSprite("bg_menu","./sprites/bg_menu.jpg");
        s_oSpriteLibrary.addSprite("but_exit","./sprites/but_exit.png");
        s_oSpriteLibrary.addSprite("logo_menu","./sprites/logo_menu.png");
        
        s_oSpriteLibrary.addSprite("audio_icon","./sprites/audio_icon.png");
        
        s_oSpriteLibrary.addSprite("bg_game","./sprites/bg_game.jpg");
        s_oSpriteLibrary.addSprite("score_panel","./sprites/score_panel.png");
        s_oSpriteLibrary.addSprite("air_view","./sprites/air_view.jpg");
        s_oSpriteLibrary.addSprite("ball","./sprites/ball.png");
        s_oSpriteLibrary.addSprite("ball_shadow","./sprites/ball_shadow.png");
        
        s_oSpriteLibrary.addSprite("area_bottom","./sprites/area_bottom.png");
        s_oSpriteLibrary.addSprite("area_top","./sprites/area_top.png");
        s_oSpriteLibrary.addSprite("crowd_left","./sprites/crowd_left.png");
        s_oSpriteLibrary.addSprite("crowd_right","./sprites/crowd_right.png");
        
        s_oSpriteLibrary.addSprite("1","./sprites/1.png");
        s_oSpriteLibrary.addSprite("2","./sprites/2.png");
        s_oSpriteLibrary.addSprite("3","./sprites/3.png");
        s_oSpriteLibrary.addSprite("start_msg","./sprites/start_msg.png");
        s_oSpriteLibrary.addSprite("strike_msg","./sprites/strike_msg.png");
        s_oSpriteLibrary.addSprite("but_credits","./sprites/but_credits.png");
        s_oSpriteLibrary.addSprite("logo_credits","./sprites/logo_credits.png");
        s_oSpriteLibrary.addSprite("but_fullscreen","./sprites/but_fullscreen.png");
        
        for(var i = 0; i<NUM_SPRITE_BATTING; i++){
            s_oSpriteLibrary.addSprite("batter_batting_"+i,"./sprites/batter_hit/batter_batting_"+i+".png");
        }
        for(var i = 0; i<NUM_SPRITE_PLAYERS; i++){
            s_oSpriteLibrary.addSprite("batter_idle_"+i,"./sprites/batter_idle/batter_idle_"+i+".png");
        }
        for(var i = 0; i<NUM_SPRITE_PLAYERS; i++){
            s_oSpriteLibrary.addSprite("pitcher_"+i,"./sprites/pitcher/pitcher_"+i+".png");
        }
        
        
        RESOURCE_TO_LOAD += s_oSpriteLibrary.getNumSprites();
        s_oSpriteLibrary.loadSprites();
    };
    
    this._onImagesLoaded = function(){
        _iCurResource++;
        var iPerc = Math.floor(_iCurResource/RESOURCE_TO_LOAD *100);
        _oPreloader.refreshLoader(iPerc);
    };
    
    this._onAllImagesLoaded = function(){
        
    };
    this._allResourcesLoaded = function(){
        _oPreloader.unload(); 
        
        s_oSoundTrack = playSound("soundtrack", 1, true);

        s_oMain.gotoMenu();
    };

    this.gotoMenu = function(){
        _oMenu = new CMenu();
        _iState = STATE_MENU;
    };
    

    this.gotoGame = function(){
        
        _oGame = new CGame(_oData);   						
        _iState = STATE_GAME;

    };
    
    this.gotoHelp = function(){
        _oHelp = new CHelp();
        _iState = STATE_HELP;
    };
	
    this.stopUpdate = function(){
        _bUpdate = false;
        createjs.Ticker.paused = true;
        $("#block_game").css("display","block");
        
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            Howler.mute(true);
        }
        
    };

    this.startUpdate = function(){
        s_iPrevTime = new Date().getTime();
        _bUpdate = true;
        createjs.Ticker.paused = false;
        $("#block_game").css("display","none");
        
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            if(s_bAudioActive){
                Howler.mute(false);
            }
        }
        
    };
    
    this._update = function(event){
        if(_bUpdate === false){
                return;
        }
        var iCurTime = new Date().getTime();
        s_iTimeElaps = iCurTime - s_iPrevTime;
        s_iCntTime += s_iTimeElaps;
        s_iCntFps++;
        s_iPrevTime = iCurTime;
        
        if ( s_iCntTime >= 1000 ){
            s_iCurFps = s_iCntFps;
            s_iCntTime-=1000;
            s_iCntFps = 0;
        }
                
        if(_iState === STATE_GAME){
            _oGame.update();
        }
        
        s_oStage.update(event);

    };
    
    s_oMain = this;
    
    _oData = oData;
    ENABLE_FULLSCREEN = oData.fullscreen;
    ENABLE_CHECK_ORIENTATION = oData.check_orientation;
    
    this.initContainer();
}
var s_bMobile;
var s_bAudioActive = true;
var s_iCntTime = 0;
var s_iTimeElaps = 0;
var s_iPrevTime = 0;
var s_iCntFps = 0;
var s_iCurFps = 0;
var s_bBounce = true;

var s_oDrawLayer;
var s_oStage;
var s_oMain;
var s_oStadium;
var s_oBall;
var s_oSpriteLibrary;
var s_oSoundTrack = null;
var s_oCanvas;
var s_aSounds;