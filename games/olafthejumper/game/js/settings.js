var CANVAS_WIDTH = 768;
var CANVAS_HEIGHT = 1400;

var EDGEBOARD_X = 40;
var EDGEBOARD_Y = 260;

var FPS = 30;
var FPS_TIME = 1000 / FPS;
var DISABLE_SOUND_MOBILE = false;

var PRIMARY_FONT = "gomarice_rocks-webfont";
var SCORE_ITEM_NAME = "olaf_the_viking_bestscore";
var STATE_LOADING = 0;
var STATE_MENU = 1;
var STATE_HELP = 1;
var STATE_GAME = 3;

var ON_MOUSE_DOWN = 0;
var ON_MOUSE_UP = 1;
var ON_MOUSE_OVER = 2;
var ON_MOUSE_OUT = 3;
var ON_DRAG_START = 4;
var ON_DRAG_END = 5;
var ON_COLLISION = 6;

var STARTX = 153;
var STARTY = 1120;
var GRAVITY = 0.98;
var OBST_WIDTH;
var OBST_HEIGHT;
var ENABLE_FULLSCREEN;
var ENABLE_CHECK_ORIENTATION;
