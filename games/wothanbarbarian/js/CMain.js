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
        s_oStage.preventSelection = false;
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
        aSoundsInfo.push({path: './sounds/',filename:'ceiling',loop:true,volume:1, ingamename: 'ceiling'});
        aSoundsInfo.push({path: './sounds/',filename:'death',loop:false,volume:1, ingamename: 'death'});
        aSoundsInfo.push({path: './sounds/',filename:'game_over',loop:true,volume:1, ingamename: 'game_over'});
        aSoundsInfo.push({path: './sounds/',filename:'platform_broken',loop:false,volume:1, ingamename: 'platform_broken'});
        aSoundsInfo.push({path: './sounds/',filename:'power_up_slow',loop:false,volume:1, ingamename: 'power_up_slow'});
        aSoundsInfo.push({path: './sounds/',filename:'click',loop:false,volume:1, ingamename: 'click'});
        aSoundsInfo.push({path: './sounds/',filename:'power_up',loop:false,volume:1, ingamename: 'power_up'});
        aSoundsInfo.push({path: './sounds/',filename:'spikes',loop:false,volume:1, ingamename: 'spikes'});
        aSoundsInfo.push({path: './sounds/',filename:'wothan_broken_chains',loop:false,volume:1, ingamename: 'wothan_broken_chains'});
        aSoundsInfo.push({path: './sounds/',filename:'wothan_hammer',loop:false,volume:1, ingamename: 'wothan_hammer'});
        aSoundsInfo.push({path: './sounds/',filename:'wothan_landing',loop:false,volume:1, ingamename: 'wothan_landing'});
        aSoundsInfo.push({path: './sounds/',filename:'soundtrack',loop:true,volume:1, ingamename: 'soundtrack'});
        
        RESOURCE_TO_LOAD += aSoundsInfo.length;

        s_aSounds = new Array();
        for(var i=0; i<aSoundsInfo.length; i++){
            s_aSounds[aSoundsInfo[i].ingamename] = new Howl({ 
                                                            src: [aSoundsInfo[i].path+aSoundsInfo[i].filename+'.mp3', aSoundsInfo[i].path+aSoundsInfo[i].filename+'.ogg'],
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
        s_oSpriteLibrary.addSprite("but_restart","./sprites/but_restart.png");
        s_oSpriteLibrary.addSprite("but_home","./sprites/but_home.png");
        s_oSpriteLibrary.addSprite("msg_box","./sprites/msg_box.png");
        
        s_oSpriteLibrary.addSprite("bg_menu","./sprites/bg_menu.jpg");
        s_oSpriteLibrary.addSprite("bg_scroll_1","./sprites/bg_scroll_1.jpg");
        s_oSpriteLibrary.addSprite("bg_scroll_2","./sprites/bg_scroll_2.jpg");
        s_oSpriteLibrary.addSprite("bg_scroll_3","./sprites/bg_scroll_3.jpg");
        
        s_oSpriteLibrary.addSprite("arrow","./sprites/arrow.png");
        s_oSpriteLibrary.addSprite("but_next","./sprites/but_next.png");
        
        s_oSpriteLibrary.addSprite("but_skip","./sprites/but_skip.png");
        
        s_oSpriteLibrary.addSprite("but_info","./sprites/but_info.png");
        s_oSpriteLibrary.addSprite("credits_panel","./sprites/credits_panel.png");
        s_oSpriteLibrary.addSprite("logo_credits","./sprites/logo_credits.png");
        
        s_oSpriteLibrary.addSprite("but_exit","./sprites/but_exit.png");
        s_oSpriteLibrary.addSprite("audio_icon","./sprites/audio_icon.png");
        
        s_oSpriteLibrary.addSprite("player_left","./sprites/wothan_idle_walk_falling_left_sprite.png");
        s_oSpriteLibrary.addSprite("player_right","./sprites/wothan_idle_walk_falling_right_sprite.png");
        s_oSpriteLibrary.addSprite("player_hammer_left","./sprites/wothan_hammer_left_sprite.png");
        s_oSpriteLibrary.addSprite("player_hammer_right","./sprites/wothan_hammer_right_sprite.png");
        s_oSpriteLibrary.addSprite("player_start","./sprites/wothan_broken_chain_sprite.png");
        s_oSpriteLibrary.addSprite("player_dead","./sprites/wothan_dead_sprite.png");
        s_oSpriteLibrary.addSprite("ghost","./sprites/ghost_sprite.png");
        
        s_oSpriteLibrary.addSprite("floor_start","./sprites/floor.png");
        
        s_oSpriteLibrary.addSprite("torch","./sprites/torch_sprite.png");
        
        s_oSpriteLibrary.addSprite("ceiling","./sprites/ceiling_sprite.png");
        
        s_oSpriteLibrary.addSprite("platforms","./sprites/platforms_sprite.png");
        
        s_oSpriteLibrary.addSprite("slow_bonus","./sprites/power_up_slow_sprite.png");
        s_oSpriteLibrary.addSprite("destroy_bonus","./sprites/power_up_hammer_sprite.png");
        
        s_oSpriteLibrary.addSprite("rotary_saw","./sprites/wheel_rotation_sprite.png");
        s_oSpriteLibrary.addSprite("rotary_saw_destroyed","./sprites/wheel_explosion_sprite.png");
                
        s_oSpriteLibrary.addSprite("arrow_keys","./sprites/arrow_keys.png");
        s_oSpriteLibrary.addSprite("but_fullscreen","./sprites/but_fullscreen.png");
        

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

    this.gotoGame = function(iLevel){        
        _oGame = new CGame(_oData, iLevel);   						
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

var s_oDrawLayer;
var s_oStage;
var s_oMain;
var s_oSpriteLibrary;
var s_oSoundTrack = null;
var s_oCanvas;
