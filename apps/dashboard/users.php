<?php

require_once('../../share/startup.php');
require_once('db.php');
require_once('messages.php');

$cfg = init();
write_header($cfg);


?>
<?php write_js_requires($cfg); ?>
<div id="app-screen">

  
  <div id="app-user">
    <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="alert" aria-hidden="true" id="alert">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-body">
            <span id="alert-message"><?= $ERROR_MESSAGES[$_GET['alert']] ?></span>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <ul class="nav nav-tabs" role="tablist" id="tabs">
      <li class="active"><a href="#login" role="tab" data-toggle="tab">Sign in</a></li>
      <li><a href="#register" id="register-tab-link" role="tab" data-toggle="tab">New user</a></li>
    </ul>
    
    <div class="tab-content">
      <div class="tab-pane fade in active" id="login">
        
        <form role="form" action="usermgmt.php?action=login" method="post">
          <div class="form-group">
            <label for="username">User name:</label>
            <input type="text" required autofocus class="form-control" name="username" id="username" placeholder="Your username">
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" required class="form-control" name="password" placeholder="Password">
          </div>
          <a href="forgot.php">Forgot your username or password?</a>

          <div class="separator-center"></div>
          <button type="submit" class="btn btn-primary btn-lg pull-right" >Sign in</button>
          <div class="clear"></div>          
        </form>
      </div>
              
      <div class="tab-pane fade" id="register">
        <form role="form" id="form-register" action="usermgmt.php?action=register" method="post">
          <div class="form-group">
            <label for="class">Class:</label>
            <div class="pull-right font-s">Select the class you are enrolled in.</div>
            <select class="form-control" name="class" id="class">
              <option selected disabled hidden value=''>Select a class.</option>
              <?php
              $classes = db_get_classes();
              foreach ($classes as $class)
                echo "<option>{$class['class_name']}</option>";
              ?>
            </select>
          </div>
          <div class="form-group">
            <label for="new-username">User name:</label>
            <input type="text" autofocus class="form-control" id="new-username" name="username" placeholder="Your username">
          </div>
          <div class="form-group">
            <label for="new-password">Password:</label>
            <input type="password" class="form-control" id="new-password" name="password" placeholder="Password">
          </div>
          <div class="form-group">
            <label for="new-password2">Repeat password:</label>
            <input type="password" class="form-control" id="new-password2" name="password2" placeholder="Repeat password">
          </div>
          <div class="form-group">
            <label for="new-full-name">Full name:</label>
            <input type="text" class="form-control" id="new-full-name" name="full-name" placeholder="John Smith">
          </div>
          <div class="form-group">
            <label for="email">Email:</label>
            <div class="pull-right font-s">Your email is only used if you need to reset your password.</div>
            <input type="email" class="form-control" id="email" name="email" placeholder="youremail@email.org">
            
          </div>
          <div class="separator-center"></div>
          <button type="submit" class="btn btn-primary btn-lg pull-right" >Register</button>
          <div class="clear"></div>

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
       $("#alert").modal();
     }
   });
   return false;
 };

 // Attach submit handler
 $("#form-register").on("submit", validate);
 
 // Activate tabs
 $('#tabs a').click(function (e) {
  e.preventDefault();
  $(this).tab('show');
 });
 

 <?php
 if (isset($_GET['alert'])) {
   echo "$('#alert').modal();";
   
 };
 if (isset($_GET['show']) && $_GET['show'] == 'register') {
   echo "$('#register-tab-link').click();";
 }
 ?>
 
</script>

<?php
write_footer($cfg);
?>
