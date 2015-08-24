<?php
require($_SERVER['DOCUMENT_ROOT'] . '/../share/startup.php');
require('db.php');

if (!isset($_GET["mission"]) && $_GET['mission'] !== "gravitykit")
    db_ensure_logged_in();
$user = db_user();
$logged_in = 'true';

$cfg = init();
write_header($cfg);
write_cfg_json($cfg);
write_mission_rules($cfg);
?>

<?php write_js_requires($cfg); ?>

<script>
 LOGGED_USER='<?= $user ?>';
 LOGGED_IN=<?= $logged_in ?>;
 IS_KIOSK=<?= (db_is_kiosk_user() ? 'true' : 'false') ?>;
 EPHEMERAL_USER=<?= (db_is_demo_user(db_user()) ? 'true' : 'false')  ?>;
 APP_CFG.map = <?= json_encode(spyc_load_file("./map.yaml")); ?>;
</script>

<div id="app-rotate">
  Please rotate your device.
  <div>
    <img src="/share/img/ipad.png" class="uk-align-center">
  </div>
</div>
<div id="app-modal" class="full-size" style="display:none">
  Hello!
</div>


<div id="app" class="full-size">
<button id="star-start">
    <i class="icon fa fa-play"></i>
    <div>
        PLAY
    </div>
</button>
<div id="hint">
    
</div>
<div id="message">
    
