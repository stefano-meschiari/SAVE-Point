<?php

require_once('../../share/startup.php');
require_once('db.php');
require_once('messages.php');

$cfg = init();
write_header($cfg);


?>
<?php write_js_requires($cfg); ?>
<div class="uk-container uk-container-center uk-margin-top uk-margin-large-bottom" id="container">
  
  <!--[if lt IE 7]>
  <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
  <![endif]-->
  <div class="uk-modal" id="alert">
    <div class="uk-modal-dialog">
      <div class="modal-content">
        <span id="alert-message"><?= $ERROR_MESSAGES[$_GET['alert']] ?></span>
        <hr>
        <button type="button" class="uk-button uk-button-primary primary-button uk-modal-close">Close</button>
      </div>
    </div>
  </div>

  <div id="content">
    <div id="save-brand">
      <div class="brand">
        <span class="heavy">SAVE</span><span class="sep">/</span><span class="light">Point</span>
        <div class="brand-acronym">
          Society for Astronomy Visualization and Education
        </div>
      </div>
    </div>

    <div id="app-screen">
      <div id="app-user">
        <ul class="uk-tab" data-uk-switcher="{connect:'#tabs', animation:'scale'}">
          <li><a href="">Sign in</a></li>
          <li><a href="">New user</a></li>
        </ul>

        <div id="tab-container">
        <ul id="tabs" class="uk-switcher uk-margin">
          <li>
            <div id="login">              
              <form class="uk-form uk-form-stacked" action="usermgmt.php?action=login" method="post">
                <div class="uk-form-row">
                  <label for="username" class="uk-form-label">User name:</label>
                  <div class="uk-form-controls">
                    <input type="text" required autofocus class="form-control" name="username" id="username" placeholder="Your username">
                  </div>
                </div>
                <div class="uk-form-row">                                  
                  <label for="password" class="uk-form-label">Password:</label>
                  <div class="uk-form-controls">                  
                    <input type="password" required class="form-control" name="password" placeholder="Password">
                  </div>
                </div>
                <div class="uk-form-row">
                  <button type="submit" class="uk-button uk-button-primary primary-button" >Sign in</button>
                </div>
              </form>
            </div>
          </li>
          <li>
            <div id="register">
              <form class="uk-form uk-form-stacked" id="form-register" action="usermgmt.php?action=register" method="post">                

                <div class="uk-form-row">
                  <label for="new-username" class="uk-form-label">User name:</label>
                  <div class="uk-form-controls">
                    <input type="text" autofocus class="form-control" id="new-username" name="username" placeholder="Your username">
                  </div>
                </div>
                <div class="uk-form-row">
                  <label for="new-password" class="uk-form-label">Password:</label>
                  <div class="uk-form-controls">
                    <input type="password" class="form-control" id="new-password" name="password" placeholder="Password">
                  </div>
                </div>
                <div class="uk-form-row">
                  <label for="new-password2" class="uk-form-label">Repeat password:</label>
                  <div class="uk-form-controls">
                    <input type="password" class="form-control" id="new-password2" name="password2" placeholder="Repeat password">
                  </div>
                </div>
                <div class="uk-form-row">
                  <label for="new-full-name" class="uk-form-label">Full name:</label>
                  <div class="uk-form-controls">
                    <input type="text" class="form-control" id="new-full-name" name="full-name" placeholder="John Smith">
                  </div>
                </div>
                <div class="uk-form-row">
                  <label for="email" class="uk-form-label">Email:</label>                  
                  <div class="uk-form-controls">
                    <input type="email" class="form-control" id="email" name="email" placeholder="youremail@email.org" data-uk-tooltip="{pos:'right'}" title="Your email is only used if you need to reset your password.">
                  </div>
                </div>
                <div class="uk-form-row">
                  <label for="class" class="uk-form-label">Class:</label>
                  <div class="uk-form-controls">
                    <select class="form-control" name="class" id="class"  data-uk-tooltip="{pos:'right'}" title="If you are a student, select the class you are enrolled in.">
                      <option selected disabled hidden value='--'>Select a class if you are a student.</option>
                      <?php
                      $classes = db_get_classes();
                      foreach ($classes as $class)
                        echo "<option>{$class['class_name']}</option>";
                      ?>
                    </select>
                  </div>
                </div>
                <button type="submit" class="uk-button uk-button-primary primary-button" >Register</button>
              </form>
            </div>
          </li>
        </ul>
    </div>

      </div>
  </div>    
</div>


<script>

 function validate() {
   $.post("usermgmt.php?action=validate", $("#form-register").serialize()).done(function(data) {
     if (data.trim() == "") {
       $("#form-register").off("submit");
       $("#form-register").submit();
     } else {
       $("#alert-message").html(data);
       UIkit.modal('#alert').show();
     }
   });
   return false;
 };

 // Attach submit handler
 $("#form-register").on("submit", validate);
 

 <?php
 if (isset($_GET['alert'])) {
   echo "UIkit.modal('#alert').show();";     
 };
 if (isset($_GET['show']) && $_GET['show'] == 'register') {
   echo "$('#register-tab-link').click();";
 }
 ?>
 
</script>

<?php
write_footer($cfg);
?>
