var CANVAS_WIDTH = 1500;
var CANVAS_HEIGHT = 768;

var EDGEBOARD_X = 180;
var EDGEBOARD_Y = 20;

var FPS = 30;
var FPS_TIME      = 1000/FPS;
var DISABLE_SOUND_MOBILE = false;
var FONT_GAME = "space_marine";

var STATE_LOADING    = 0;
var STATE_MENU       = 1;
var STATE_MENU_LEVEL = 2;
var STATE_GAME       = 3;

var ON_MOUSE_DOWN = 0;
var ON_MOUSE_UP   = 1;
var ON_MOUSE_OVER = 2;
var ON_MOUSE_OUT  = 3;
var ON_DRAG_START = 4;
var ON_DRAG_END   = 5;
var ON_BUT_YES_DOWN = 6;
var ON_PLAYER_TOUCHDOWN = 7;
var ON_PLAYER_TACKLED = 8;
var ON_OPPONENT_HIDE = 9;
var ON_OPPONENT_TACKLE = 10;
var ON_POWERUP_END_MOVE = 11;
var ON_BACK_MENU = 12;
var ON_RESTART = 13;
var ON_NEXT_LEVEL = 14; 

const PLAYER_ANIM_RUN = 0;
const PLAYER_ANIM_FALL = 1;
const PLAYER_ANIM_TOUCHDOWN = 2;
const PLAYER_ANIM_JUMP = 3;

const STARTING_STANDS_SCALE_BONUS = 0.74;

var NUM_LEVELS;
var OPPONENT_FINAL_Y = 1070;
var POWERUP_FINAL_Y = 600;
const TIME_OPPONENT_RUN = 3000;
var HERO_ACCELERATION;
var HERO_SUPER_ACCELERATION;
var HERO_FRICTION;
var MAX_HERO_SPEED;
var MAX_DIST_AVOID_OPPONENT_IN_JUMP = 150;
var MIN_POWERUP_X = 700;
var MAX_POWERUP_X = 800;
var SCORE_POWERUP;
var TIME_EFFECT_POWERUP = 10000;

var NUM_COLS_PAGE_LEVEL = 6;
var NUM_ROWS_PAGE_LEVEL = 2;
var SOUNDTRACK_VOLUME_IN_GAME  = 1;

var ENABLE_FULLSCREEN;
var ENABLE_CHECK_ORIENTATION;