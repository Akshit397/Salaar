var CANVAS_WIDTH = 640;
var CANVAS_HALF_WIDTH = CANVAS_WIDTH/2;
var CANVAS_HEIGHT = 960;

var FONT = "rocks__gregular";

var EDGEBOARD_X = 20;
var EDGEBOARD_Y = 95;

var FPS_TIME              = 1000/24;
var DISABLE_SOUND_MOBILE  = false;

var PLAYER_X_START        = CANVAS_WIDTH/2-25;
var PLAYER_Y_START        = 356;

var PLAYER_WIDTH  = 127;
var PLAYER_HEIGHT = 124;
var PLAYER_CHAINED_WIDTH  = 215;
var PLAYER_CHAINED_HEIGHT = 152;
var PLAYER_HAMMER_WIDTH  = 156;
var PLAYER_HAMMER_HEIGHT = 219;
var PLAYER_GHOST_WIDTH  = 130;
var PLAYER_GHOST_HEIGHT = 192;

var MAX_PLATFORM_FOR_TYPE           = 26;
var PLATFORM_WIDTH                  = 350;
var PLATFORM_HEIGHT                 = 200;
var PLATFORM_START_WIDTH            = 380;
var PLATFORM_START_HEIGHT           = 49;
var SLOW_WIDTH                      = 120;
var SLOW_HEIGHT                     = 126;
var DESTROY_WIDTH                   = 105;
var DESTROY_HEIGHT                  = 132;
var TORCH_WIDTH                     = 342;
var TORCH_HEIGHT                    = 320;
var ROTATORY_SAW_WIDTH              = 120;
var ROTATORY_SAW_HEIGHT             = 66;
var CEILING_WIDTH                   = 640;
var CEILING_HEIGHT                  = 173;
var ROTATORY_SAW_DESTROYED_WIDTH    = 200;
var ROTATORY_SAW_DESTROYED_HEIGHT   = 150;
var NUM_ELEMENTS                    = 2;

var PLATFORM = 1;
var THORNS   = 2;
var OBSTACLE = 3;

var ROTARY_SAW = 0;

var PLAYER_SPD_MAX;
var PLAYER_SPD_FALLING;
var PLAYER_MAX_SPD_FALLING; 
var PLAYER_ACCELERATION;
var PLAYER_DECELERATION;
var OBJECT_SPD;
var OBJECT_SPD_ADDER;
var SCORE_TO_REACH_FOR_INCREMENT_SPEED;
var OBJECT_SPD_ORIZZONTAL;
var ACCELERATION;
var DECELERATION;
var GAMMA_RANGE_ACCEPTED;
var CANVAS_WIDTH_RANGE_ACCEPTED;
var DECELERATION_BG_GAME_OVER;
var HEIGHT_BETWEEN_OBJECT;
var TIME_TO_SPAWN_THORNS;
var TIME_TO_HIDE_THORNS;
var BONUS_OCCUR;
var TIME_SLOW_DOWN_POWERUP;
var SCORE_BREAKED_PLATFORM;
var SCORE_TO_CHANGE_OCCURRENCE;
var SPAWN_DELAY_PLATFORM_OBSTACLES;

var SLOW = 0;
var DESTROY = 1;

var BG_INDEX       = 1;

var GOING_RIGHT    = 0;
var GOING_LEFT     = 1;

var LEFT_DIR      = 37;
var UP_DIR        = 38;
var RIGHT_DIR     = 39;
var DOWN_DIR      = 40;
var SPACEBAR      = 32;

var STATE_LOADING  = 0;
var STATE_MENU     = 1;
var STATE_HELP     = 1;
var STATE_GAME     = 3;

var ON_MOUSE_DOWN  = 0;
var ON_MOUSE_UP    = 1;
var ON_MOUSE_OVER  = 2;
var ON_MOUSE_OUT   = 3;
var ON_DRAG_START  = 4;
var ON_DRAG_END    = 5;

var SHOW_CREDITS = true;
var ENABLE_FULLSCREEN;
var ENABLE_CHECK_ORIENTATION;