</div>
  <div id="text-top" class="animated">
    Welcome!
  </div>
  
  
  <div id="canvas-container" class="full-size">
    
    <div id="info-top">
      <div id="info-table-container">
        <table cols="2">
          <tr>
            <td class="td-2col" colspan=2>
              <button class="planet" id="planet-1" data-n=1></button>
              <button class="planet" id="planet-2" data-n=2></button>
              <button class="planet" id="planet-3" data-n=3></button>
              <button class="planet" id="planet-4" data-n=4></button>
              <button class="planet" id="planet-5" data-n=5></button>
              <button class="planet" id="planet-6" data-n=6></button>
            </td>
          </tr>
          <tr id="mass-selection">
            <td class="td-label">Mass</td>
            <td class="td-val val-planet">
              <button class="td-val val-planet" id="mass-selector"><span id="mass" class="td-val"></span> <span class="change">change</span></button>                 
            </td>
          </tr>

          <tr>
            <td class="td-label">Distance</td>
            <td class="td-val val-planet" id="distance"></td>
          </tr>
          <tr>
            <td class="td-label">Speed</td>
            <td class="td-val val-planet" id="speed"></td>
          </tr>
          <tr>
            <td class="td-label">Temperature</td>
            <td class="td-val val-planet">
              <div id="temperature">
              </div>              
            </td>
          </tr>
          <tr>
            <td class="td-label">Time to orbit</td>
            <td class="td-val val-planet" id="period"></td>
          </tr>
        </table>
      </div>
      <div id="toolbars">
        <div class="toolbar in-front hidden" id="toolbar-masses">
          <div class="toolbar-title">
            Mass
            <button class="glass-btn fa fa-times close"></button>
          </div>
          <div id="mass-slider-container">
            <input type="range" id="mass-slider" min=0 max=500 step=1 value=1 >
          </div>
          <!--  
          <div class="uk-vertical-align mass-panel">
            <div style="float:left" class="earth">
              <div class="planet">
              </div>
              Earth
            </div>
            <div style="float:right" class="jupiter">
              <div class="planet">
              </div>
              Jupiter
            </div>
          </div>
          -->
        </div>
        <div class="toolbar in-front hidden" id="toolbar-zoom">
          <div class="toolbar-title">
            Zoom: <strong><span id="zoom-value">100</span>%</strong> &mdash;
            Speed: <strong><span id="speed-value">1</span>x</strong>
            <button class="glass-btn fa fa-times close"></button>
          </div>
          <button class="btn-jrs in-front circular" id="zoom-in"><span class="fa fa-plus"></span></button>
          <button class="btn-jrs in-front circular" id="zoom-out"><span class="fa fa-minus"></span></button>
          <button class="btn-jrs in-front circular" id="speed-down"><span class="fa fa-backward"></span></button>
          <button class="btn-jrs in-front circular" id="speed-up"><span class="fa fa-forward"></span></button>
        </div>
      </div>
      
    </div>
    <canvas id="canvas" resize keepalive="true" style="position:absolute"></canvas>
  </div>

  <div id="sidebar">
    <div class="mobile-only">
      <div class="sidebar-item">
        <button id="menu" class="btn-jrs-ico fa fa-bars"></button>
      </div>
      <div class="separator-center"></div>
    </div>
    
    <div class="sidebar-item" id="sidebar-menu">
      <button id="missions" class="btn-jrs-ico icon-missions" title="Mission menu" data-tooltip-content="{pos: 'right', offset:20}"></button>
      <div class="sidebar-title">Mission menu</div>
    </div>
    <div class="sidebar-item" id="sidebar-restart">
      <button id="reset" class="btn-jrs-ico fa fa-undo"  title="Restart level" data-tooltip-content="{pos: 'right', offset:20}"></button>
      <div class="sidebar-title">Restart mission</div>
    </div>
    <div class="sidebar-item" id="sidebar-sizes">
      <button id="sizes" class="btn-jrs-ico fa fa-arrows-alt"  title="Toggle physical size" data-tooltip-content="{pos: 'right', offset:20}"></button>
      <div class="sidebar-title">Toggle physical size</div>
    </div>
    <div class="sidebar-item">
      <button id="forces" class="btn-jrs-ico icon-force"  title="Toggle forces" data-tooltip-content="{pos: 'right', offset:20}"></button>
      <div class="sidebar-title">Toggle forces</div>
    </div>    
    <div class="sidebar-item"  title="Zoom and Speed" data-tooltip-content="{pos: 'right', offset:20}" id="sidebar-zoom">
      <button id="zoom" class="btn-jrs-ico fa fa-search"></button>
      <div class="sidebar-title">Zoom and Speed</div>
    </div>
    <div class="sidebar-item" id="sidebar-practice">
      <button id="practice" class="btn-jrs-ico icon-sandbox" title="Practice mode" data-tooltip-content="{pos: 'right', offset:20}"></button>
      <div class="sidebar-title">Practice mode</div>
    </div>
    <div class="sidebar-item" id="sidebar-unlockables">
      <button id="unlocked" class="btn-jrs-ico icon-unlockable" title="Unlocked Prizes" data-tooltip-content="{pos: 'right', offset:20}" data-uk-modal="{target:'#unlockables-modal', center: true, bgclose:false}"></button>
      <div class="sidebar-title">Unlocked prizes</div>
    </div>
    <div class="sidebar-item" id="sidebar-help">
      <button id="help" class="btn-jrs-ico fa fa-question-circle" title="Help" data-tooltip-content="{pos: 'right', offset:20}"></button>
      <div class="sidebar-title">Help</div>
    </div>
    <div class="sidebar-item" id="sidebar-reset-initial">
      <button id="reset-initial" class="btn-jrs-ico fa fa-history" title="Reset to initial conditions" data-tooltip-content="{pos: 'right', offset:20}"></button>
      <div class="sidebar-title">Reset to initial conditions</div>
    </div>
    <!-- 
    <div class="sidebar-item" id="sidebar-random">
      <button id="random" class="btn-jrs-ico fa fa-bolt" title="Make a random system!" data-tooltip-content="{pos: 'right', offset:20}"></button>
      <div class="sidebar-title">Make a random system!</div>
    </div>
    -->
    <div class="separator-center"></div>
    <div class="sidebar-item">
      <button class="settings btn-jrs-ico fa fa-sliders" data-uk-modal="{target:'#settings-modal', center: true, bgclose:false}" title="Settings" data-tooltip-content="{pos: 'right', offset:20}"></button>
      <div class="sidebar-title">Game settings</div>
    </div>
    <div class="sidebar-item">
      <button id="dashboard" class="dashboard btn-jrs-ico icon-dashboard" title="Back to Dashboard" data-tooltip-content="{pos: 'right', offset:20}"></button>
      <div class="sidebar-title">Back to dashboard</div>
    </div>

  </div>

  
  
  <div id="help-text" class="animated">
    <div id="help-body">
    </div>
  </div>
</div>

