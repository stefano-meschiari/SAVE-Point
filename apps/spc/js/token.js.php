<?php
header("Content-Type: text/javascript; charset=utf-8");
if (file_exists('../data/glambslae12335r_salt.txt'))
  $salt = file_get_contents('../data/glambslae12335r_salt.txt');
else
  $salt = '';
$token = md5($salt . $_SERVER['REMOTE_ADDR'] . date('DjYH'));


$NOTICE = <<<EOD
Hello there! I am the author of the game. Hope you are enjoying it!

The following is a short-ish message to would-be 'hackers' (jump down for the
TLDR).

If you are reading this, you might be trying to figure out how to send bogus
points, or you have already figured it out.

*I am well aware that there are vulnerabilities in the way the leaderboard is
 implemented.*

Before you go ahead and deface the leaderboard, consider this:

(1) As mentioned, I am already aware it is possible to do it! No need to put up
fake points up to prove you can. I already know.

(2) It's not even hard to do! Is it worth it? This is a little educational game
I made for adults and children to have fun with. The leaderboard motivates
them. If you're showing off for your friends, I doubt they'll be impressed.

(3) I am not sure how to prevent the vulnerability, for many reasons, including:
(a) I can't check the entire calculation server-side because of limited
resources, (b) the N-body problem is chaotic, so there is no way to check
*accurately* because of floating point+ODE madness, and (c) it's not worth my
time to keep patching and finding new ways to make it harder to exploit. I am
_not_ a professional programmer, I am an astronomer -- this is a game I made for
people to enjoy, not to make money.

If you have a better idea on how to prevent bogus points from being served to
the PHP component, contact me via email or Twitter! Both are on website. I would
love to hear your ideas, and you can actually help me improve the game. 

TLDR:

- It's not very hard to hack the leaderboard. You are not particularly
skilled if you do.  It does not make you edgy to post profanity.

- If you have a better idea on how to handle verification of points, I'm eager
to listen, shoot me an email or contact me via Twitter (see website).

- It might be impossible to do point verification 100% right: it's a
Bug in Nature (tm).

Remember they are all fake Internet points anyway!

Love, -StefanoM

EOD;

$NOTICE = explode("\n", $NOTICE);
echo "\"\\\n";

foreach ($NOTICE as $line) {
  echo str_pad($line, 85) . "\\\n";
}
echo "\"\n";
?>
UI.setToken(encodeURIComponent("<?= $token ?>"));
