'use strict'

/* eslint-disable max-len */
const path = require('path')

module.exports = variables => ({
  subject: 'Password Reset',
  html: `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
  <head>

    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width">
    <title>Boosted Boards Password Reset</title>
    <style>@media only screen {
  html {
    min-height: 100%;
    background: #f3f3f3;
  }
}

@media only screen and (max-width: 630px) {
  table.body img {
    width: auto;
    height: auto;
  }

  table.body center {
    min-width: 0 !important;
  }

  table.body .container {
    width: 100% !important;
  }

  table.body .columns {
    height: auto !important;
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    padding-left: 30px !important;
    padding-right: 30px !important;
  }

  th.small-12 {
    display: inline-block !important;
    width: 100% !important;
  }

  table.menu {
    width: 100% !important;
  }

  table.menu td,
  table.menu th {
    width: auto !important;
    display: inline-block !important;
  }

  table.menu.vertical td,
  table.menu.vertical th {
    display: block !important;
  }

  table.menu[align="center"] {
    width: auto !important;
  }
}

@media screen and (max-width: 596px) {
  .boosted-footer h3 {
    font-size: 20px;
  }
}</style>
  </head>
  <body style="-moz-box-sizing: border-box; -ms-text-size-adjust: 100%; -webkit-box-sizing: border-box; -webkit-text-size-adjust: 100%; Margin: 0; box-sizing: border-box; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; min-width: 100%; padding: 0; text-align: left; width: 100% !important">
    <span class="preheader" style="color: #f3f3f3; display: none !important; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; mso-hide: all !important; opacity: 0; overflow: hidden; visibility: hidden"></span>
    <table class="body" style="Margin: 0; background: #f3f3f3; border-collapse: collapse; border-spacing: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; height: 100%; line-height: 1.4; margin: 0; padding: 0; text-align: left; vertical-align: top; width: 100%">
      <tr style="padding: 0; text-align: left; vertical-align: top">
        <td class="center" align="center" valign="top" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; hyphens: auto; line-height: 1.4; margin: 0; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">
          <center data-parsed="" style="min-width: 600px; width: 100%">

            <table align="center" class="container float-center" style="Margin: 0 auto; background: #fefefe; border-collapse: collapse; border-spacing: 0; float: none; margin: 0 auto; padding: 0; text-align: center; vertical-align: top; width: 600px"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; hyphens: auto; line-height: 1.4; margin: 0; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">
              <span class="preheader" style="color: #f3f3f3; display: none !important; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; mso-hide: all !important; opacity: 0; overflow: hidden; visibility: hidden">
                It looks like you forgot your password. It's ok, just click the link below to create a new one.
              </span>
              <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="60px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 60px; font-weight: normal; hyphens: auto; line-height: 60px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
              <table class="row" style="border-collapse: collapse; border-spacing: 0; display: table; padding: 0; position: relative; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top">
                <th class="small-12 large-4 columns first" style="Margin: 0 auto; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 0; padding-bottom: 0; padding-left: 30px; padding-right: 15px; text-align: left; width: 170px"><table style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tr style="padding: 0; text-align: left; vertical-align: top"><th style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left"></th></tr></table></th>
                <th class="small-12 large-6 columns" style="Margin: 0 auto; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 0; padding-bottom: 0; padding-left: 15px; padding-right: 15px; text-align: left; width: 270px"><table style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tr style="padding: 0; text-align: left; vertical-align: top"><th style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left">
                  <a href="https://boostedboards.com/" target="_blank" style="Margin: 0; color: #ed5437; font-family: Arial, sans-serif; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left; text-decoration: none">
                    <center data-parsed="" style="min-width: 210px; width: 100%">
                      <img class="logo float-center" height="“35”" width="“144”" src="cid:boostedLogo" alt="Boosted Boards Logo" align="center" style="-ms-interpolation-mode: bicubic; Margin: 0 auto; border: none; clear: both; display: block; float: none; height: 35px; margin: 0 auto; max-width: 100%; outline: none; text-align: center; text-decoration: none; width: 144px">
                    </center>
                  </a>
                </th></tr></table></th>
                <th class="small-12 large-4 columns last" style="Margin: 0 auto; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 0; padding-bottom: 0; padding-left: 15px; padding-right: 30px; text-align: left; width: 170px"><table style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tr style="padding: 0; text-align: left; vertical-align: top"><th style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left"></th></tr></table></th>
              </tr></tbody></table>
              <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="64px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 64px; font-weight: normal; hyphens: auto; line-height: 64px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
              <table class="row" style="border-collapse: collapse; border-spacing: 0; display: table; padding: 0; position: relative; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top">
                <th class="small-12 large-12 columns first last" style="Margin: 0 auto; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 0; padding-bottom: 0; padding-left: 30px; padding-right: 30px; text-align: left; width: 570px"><table style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tr style="padding: 0; text-align: left; vertical-align: top"><th style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left">
                  <center data-parsed="" style="min-width: 510px; width: 100%">
                    <img class="password-reset-title float-center" height="“35”" width="“352”" src="cid:resetPasswordTitle" alt="Reset Your Password" align="center" style="-ms-interpolation-mode: bicubic; Margin: 0 auto; clear: both; display: block; float: none; margin: 0 auto; max-width: 100%; outline: none; text-align: center; text-decoration: none; width: 352px">
                  </center>
                </th>
<th class="expander" style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0 !important; text-align: left; visibility: hidden; width: 0"></th></tr></table></th>
              </tr></tbody></table>
              <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="90px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 90px; font-weight: normal; hyphens: auto; line-height: 90px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
              <table class="row" style="border-collapse: collapse; border-spacing: 0; display: table; padding: 0; position: relative; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top">
                <th class="content small-12 large-12 columns first last" style="Margin: 0 auto; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 0; padding-bottom: 0; padding-left: 30px; padding-right: 30px; text-align: left; width: 570px"><table style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tr style="padding: 0; text-align: left; vertical-align: top"><th style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left">
                  <hr noshade="" class="divider" style="border-color: #e8eded">
                  <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="28px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 28px; font-weight: normal; hyphens: auto; line-height: 28px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
                  <p class="first-line" style="Margin: 0; Margin-bottom: 10px; color: #666; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; hyphens: none; line-height: 1.4; margin: 0; margin-bottom: 28px; padding: 0; text-align: left">Hey,</p>
                  <p style="Margin: 0; Margin-bottom: 10px; color: #666; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; hyphens: none; line-height: 1.4; margin: 0; margin-bottom: 10px; padding: 0; text-align: left">
                    It looks like you forgot your password. It's ok, just click the link below to create a new one.
                  </p>
                  <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="30px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 30px; font-weight: normal; hyphens: auto; line-height: 30px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
                  <table class="button expanded button-cta" style="Margin: 0 0 0 0; border-collapse: collapse; border-spacing: 0; margin: 0 0 0 0; padding: 0; text-align: left; text-transform: uppercase; vertical-align: top; width: 100% !important"><tr style="padding: 0; text-align: left; vertical-align: top"><td style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; hyphens: auto; line-height: 1.4; margin: 0; padding: 0; text-align: left; transition: 0.25s ease-in; vertical-align: top; word-wrap: break-word"><table style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tr style="padding: 0; text-align: left; vertical-align: top"><td style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; background: #ed5437; border: 0; border-collapse: collapse !important; color: #fefefe; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; hyphens: auto; line-height: 1.4; margin: 0; padding: 0; text-align: left; transition: 0.25s ease-in; vertical-align: top; word-wrap: break-word"><center data-parsed="" style="min-width: 0; width: 100%"><a href="${variables.link}" align="center" class="float-center" style="Margin: 0; border: 0 solid #ed5437; border-radius: 3px; color: #fefefe; display: inline-block; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; line-height: 1.4; margin: 0; padding: 2px 16px 2px 16px; padding-left: 0; padding-right: 0; text-align: center; text-decoration: none; width: 100%">
                    <center data-parsed="" style="min-width: 0; width: 100%">
                      <img class="button-text password-reset-cta float-center" height="“58”" width="“168”" src="cid:resetPasswordButton" alt="Reset Your Password" align="center" style="-ms-interpolation-mode: bicubic; Margin: 0 auto; border: none; clear: both; display: block; float: none; margin: 0 auto; max-width: 100%; outline: none; text-align: center; text-decoration: none; text-transform: uppercase; width: 168px">
                    </center>
                  </a></center></td></tr></table></td>
<td class="expander" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; hyphens: auto; line-height: 1.4; margin: 0; padding: 0 !important; text-align: left; transition: 0.25s ease-in; vertical-align: top; visibility: hidden; width: 0; word-wrap: break-word"></td></tr></table>
                  <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="28px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 28px; font-weight: normal; hyphens: auto; line-height: 28px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
                  <p style="Margin: 0; Margin-bottom: 10px; color: #666; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; hyphens: none; line-height: 1.4; margin: 0; margin-bottom: 10px; padding: 0; text-align: left">
                    Keep rockin'!<br>
                    Your Boosted team
                  </p>
                  <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="28px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 28px; font-weight: normal; hyphens: auto; line-height: 28px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
                  <hr noshade="" class="divider" style="border-color: #e8eded">
                </th>
<th class="expander" style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0 !important; text-align: left; visibility: hidden; width: 0"></th></tr></table></th>
              </tr></tbody></table>
            </td></tr></tbody></table>
            <table align="center" class="container boosted-footer float-center" style="Margin: 0 auto; background: #fefefe; border-collapse: collapse; border-spacing: 0; float: none; margin: 0 auto; padding: 0; text-align: center; vertical-align: top; width: 600px"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; hyphens: auto; line-height: 1.4; margin: 0; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">
              <table class="row" style="border-collapse: collapse; border-spacing: 0; display: table; padding: 0; position: relative; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top">
                <th class="small-12 large-12 columns first last" style="Margin: 0 auto; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 0; padding-bottom: 0; padding-left: 30px; padding-right: 30px; text-align: left; width: 570px"><table style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tr style="padding: 0; text-align: left; vertical-align: top"><th style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left">
                  <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="43px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 43px; font-weight: normal; hyphens: auto; line-height: 43px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
                  <h3 class="text-center" style="Margin: 0; Margin-bottom: 0; color: #999; font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; line-height: 1.4; margin: 0; margin-bottom: 0; padding: 0; text-align: center; word-wrap: normal">Thanks for using Boosted App</h3>
                  <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="19px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 19px; font-weight: normal; hyphens: auto; line-height: 19px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
                  <p class="text-center" style="Margin: 0; Margin-bottom: 10px; color: #999; font-family: Arial, sans-serif; font-size: 14px; font-weight: normal; line-height: 1.4; margin: 0; margin-bottom: 10px; padding: 0; text-align: center">
                    <a href="https://boostedboards.com/" target="_blank" style="Margin: 0; color: #999; font-family: Arial, sans-serif; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left; text-decoration: none">
                      www.boostedboards.com
                    </a>
                  </p>
                  <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="36px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 36px; font-weight: normal; hyphens: auto; line-height: 36px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
                </th>
<th class="expander" style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0 !important; text-align: left; visibility: hidden; width: 0"></th></tr></table></th>
              </tr></tbody></table>
            </td></tr></tbody></table>
            <table class="spacer float-center" style="Margin: 0 auto; border-collapse: collapse; border-spacing: 0; float: none; margin: 0 auto; padding: 0; text-align: center; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="28px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 28px; font-weight: normal; hyphens: auto; line-height: 28px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
            <table align="center" class="row float-center" style="Margin: 0 auto; border-collapse: collapse; border-spacing: 0; float: none; margin: 0 auto; padding: 0; position: relative; text-align: center; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top">
              <th class="small-12 large-12 columns first last" style="Margin: 0 auto; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 0; padding-bottom: 0; padding-left: 30px; padding-right: 30px; text-align: left; width: 570px"><table style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tr style="padding: 0; text-align: left; vertical-align: top"><th style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left">
                <center data-parsed="" style="min-width: 510px; width: 100%">
                  <table align="center" class="menu float-center" style="Margin: 0 auto; border-collapse: collapse; border-spacing: 0; float: none; margin: 0 auto; padding: 0; text-align: center; vertical-align: top; width: auto !important"><tr style="padding: 0; text-align: left; vertical-align: top"><td style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; hyphens: auto; line-height: 1.4; margin: 0; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word"><table style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tr style="padding: 0; text-align: left; vertical-align: top">
                    <th class="menu-item float-center" style="Margin: 0 auto; color: #1a1a1a; float: none; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 10px; padding-right: 10px; text-align: center"><a href="https://twitter.com/BoostedBoards" target="_blank" style="Margin: 0; color: #ed5437; font-family: Arial, sans-serif; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left; text-decoration: none">
                      <img class="footer-icon" height="“28”" width="“28”" src="cid:twitterIcon" alt="Boosted on Twitter" style="-ms-interpolation-mode: bicubic; border: none; clear: both; display: block; height: 28px; margin: 0 6px; max-width: 100%; outline: none; text-decoration: none; width: 28px">
                    </a></th>
                    <th class="menu-item float-center" style="Margin: 0 auto; color: #1a1a1a; float: none; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 10px; padding-right: 10px; text-align: center"><a href="https://www.instagram.com/boostedboards/" target="_blank" style="Margin: 0; color: #ed5437; font-family: Arial, sans-serif; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left; text-decoration: none">
                      <img class="footer-icon" height="“28”" width="“28”" src="cid:instagramIcon" alt="Boosted on Instagram" style="-ms-interpolation-mode: bicubic; border: none; clear: both; display: block; height: 28px; margin: 0 6px; max-width: 100%; outline: none; text-decoration: none; width: 28px">
                    </a></th>
                    <th class="menu-item float-center" style="Margin: 0 auto; color: #1a1a1a; float: none; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 10px; padding-right: 10px; text-align: center"><a href="https://www.facebook.com/BoostedBoards/" target="_blank" style="Margin: 0; color: #ed5437; font-family: Arial, sans-serif; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left; text-decoration: none">
                      <img class="footer-icon" height="“28”" width="“28”" src="cid:facebookIcon" alt="Boosted on Facebook" style="-ms-interpolation-mode: bicubic; border: none; clear: both; display: block; height: 28px; margin: 0 6px; max-width: 100%; outline: none; text-decoration: none; width: 28px">
                    </a></th>
                  </tr></table></td></tr></table>
                </center>
              </th>
<th class="expander" style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0 !important; text-align: left; visibility: hidden; width: 0"></th></tr></table></th>
            </tr></tbody></table>
            <table align="center" class="row float-center" style="Margin: 0 auto; border-collapse: collapse; border-spacing: 0; float: none; margin: 0 auto; padding: 0; position: relative; text-align: center; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top">
              <th class="footer-lines small-12 large-12 columns first last" style="Margin: 0 auto; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0 auto; padding: 0; padding-bottom: 0; padding-left: 30px; padding-right: 30px; text-align: left; width: 570px"><table style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tr style="padding: 0; text-align: left; vertical-align: top"><th style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left">
                <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="28px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 28px; font-weight: normal; hyphens: auto; line-height: 28px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
                <p class="text-center footer-line" style="Margin: 0; Margin-bottom: 10px; color: #999; font-family: Arial, sans-serif; font-size: 13px; font-weight: normal; line-height: 1.4; margin: 0; margin-bottom: 10px; padding: 0; text-align: center">
                  Questions or concerns?
                  <a href="mailto:help@boosterboards.com" target="_top" style="Margin: 0; color: #999; font-family: Arial, sans-serif; font-weight: normal; line-height: 1.4; margin: 0; padding: 0; text-align: left; text-decoration: underline">help@boostedboards.com</a>
                </p>
                <table class="spacer" style="border-collapse: collapse; border-spacing: 0; padding: 0; text-align: left; vertical-align: top; width: 100%"><tbody><tr style="padding: 0; text-align: left; vertical-align: top"><td height="50px" style="-moz-hyphens: auto; -webkit-hyphens: auto; Margin: 0; border-collapse: collapse !important; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 50px; font-weight: normal; hyphens: auto; line-height: 50px; margin: 0; mso-line-height-rule: exactly; padding: 0; text-align: left; vertical-align: top; word-wrap: break-word">&#xA0;</td></tr></tbody></table>
              </th>
<th class="expander" style="Margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.4; margin: 0; padding: 0 !important; text-align: left; visibility: hidden; width: 0"></th></tr></table></th>
            </tr></tbody></table>

          </center>
        </td>
      </tr>
    </table>
    <!-- prevent Gmail on iOS font size manipulation -->
   <div style="display:none; white-space:nowrap; font:15px courier; line-height:0"> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </div>
  </body>
</html>`,

  attachments: [
    {
      path: path.join(__dirname, 'images/logo.png'),
      cid: 'boostedLogo',
    },
    {
      path: path.join(__dirname, 'images/password_reset_title.png'),
      cid: 'resetPasswordTitle',
    },
    {
      path: path.join(__dirname, 'images/password_reset_cta.png'),
      cid: 'resetPasswordButton',
    },
    {
      path: path.join(__dirname, 'images/icon-twitter.png'),
      cid: 'twitterIcon',
    },
    {
      path: path.join(__dirname, 'images/icon-instagram.png'),
      cid: 'instagramIcon',
    },
    {
      path: path.join(__dirname, 'images/icon-facebook.png'),
      cid: 'facebookIcon',
    },
  ],
})