<div id="app-menu" class="animated">
  <div id="app-menu-map-container">
    <div id="app-menu-world">
      <div id="app-menu-world-stars">
        <span class="icon-win-star color-accent"></span>&times;<span id="app-menu-stars-earned">20</span>
      </div>
      <div id="app-menu-world-name">
      </div>
    </div>
    <div id="app-menu-map">
      
    </div>
  </div>
  <div id="app-menu-toolbar">
        <button id="menu-dashboard" class="dashboard settings btn-jrs-ico icon-dashboard"><span class="title">Exit</span></button>
      <button class="settings btn-jrs-ico fa fa-sliders" data-uk-modal="{target:'#settings-modal', center: true, bgclose:false}"><span class="title">Settings</span></button>
      <button class="settings btn-jrs-ico icon-sandbox" id="menu-practice"><span class="title">Practice Mode</span></button>
      <button class="settings btn-jrs-ico icon-unlockable" id="menu-unlockables" data-uk-modal="{target:'#unlockables-modal', center: true, bgclose:false}"><span class="title">Unlocked prizes</span></button>
    
  </div>
  <div id="app-menu-text">
    
    <div id="app-menu-text-top">
      <div id="app-menu-mission-title" class="title"></div>
      <div id="app-menu-mission-stars"></div>
      <div class="clear"></div>
    </div>
    <div class="bubble-cont">
      <img src="img/boss.min.gif" width="150" class="bubble-avatar">
      <div class="bubble">
        <div id="bubble-text">
        </div>
        <button id="app-menu-start" class="btn-jrs">
          Play
        </button>

      </div>
    </div>
    <div id="app-menu-start-container">
    </div>
  </div>
  
</div>
<div id="share-modal" class="uk-modal">
  <div class="uk-modal-dialog">
    Copy and paste this address to share your planetary system:
    <div>
      <input id="share-url">
    </div>
    <div class="separator-center"></div>
    <button class="btn-jrs uk-modal-close"><i class="fa fa-check"></i> OK</button>    
  </div>
</div>

<div id="unlockables-iframe" class="uk-modal">
    <div class="uk-modal-dialog settings-pane">
        <div class="iframe-container">
            <iframe>
            </iframe>
        </div>
        <button class="btn-jrs uk-modal-close"><i class="fa fa-close"></i> CLOSE</button>
    </div>
</div>

<div id="unlockables-modal" class="uk-modal">
    <div class="uk-modal-dialog settings-pane">
        <div class="title"><span class="color-accent icon-unlockable"></span> Unlockable Prizes</div><div class="subtitle">Play levels to unlock these bonuses!</div>
        <div id="unlockables-dialog">
            
        </div>
        
        <button class="btn-jrs uk-modal-close"><i class="fa fa-close"></i> CLOSE</button>            
    </div>
</div>
<div id="settings-modal" class="uk-modal">
  <div class="uk-modal-dialog" id="settings-dialog">
    

    <div class="settings-pane">
      <div>
        <label><i class="fa fa-music"></i> Music</label>
        <output></output>
      </div>
      <div class="clear"></div>
      <input type="range" class="settings-slider" id="settings-music-volume" min=0 max=100 step=10 value=0 data-property="musicVolume">
    </div>

    <div class="separator-center"></div>

    <div class="settings-pane">
      <div>
        <label><i class="fa fa-bell"></i> Sound effects</label>
        <output></output>
      </div>
      <div class="clear"></div>
      <input type="range" class="settings-slider" id="settings-effects-volume" min=0 max=100 step=10 value=0 data-property="effectsVolume">

    </div>

    <div class="separator-center"></div>

    <button class="btn-jrs uk-modal-close"><i class="fa fa-check"></i> OK</button>
  </div>


</div>

<script type="text/javascript" src="../share/js/init.js"></script>

<script type="text/javascript" src="js/ui.js"></script>
<script type="text/javascript" src="js/app.js"></script>
<script type="text/javascript" src="js/templates.js"></script>
<script type="text/javascript" src="js/map.js"></script>
<script type="text/javascript" src="js/single-choice.js"></script>
<script type="text/javascript" src="js/match-choice.js"></script>
<script type="text/javascript" src="js/cutscene.js"></script>
<script type="text/javascript" src="js/speech.js"></script>
<script type="text/javascript" src="js/settings.js"></script>
<script type="text/javascript" src="js/actions.js"></script>
<script type="text/javascript" src="js/debug.js"></script>

<script type="text/paperscript" canvas="canvas" src="draw/draw.js"></script>

<!-- Templates -->

<?php write_footer($cfg); ?>
<?php
if (db_is_god_user() || db_is_kiosk_user()) {
?>
  <style>
   #share {display:none}
  </style>
    <script>
     var val = <?php if (db_is_kiosk_user()) echo "0"; else echo "3"; ?>;
   $(window).load(function() {
     var missions = app.get('missions');

     missions.each(function(mission) {
       mission.set('stars', val);
       mission.set('completed', true);
     });

     $("#menu-dashboard").html("&nbsp;EXIT");

     console.log('done');
   });
  </script>
<?php
}
?>
